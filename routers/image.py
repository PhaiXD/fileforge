"""
FileForge — Image Router
API endpoints for image compression.
"""
from urllib.parse import quote

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import Response
from typing import Optional

from services.image_service import compress_image

router = APIRouter(prefix="/api/image", tags=["Image"])


def _safe_content_disposition(filename: str) -> str:
    """Build a Content-Disposition header safe for non-ASCII filenames."""
    try:
        filename.encode("latin-1")
        return f'attachment; filename="{filename}"'
    except UnicodeEncodeError:
        encoded = quote(filename)
        return f"attachment; filename*=UTF-8''{encoded}"


@router.post("/compress")
async def compress_image_endpoint(
    file: UploadFile = File(...),
    quality: int = Form(75),
    max_width: Optional[int] = Form(None),
    max_height: Optional[int] = Form(None),
):
    """Compress an image file to reduce its size."""
    allowed_exts = ("jpg", "jpeg", "png", "webp", "bmp")
    ext = file.filename.lower().rsplit(".", 1)[-1] if "." in file.filename else ""
    if ext not in allowed_exts:
        return {"error": f"Unsupported format. Allowed: {', '.join(allowed_exts)}"}

    try:
        image_bytes = await file.read()
        original_size = len(image_bytes)

        compressed_bytes, output_filename = await compress_image(
            image_bytes,
            file.filename,
            quality=quality,
            max_width=max_width,
            max_height=max_height,
        )
        compressed_size = len(compressed_bytes)
        reduction = round((1 - compressed_size / original_size) * 100, 1) if original_size > 0 else 0

        # Determine content type
        content_type_map = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
        }
        output_ext = "." + output_filename.rsplit(".", 1)[-1].lower()
        content_type = content_type_map.get(output_ext, "image/jpeg")

        return Response(
            content=compressed_bytes,
            media_type=content_type,
            headers={
                "Content-Disposition": _safe_content_disposition(output_filename),
                "X-Original-Size": str(original_size),
                "X-Compressed-Size": str(compressed_size),
                "X-Reduction-Percent": str(reduction),
            },
        )
    except Exception as e:
        return {"error": str(e)}
