"""
FileForge — PDF Router
API endpoints for PDF conversion, merging, and compression.
"""
import io
from typing import List
from urllib.parse import quote

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import Response

from services.pdf_service import compress_pdf, convert_pdf_to_jpg, get_pdf_page_count, merge_images_to_pdf

router = APIRouter(prefix="/api/pdf", tags=["PDF"])


def _safe_content_disposition(filename: str) -> str:
    """Build a Content-Disposition header safe for non-ASCII filenames."""
    try:
        filename.encode("latin-1")
        return f'attachment; filename="{filename}"'
    except UnicodeEncodeError:
        encoded = quote(filename)
        return f"attachment; filename*=UTF-8''{encoded}"


@router.post("/to-jpg")
async def pdf_to_jpg(
    file: UploadFile = File(...),
    dpi: int = Form(300),
    pages: str = Form(''),
):
    """Convert a PDF file to JPG images."""
    if not file.filename.lower().endswith(".pdf"):
        return {"error": "Please upload a PDF file"}

    try:
        pdf_bytes = await file.read()
        result = await convert_pdf_to_jpg(
            pdf_bytes, file.filename, dpi=dpi, quality=95, pages=pages
        )

        if result["type"] == "jpeg":
            media_type = "image/jpeg"
        else:
            media_type = "application/zip"

        return Response(
            content=result["data"],
            media_type=media_type,
            headers={"Content-Disposition": _safe_content_disposition(result["filename"])},
        )
    except Exception as e:
        return {"error": str(e)}


@router.post("/page-count")
async def pdf_page_count(
    file: UploadFile = File(...),
):
    """Get the total page count of a PDF file."""
    if not file.filename.lower().endswith(".pdf"):
        return {"error": "Please upload a PDF file"}

    try:
        pdf_bytes = await file.read()
        count = await get_pdf_page_count(pdf_bytes)
        return {"success": True, "page_count": count, "total_pages": count}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/merge-images")
async def images_to_pdf(
    files: List[UploadFile] = File(...),
):
    """Merge multiple images (PNG/JPG) into a single PDF."""
    image_files = []
    for f in files:
        ext = f.filename.lower().rsplit(".", 1)[-1] if "." in f.filename else ""
        if ext not in ("jpg", "jpeg", "png", "bmp", "webp"):
            return {"error": f"Unsupported image format: {f.filename}"}
        file_bytes = await f.read()
        image_files.append((f.filename, file_bytes))

    if not image_files:
        return {"error": "No valid image files provided"}

    try:
        pdf_bytes = await merge_images_to_pdf(image_files)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="merged_images.pdf"'},
        )
    except Exception as e:
        return {"error": str(e)}


@router.post("/compress")
async def compress_pdf_endpoint(
    file: UploadFile = File(...),
    quality: str = Form("medium"),
):
    """Compress a PDF file to reduce its size."""
    if not file.filename.lower().endswith(".pdf"):
        return {"error": "Please upload a PDF file"}

    try:
        pdf_bytes = await file.read()
        original_size = len(pdf_bytes)

        compressed_bytes = await compress_pdf(pdf_bytes, quality=quality)
        compressed_size = len(compressed_bytes)

        reduction = round((1 - compressed_size / original_size) * 100, 1) if original_size > 0 else 0
        output_name = file.filename.rsplit(".", 1)[0] + "_compressed.pdf"

        return Response(
            content=compressed_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": _safe_content_disposition(output_name),
                "X-Original-Size": str(original_size),
                "X-Compressed-Size": str(compressed_size),
                "X-Reduction-Percent": str(reduction),
            },
        )
    except Exception as e:
        return {"error": str(e)}
