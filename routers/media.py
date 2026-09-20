"""
FileForge — Media Router
API endpoints for media downloading via yt-dlp.
"""
import os

from fastapi import APIRouter, Form
from fastapi.responses import FileResponse

from services.media_service import download_media, get_media_info

router = APIRouter(prefix="/api/media", tags=["Media"])


@router.post("/info")
async def media_info(url: str = Form(...)):
    """Get metadata about a media URL (title, duration, available formats)."""
    try:
        info = await get_media_info(url)
        return {"success": True, "data": info}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/download")
async def media_download(
    url: str = Form(...),
    format_type: str = Form("mp4"),
    quality: str = Form(None),
):
    """
    Download media from a URL.
    format_type: 'mp4' or 'mp3'
    quality: e.g. '720p', '1080p' (for video only)
    """
    try:
        file_path, filename = await download_media(
            url,
            format_type=format_type,
            quality=quality if quality else None,
        )

        media_type = "video/mp4" if format_type == "mp4" else "audio/mpeg"

        return FileResponse(
            path=file_path,
            filename=filename,
            media_type=media_type,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        return {"success": False, "error": str(e)}
