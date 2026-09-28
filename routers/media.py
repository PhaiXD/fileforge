"""
FileForge — Media Router
API endpoints for media downloading via yt-dlp.
"""
import os
import traceback

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
        traceback.print_exc()
        return {"success": False, "error": str(e)}


import urllib.parse

def _safe_content_disposition(filename: str) -> str:
    """Safely encode filenames for the Content-Disposition header using RFC 5987."""
    safe_name = urllib.parse.quote(filename)
    return f"attachment; filename*=UTF-8''{safe_name}"

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
            headers={"Content-Disposition": _safe_content_disposition(filename)},
        )
    except Exception as e:
        traceback.print_exc()
        return {"success": False, "error": str(e)}

from fastapi import UploadFile, File
import shutil
import uuid
from config import TEMP_DIR
from services.video_service import convert_media

@router.post("/convert")
async def media_convert(
    file: UploadFile = File(...),
    target_format: str = Form(...)
):
    """
    Convert a media file (Video/Audio) locally using FFmpeg.
    """
    try:
        # Save uploaded file
        job_id = str(uuid.uuid4())[:8]
        input_dir = TEMP_DIR / f"input_{job_id}"
        input_dir.mkdir(parents=True, exist_ok=True)
        input_path = str(input_dir / file.filename)
        
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Convert media
        output_path, output_filename = await convert_media(input_path, target_format, file.filename)
        
        # Determine media type
        media_type = "application/octet-stream"
        if target_format == "mp3": media_type = "audio/mpeg"
        elif target_format == "mp4": media_type = "video/mp4"
        elif target_format == "gif": media_type = "image/gif"
        
        return FileResponse(
            path=output_path,
            filename=output_filename,
            media_type=media_type,
            headers={"Content-Disposition": _safe_content_disposition(output_filename)}
        )
    except Exception as e:
        traceback.print_exc()
        return {"success": False, "error": str(e)}
