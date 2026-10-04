"""
FileForge — Plugin Manager Service (v2.0)
Handles plugin discovery, installation, uninstallation, and execution.
"""
import asyncio
import hashlib
import io
import json
import os
import shutil
import time
import zipfile
from pathlib import Path
from typing import Any, Optional
from uuid import uuid4

import httpx

from config import (
    CACHE_DIR,
    DATA_DIR,
    PLUGINS_DIR,
    BUILTIN_PLUGINS_DIR,
    PLUGIN_REGISTRY_CACHE_TTL,
    PLUGIN_REGISTRY_URL,
    TEMP_DIR,
    APP_VERSION,
)


class PluginManager:
    """
    Core plugin lifecycle manager.

    Responsibilities:
    - scan()         : Discover installed plugins by reading manifest.json files
    - get_registry() : Fetch remote registry (with local cache + TTL)
    - install()      : Download, verify checksum, extract plugin zip
    - uninstall()    : Remove plugin directory
    - execute()      : Run a plugin tool via subprocess
    """

    REQUIRED_MANIFEST_FIELDS = {"id", "name", "version", "tools"}

    def __init__(self):
        # Ensure directories exist
        PLUGINS_DIR.mkdir(parents=True, exist_ok=True)
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        TEMP_DIR.mkdir(parents=True, exist_ok=True)

        self._installed: dict[str, dict] = {}
        self.scan()

    # ─── Discovery ────────────────────────────────────────────────

    def scan(self) -> dict[str, dict]:
        """
        Walk PLUGINS_DIR, parse each manifest.json, and populate the
        installed plugins registry.  Returns {plugin_id: manifest_dict}.
        """
        self._installed.clear()

        for base_dir in [BUILTIN_PLUGINS_DIR, PLUGINS_DIR]:
            if not base_dir.exists():
                continue

            for plugin_dir in base_dir.iterdir():
                if not plugin_dir.is_dir():
                    continue

                manifest_path = plugin_dir / "manifest.json"
                if not manifest_path.exists():
                    continue

                try:
                    manifest = json.loads(manifest_path.read_text("utf-8-sig"))
                    if not self._validate_manifest(manifest):
                        print(f"[PluginManager] Invalid manifest in {plugin_dir.name}, skipping")
                        continue
                    # Attach the resolved directory so execute() can find the binary
                    manifest["_dir"] = str(plugin_dir)
                    
                    # Mark if it's a builtin plugin (cannot be uninstalled)
                    if base_dir == BUILTIN_PLUGINS_DIR:
                        manifest["_builtin"] = True
                        
                    self._installed[manifest["id"]] = manifest
                except (json.JSONDecodeError, KeyError) as exc:
                    print(f"[PluginManager] Error reading {manifest_path}: {exc}")
                    continue

        print(f"[PluginManager] Scanned {len(self._installed)} installed plugin(s)")
        return self._installed

    def get_installed(self) -> dict[str, dict]:
        """Return the currently known installed plugins."""
        return self._installed

    def get_plugin(self, plugin_id: str) -> Optional[dict]:
        """Get a single installed plugin manifest, or None."""
        return self._installed.get(plugin_id)

    # ─── Registry (Remote Store) ──────────────────────────────────

    async def get_registry(self, force_refresh: bool = False) -> dict:
        """
        Fetch the remote plugin registry.
        Uses a local cache file with a configurable TTL to avoid
        hitting GitHub on every request.
        """
        cache_path = CACHE_DIR / "registry.json"

        # Override for local testing
        local_registry = Path(r"C:\Users\ADMIN\Documents\GitHub\fileforge-plugins\registry.json")
        if local_registry.exists():
            try:
                registry = json.loads(local_registry.read_text("utf-8-sig"))
                cache_path.write_text(json.dumps(registry, indent=2), "utf-8")
                return registry
            except Exception as e:
                print(f"[PluginManager] Failed to read local registry: {e}")


        # Check cache freshness
        if not force_refresh and cache_path.exists():
            age = time.time() - cache_path.stat().st_mtime
            if age < PLUGIN_REGISTRY_CACHE_TTL:
                try:
                    return json.loads(cache_path.read_text("utf-8"))
                except (json.JSONDecodeError, OSError):
                    pass  # Fall through to fetch

        # Fetch from remote
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(PLUGIN_REGISTRY_URL)
                resp.raise_for_status()
                registry = resp.json()

            # Write cache
            cache_path.write_text(json.dumps(registry, indent=2), "utf-8")
            return registry

        except Exception as exc:
            print(f"[PluginManager] Failed to fetch registry: {exc}")
            # Fallback to stale cache
            if cache_path.exists():
                try:
                    return json.loads(cache_path.read_text("utf-8"))
                except Exception:
                    pass
            # Return empty if no cache at all
            return {"schema_version": "1.0.0", "plugins": []}

    async def get_store_list(self) -> list[dict]:
        """
        Convenience method: fetch registry and annotate each plugin
        with its local install status.
        """
        registry = await self.get_registry()
        plugins = registry.get("plugins", [])

        for plugin in plugins:
            pid = plugin["id"]
            installed = self._installed.get(pid)
            if installed:
                plugin["installed"] = True
                plugin["installed_version"] = installed["version"]
                plugin["update_available"] = (
                    plugin.get("version", "0") != installed["version"]
                )
            else:
                plugin["installed"] = False
                plugin["installed_version"] = None
                plugin["update_available"] = False

        return plugins

    # ─── Install / Uninstall ──────────────────────────────────────

    async def install(self, plugin_id: str) -> dict:
        """
        Download and install a plugin from the registry.

        1. Fetch registry to find the plugin entry
        2. Download the .zip from download_url
        3. Verify SHA256 checksum (if provided)
        4. Extract to PLUGINS_DIR / plugin_id /
        5. Validate extracted manifest.json
        6. Re-scan installed plugins

        Returns the installed manifest dict.
        Raises ValueError or RuntimeError on failure.
        """
        registry = await self.get_registry()
        entry = None
        for p in registry.get("plugins", []):
            if p["id"] == plugin_id:
                entry = p
                break

        if entry is None:
            raise ValueError(f"Plugin '{plugin_id}' not found in registry")

        download_url = entry.get("download_url")
        if not download_url:
            raise ValueError(f"Plugin '{plugin_id}' has no download URL")

        expected_checksum = entry.get("checksum_sha256")

        # Check core version compatibility
        min_core = entry.get("min_core_version")
        if min_core and not self._version_gte(APP_VERSION, min_core):
            raise ValueError(
                f"Plugin requires FileForge >= {min_core}, "
                f"but you are running {APP_VERSION}"
            )

        # LOCAL DEVELOPMENT BYPASS
        local_dev_dir = Path(r"C:\Users\ADMIN\Documents\GitHub\fileforge-plugins\plugins") / plugin_id
        target_dir = PLUGINS_DIR / plugin_id
        
        if local_dev_dir.exists() and local_dev_dir.is_dir():
            print(f"[PluginManager] Local dev repo found for {plugin_id}, copying directly...")
            if target_dir.exists():
                shutil.rmtree(target_dir)
            shutil.copytree(local_dev_dir, target_dir)
            
            self.scan()
            return self.get_plugin(plugin_id)

        # Download
        print(f"[PluginManager] Downloading {plugin_id} from {download_url}")
        try:
            async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
                resp = await client.get(download_url)
                resp.raise_for_status()
                zip_bytes = resp.content
        except Exception as exc:
            raise RuntimeError(f"Download failed: {exc}")

        # Verify checksum
        if expected_checksum:
            actual = hashlib.sha256(zip_bytes).hexdigest()
            if actual != expected_checksum:
                raise RuntimeError(
                    f"Checksum mismatch for {plugin_id}! "
                    f"Expected {expected_checksum[:12]}..., got {actual[:12]}..."
                )

        # Extract
        target_dir = PLUGINS_DIR / plugin_id
        if target_dir.exists():
            shutil.rmtree(target_dir)

        try:
            with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
                # Security: check for path traversal
                for name in zf.namelist():
                    if name.startswith("/") or ".." in name:
                        raise RuntimeError(
                            f"Unsafe path in zip: {name}"
                        )
                zf.extractall(target_dir)
        except zipfile.BadZipFile:
            raise RuntimeError("Downloaded file is not a valid zip archive")

        # If the zip contains a single subdirectory, flatten it
        contents = list(target_dir.iterdir())
        if (
            len(contents) == 1
            and contents[0].is_dir()
            and (contents[0] / "manifest.json").exists()
        ):
            inner_dir = contents[0]
            for item in inner_dir.iterdir():
                shutil.move(str(item), str(target_dir / item.name))
            inner_dir.rmdir()

        # Validate manifest exists
        manifest_path = target_dir / "manifest.json"
        if not manifest_path.exists():
            shutil.rmtree(target_dir)
            raise RuntimeError(
                f"Plugin '{plugin_id}' is missing manifest.json after extraction"
            )

        # Re-scan
        self.scan()

        installed = self._installed.get(plugin_id)
        if not installed:
            raise RuntimeError(
                f"Plugin '{plugin_id}' installed but manifest is invalid"
            )

        print(f"[PluginManager] ✅ Installed {plugin_id} v{installed['version']}")
        return installed

    async def uninstall(self, plugin_id: str) -> bool:
        """Remove a plugin from disk and re-scan."""
        installed = self._installed.get(plugin_id)
        if not installed:
            raise ValueError(f"Plugin '{plugin_id}' is not installed")
        if installed.get("_builtin"):
            raise ValueError(f"Plugin '{plugin_id}' is a core built-in and cannot be uninstalled")

        target_dir = PLUGINS_DIR / plugin_id
        if not target_dir.exists():
            raise ValueError(f"Plugin '{plugin_id}' directory not found")

        shutil.rmtree(target_dir)
        self.scan()
        print(f"[PluginManager] 🗑️ Uninstalled {plugin_id}")
        return True

    # ─── Execution ────────────────────────────────────────────────

    async def execute(
        self,
        plugin_id: str,
        tool_id: str,
        input_path: Path,
        options: dict[str, Any],
    ) -> Path:
        """
        Execute a plugin tool via subprocess.

        1. Look up the plugin manifest and find the tool definition
        2. Create a unique temp output path
        3. Build the command by replacing {placeholders} in the args template
        4. Run subprocess with timeout
        5. Return the output file path

        Raises RuntimeError on failure or timeout.
        """
        manifest = self._installed.get(plugin_id)
        if not manifest:
            raise ValueError(f"Plugin '{plugin_id}' is not installed")

        # Find the tool
        tool = None
        for t in manifest.get("tools", []):
            if t["id"] == tool_id:
                tool = t
                break
        if tool is None:
            raise ValueError(
                f"Tool '{tool_id}' not found in plugin '{plugin_id}'"
            )

        plugin_dir = Path(manifest["_dir"])

        # Determine output extension
        output_ext = self._resolve_output_ext(tool, options, input_path)
        output_path = TEMP_DIR / f"{uuid4().hex}{output_ext}"

        # Build command
        executable = plugin_dir / tool["command"]
        if not executable.exists():
            raise RuntimeError(
                f"Plugin executable not found: {executable}"
            )

        cmd = [str(executable)]
        for arg_template in tool.get("args", []):
            arg = (
                arg_template
                .replace("{input_file}", str(input_path))
                .replace("{output_file}", str(output_path))
                .replace("{input_name}", input_path.stem)
                .replace("{input_ext}", input_path.suffix.lstrip("."))
            )
            # Replace option placeholders
            for opt_id, opt_val in options.items():
                arg = arg.replace(f"{{{opt_id}}}", str(opt_val))
            cmd.append(arg)

        # .bat/.cmd files need cmd.exe /c on Windows
        if os.name == "nt" and executable.suffix.lower() in (".bat", ".cmd"):
            cmd = ["cmd.exe", "/c"] + cmd

        timeout = tool.get("timeout_seconds", 120)

        print(f"[PluginManager] Executing: {' '.join(cmd)}")

        try:
            # CREATE_NO_WINDOW flag for Windows
            creation_flags = 0x08000000 if os.name == "nt" else 0
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(plugin_dir),
                creationflags=creation_flags,
            )
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(), timeout=timeout
            )
        except asyncio.TimeoutError:
            proc.kill()
            raise RuntimeError(
                f"Plugin '{plugin_id}/{tool_id}' timed out after {timeout}s"
            )

        if proc.returncode != 0:
            err_msg = stderr.decode("utf-8", errors="replace").strip()
            raise RuntimeError(
                f"Plugin error (exit code {proc.returncode}): {err_msg}"
            )

        # Verify output file exists
        if not output_path.exists() or output_path.stat().st_size == 0:
            raise RuntimeError(
                f"Plugin produced no output (expected: {output_path.name})"
            )

        return output_path

    # ─── Internal Helpers ─────────────────────────────────────────

    def _validate_manifest(self, manifest: dict) -> bool:
        """Check that a manifest has the minimum required fields."""
        return self.REQUIRED_MANIFEST_FIELDS.issubset(manifest.keys())

    @staticmethod
    def _version_gte(current: str, required: str) -> bool:
        """Check if current version >= required version (semver-like)."""
        def parse(v: str) -> tuple:
            return tuple(int(x) for x in v.replace("v", "").split("."))
        try:
            return parse(current) >= parse(required)
        except (ValueError, TypeError):
            return False

    @staticmethod
    def _resolve_output_ext(
        tool: dict, options: dict, input_path: Path
    ) -> str:
        """Determine the output file extension from the tool definition."""
        output_spec = tool.get("output", {})
        naming = output_spec.get("naming", "")

        # Check if naming template specifies a format option
        if "{format}" in naming and "format" in options:
            ext = options["format"]
            return f".{ext}" if not ext.startswith(".") else ext

        # Check if naming uses the input extension
        if "{input_ext}" in naming:
            return input_path.suffix

        # Default: keep input extension
        return input_path.suffix


# ─── Singleton ────────────────────────────────────────────────────
# Created once at import time, used by the router.
plugin_manager = PluginManager()
