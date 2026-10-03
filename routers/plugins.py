"""
FileForge — Plugin Router (v2.0)
API endpoints for plugin discovery, installation, and execution.
"""
import os
from pathlib import Path
from typing import Optional
from urllib.parse import quote

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import Response, JSONResponse

from config import TEMP_DIR
from services.plugin_manager import plugin_manager

router = APIRouter(prefix="/api/plugins", tags=["Plugins"])


def _safe_content_disposition(filename: str) -> str:
    """Build a Content-Disposition header safe for non-ASCII filenames."""
    try:
        filename.encode("latin-1")
        return f'attachment; filename="{filename}"'
    except UnicodeEncodeError:
        encoded = quote(filename)
        return f"attachment; filename*=UTF-8''{encoded}"


# ─── List Installed Plugins ──────────────────────────────────────

@router.get("")
async def list_plugins():
    """
    Return all installed plugins and their tool definitions.
    The frontend uses this to dynamically render tool cards and panels.
    """
    installed = plugin_manager.get_installed()

    plugins_out = []
    for pid, manifest in installed.items():
        # Strip internal fields (prefixed with _)
        clean = {k: v for k, v in manifest.items() if not k.startswith("_")}
        plugins_out.append(clean)

    return {"success": True, "plugins": plugins_out}


# ─── Plugin Store ────────────────────────────────────────────────

@router.get("/store")
async def get_store():
    """
    Fetch the remote plugin registry, annotated with local install status.
    """
    try:
        store_list = await plugin_manager.get_store_list()
        return {"success": True, "plugins": store_list}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


@router.post("/install")
async def install_plugin(plugin_id: str = Form(...)):
    """
    Download and install a plugin by its registry ID.
    """
    try:
        manifest = await plugin_manager.install(plugin_id)
        # Strip internal fields
        clean = {k: v for k, v in manifest.items() if not k.startswith("_")}
        return {"success": True, "plugin": clean}
    except (ValueError, RuntimeError) as exc:
        return {"success": False, "error": str(exc)}


@router.post("/{plugin_id}/uninstall")
async def uninstall_plugin(plugin_id: str):
    """
    Remove an installed plugin.
    """
    try:
        await plugin_manager.uninstall(plugin_id)
        return {"success": True, "message": f"Plugin '{plugin_id}' uninstalled"}
    except ValueError as exc:
        return {"success": False, "error": str(exc)}


# ─── Execute Plugin Tool ─────────────────────────────────────────

@router.post("/{plugin_id}/{tool_id}/run")
async def run_plugin_tool(
    plugin_id: str,
    tool_id: str,
    file: Optional[UploadFile] = File(None),
    url: Optional[str] = Form(None),
    options_json: str = Form("{}"),
):
    """
    Execute a plugin tool.

    - For file-based tools: upload a file via multipart.
    - For URL-based tools (e.g. YouTube downloader): provide a URL.
    - Options are passed as a JSON string of {option_id: value} pairs.

    Returns the output file as a download response.
    """
    import json

    try:
        options = json.loads(options_json)
    except json.JSONDecodeError:
        return JSONResponse(
            {"success": False, "error": "Invalid options JSON"},
            status_code=400,
        )

    # Prepare input
    input_path = None
    try:
        if file and file.filename:
            # Save uploaded file to temp
            TEMP_DIR.mkdir(parents=True, exist_ok=True)
            # Preserve original extension
            ext = Path(file.filename).suffix
            input_path = TEMP_DIR / f"plugin_input_{os.urandom(8).hex()}{ext}"
            content = await file.read()
            input_path.write_bytes(content)
            original_size = len(content)
        elif url:
            # For URL-based tools, pass the URL as the input_path
            # The plugin is responsible for downloading
            input_path = Path(url)
            original_size = 0
        else:
            return JSONResponse(
                {"success": False, "error": "No file or URL provided"},
                status_code=400,
            )

        # Execute
        output_path = await plugin_manager.execute(
            plugin_id, tool_id, input_path, options
        )

        # Read output
        output_bytes = output_path.read_bytes()
        output_size = len(output_bytes)

        # Determine output filename
        manifest = plugin_manager.get_plugin(plugin_id)
        tool = next(
            (t for t in manifest.get("tools", []) if t["id"] == tool_id),
            None,
        )

        if file and file.filename:
            base_name = Path(file.filename).stem
        else:
            base_name = "output"

        output_filename = f"{base_name}{output_path.suffix}"

        # Determine MIME type
        mime_map = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".gif": "image/gif",
            ".ico": "image/x-icon",
            ".pdf": "application/pdf",
            ".mp4": "video/mp4",
            ".mp3": "audio/mpeg",
            ".m4a": "audio/mp4",
            ".zip": "application/zip",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }
        mime_type = mime_map.get(
            output_path.suffix.lower(), "application/octet-stream"
        )

        # Build response headers
        headers = {
            "Content-Disposition": _safe_content_disposition(output_filename),
        }
        if original_size > 0:
            headers["X-Original-Size"] = str(original_size)
            headers["X-Compressed-Size"] = str(output_size)
            if original_size > 0:
                reduction = round(
                    (1 - output_size / original_size) * 100, 1
                )
                headers["X-Reduction-Percent"] = str(reduction)

        return Response(
            content=output_bytes,
            media_type=mime_type,
            headers=headers,
        )

    except (ValueError, RuntimeError) as exc:
        return JSONResponse(
            {"success": False, "error": str(exc)},
            status_code=400,
        )
    finally:
        # Clean up temp input file
        if input_path and input_path.exists() and input_path.parent == TEMP_DIR:
            try:
                input_path.unlink()
            except OSError:
                pass


# ─── Rescan ──────────────────────────────────────────────────────

@router.post("/rescan")
async def rescan_plugins():
    """Force a re-scan of the plugins directory."""
    installed = plugin_manager.scan()
    return {
        "success": True,
        "count": len(installed),
        "plugins": list(installed.keys()),
    }
