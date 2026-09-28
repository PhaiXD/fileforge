"""
FileForge — System Service
Handles version checking, auto-update via GitHub, and system health.
"""
import asyncio
import subprocess
from pathlib import Path
from typing import Any, Dict, Optional

import httpx

from config import APP_VERSION, BASE_DIR, GITHUB_API_URL, GITHUB_REPO_URL, TEMP_DIR


async def get_current_version() -> str:
    """Return the current app version."""
    return APP_VERSION


async def check_for_update() -> Dict[str, Any]:
    """
    Check GitHub for the latest version by reading the remote config.py
    or using GitHub tags/releases.
    Returns dict with update info.
    """
    current_version = await get_current_version()
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Try to get latest release from GitHub API
            response = await client.get(
                f"{GITHUB_API_URL}/releases/latest",
                headers={"Accept": "application/vnd.github.v3+json"},
            )

            if response.status_code == 200:
                data = response.json()
                latest_version = data.get("tag_name", "").lstrip("v")
                
                # Check if update is available (simple string comparison, assumes semantic versioning)
                # Remove "v" prefix from current version if it exists
                curr_ver = current_version.lstrip("v")
                update_available = latest_version != curr_ver and latest_version != ""
                
                return {
                    "current_version": current_version,
                    "latest_version": latest_version,
                    "update_available": update_available,
                    "release_notes": data.get("body", ""),
                    "release_url": data.get("html_url", ""),
                }

            # Fallback: check tags
            response = await client.get(
                f"{GITHUB_API_URL}/tags",
                headers={"Accept": "application/vnd.github.v3+json"},
            )

            if response.status_code == 200:
                tags = response.json()
                if tags:
                    latest_tag = tags[0].get("name", "").lstrip("v")
                    curr_ver = current_version.lstrip("v")
                    return {
                        "current_version": current_version,
                        "latest_version": latest_tag,
                        "update_available": latest_tag != curr_ver and latest_tag != "",
                        "release_notes": "",
                        "release_url": f"{GITHUB_REPO_URL}/releases",
                    }

            # No releases or tags found
            return {
                "current_version": current_version,
                "latest_version": current_version,
                "update_available": False,
                "release_notes": "",
                "release_url": "",
            }

    except Exception as e:
        return {
            "current_version": current_version,
            "latest_version": "unknown",
            "update_available": False,
            "error": str(e),
        }


import sys
import os
import zipfile
import aiofiles

async def perform_update() -> Dict[str, Any]:
    """
    Perform an update. If running from source, do `git pull`.
    If running as a frozen executable, download the latest release asset and replace the current executable.
    Returns the result of the operation.
    """
    is_frozen = getattr(sys, 'frozen', False)
    
    if is_frozen:
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                response = await client.get(
                    f"{GITHUB_API_URL}/releases/latest",
                    headers={"Accept": "application/vnd.github.v3+json"},
                )
                if response.status_code != 200:
                    return {"success": False, "message": "Could not fetch latest release info.", "requires_restart": False}
                
                data = response.json()
                assets = data.get("assets", [])
                if not assets:
                    return {"success": False, "message": "No release assets found.", "requires_restart": False}
                
                # Find zip or exe asset
                target_asset = None
                for asset in assets:
                    if asset["name"].endswith(".zip") or asset["name"].endswith(".exe"):
                        target_asset = asset
                        break
                
                if not target_asset:
                    return {"success": False, "message": "No suitable update file found (.zip or .exe).", "requires_restart": False}
                
                download_url = target_asset["browser_download_url"]
                asset_name = target_asset["name"]
                
                update_dir = TEMP_DIR / "update"
                update_dir.mkdir(parents=True, exist_ok=True)
                download_path = update_dir / asset_name
                
                # Download
                async with client.stream("GET", download_url) as r:
                    r.raise_for_status()
                    async with aiofiles.open(download_path, "wb") as f:
                        async for chunk in r.aiter_bytes():
                            await f.write(chunk)
                
                new_exe_path = download_path
                if asset_name.endswith(".zip"):
                    # Extract zip
                    with zipfile.ZipFile(download_path, 'r') as zip_ref:
                        zip_ref.extractall(update_dir)
                    # Find exe recursively in case it's inside a folder in the zip
                    extracted_exes = list(update_dir.rglob("*.exe"))
                    if not extracted_exes:
                        return {"success": False, "message": "No executable found inside the downloaded zip.", "requires_restart": False}
                    new_exe_path = extracted_exes[0]
                
                # Replace current exe (The Windows File Lock workaround)
                current_exe = Path(sys.executable)
                old_exe = current_exe.with_name(f"{current_exe.stem}_old.exe")
                
                # Remove old backup if exists
                if old_exe.exists():
                    try:
                        old_exe.unlink()
                    except Exception:
                        pass # Ignore if we can't remove an older backup
                
                # Rename current running exe
                os.rename(current_exe, old_exe)
                
                # Copy new exe to current location
                import shutil
                shutil.copy2(new_exe_path, current_exe)
                
                return {
                    "success": True,
                    "message": "Update downloaded and installed successfully! Please restart the application.",
                    "requires_restart": True,
                }
                
        except Exception as e:
            err_msg = str(e) or repr(e)
            return {
                "success": False,
                "message": f"Update error ({type(e).__name__}): {err_msg}",
                "requires_restart": False,
            }
    
    # Not frozen, use git pull
    try:
        def _run_git():
            return subprocess.run(
                ["git", "pull", "--rebase"],
                cwd=str(BASE_DIR),
                capture_output=True,
                text=True,
                check=False
            )
        
        process = await asyncio.to_thread(_run_git)

        stdout_text = process.stdout
        stderr_text = process.stderr

        if process.returncode == 0:
            return {
                "success": True,
                "message": stdout_text.strip() or "Update complete!",
                "requires_restart": True,
            }
        else:
            return {
                "success": False,
                "message": f"Update failed: {stderr_text.strip()}",
                "requires_restart": False,
            }

    except FileNotFoundError:
        return {
            "success": False,
            "message": "Git is not installed or not in PATH.",
            "requires_restart": False,
        }
    except Exception as e:
        err_msg = str(e) or repr(e)
        return {
            "success": False,
            "message": f"Update error ({type(e).__name__}): {err_msg}",
            "requires_restart": False,
        }


async def check_dependencies() -> Dict[str, bool]:
    """
    Check if required external dependencies are installed.
    """
    deps = {}

    # Check yt-dlp
    try:
        def _check_ytdlp():
            return subprocess.run(["yt-dlp", "--version"], capture_output=True)
        process = await asyncio.to_thread(_check_ytdlp)
        deps["yt-dlp"] = process.returncode == 0
    except FileNotFoundError:
        deps["yt-dlp"] = False

    # Check ffmpeg
    try:
        def _check_ffmpeg():
            return subprocess.run(["ffmpeg", "-version"], capture_output=True)
        process = await asyncio.to_thread(_check_ffmpeg)
        deps["ffmpeg"] = process.returncode == 0
    except FileNotFoundError:
        deps["ffmpeg"] = False

    # Check git
    try:
        def _check_git():
            return subprocess.run(["git", "--version"], capture_output=True)
        process = await asyncio.to_thread(_check_git)
        deps["git"] = process.returncode == 0
    except FileNotFoundError:
        deps["git"] = False

    return deps
