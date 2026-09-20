"""
FileForge — PDF Router
API endpoints for PDF conversion, merging, and compression.
"""
import io
from typing import List

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import Response

from services.pdf_service import compress_pdf, convert_pdf_to_jpg, merge_images_to_pdf

router = APIRouter(prefix="/api/pdf", tags=["PDF"])


@router.post("/to-jpg")
async def pdf_to_jpg(
    file: UploadFile = File(...),
    dpi: int = Form(200),
    quality: int = Form(90),
):
    """Convert a PDF file to JPG images (returned as a ZIP archive)."""
    if not file.filename.lower().endswith(".pdf"):
        return {"error": "Please upload a PDF file"}

    pdf_bytes = await file.read()
    zip_bytes = await convert_pdf_to_jpg(pdf_bytes, file.filename, dpi=dpi, quality=quality)

    output_name = file.filename.rsplit(".", 1)[0] + "_images.zip"
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{output_name}"'},
    )


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

    pdf_bytes = await merge_images_to_pdf(image_files)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="merged_images.pdf"'},
    )


@router.post("/compress")
async def compress_pdf_endpoint(
    file: UploadFile = File(...),
    quality: str = Form("medium"),
):
    """Compress a PDF file to reduce its size."""
    if not file.filename.lower().endswith(".pdf"):
        return {"error": "Please upload a PDF file"}

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
            "Content-Disposition": f'attachment; filename="{output_name}"',
            "X-Original-Size": str(original_size),
            "X-Compressed-Size": str(compressed_size),
            "X-Reduction-Percent": str(reduction),
        },
    )
