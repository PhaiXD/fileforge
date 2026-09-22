"""
FileForge — PDF Processing Service
Handles PDF-to-image conversion, image-to-PDF merging, and PDF compression.
"""
import io
import os
import zipfile
from pathlib import Path
from typing import List, Optional

import pymupdf as fitz
from PIL import Image

from config import TEMP_DIR


def _parse_page_range(pages_str: Optional[str], total_pages: int) -> List[int]:
    """
    Parse comma-separated page numbers and ranges like '1,3,5-8'
    returning a 0-indexed list of page numbers.
    """
    if not pages_str or not pages_str.strip():
        return list(range(total_pages))

    pages = set()
    for part in pages_str.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            range_parts = part.split("-", 1)
            try:
                start = int(range_parts[0].strip())
                end = int(range_parts[1].strip())
                if start > end:
                    start, end = end, start
                for p in range(start, end + 1):
                    if 1 <= p <= total_pages:
                        pages.add(p - 1)
            except ValueError:
                continue
        else:
            try:
                p = int(part)
                if 1 <= p <= total_pages:
                    pages.add(p - 1)
            except ValueError:
                continue

    result = sorted(pages)
    return result if result else list(range(total_pages))


async def get_pdf_page_count(pdf_bytes: bytes) -> int:
    """Get the total page count of a PDF file."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    count = len(doc)
    doc.close()
    return count


async def convert_pdf_to_jpg(
    pdf_bytes: bytes,
    filename: str,
    dpi: int = 300,
    quality: int = 95,
    pages: Optional[str] = None,
) -> dict:
    """
    Convert PDF page(s) to JPG image(s).
    Returns a dict with:
      - data: bytes (JPG for single page, ZIP for multiple)
      - type: 'jpeg' or 'zip'
      - filename: suggested output filename
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page_indices = _parse_page_range(pages, len(doc))
    base_name = Path(filename).stem
    jpg_results = []

    for page_num in page_indices:
        try:
            page = doc[page_num]
            zoom = dpi / 72  # 72 is the default PDF resolution
            matrix = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=matrix)

            # Convert pixmap to PIL Image for quality control
            if pix.n == 4:
                img = Image.frombytes("RGBA", [pix.width, pix.height], pix.samples).convert("RGB")
            else:
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

            img_buffer = io.BytesIO()
            img.save(img_buffer, format="JPEG", quality=quality)
            img_buffer.seek(0)

            jpg_name = f"{base_name}_page_{page_num + 1}.jpg"
            jpg_results.append((jpg_name, img_buffer.read()))
        except Exception as e:
            print(f"Error converting page {page_num + 1}: {e}")
            continue

    doc.close()

    if len(jpg_results) == 1:
        # Single page: return JPG directly
        return {
            "data": jpg_results[0][1],
            "type": "jpeg",
            "filename": jpg_results[0][0],
        }
    else:
        # Multiple pages: return ZIP
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for name, data in jpg_results:
                zf.writestr(name, data)
        zip_buffer.seek(0)
        return {
            "data": zip_buffer.read(),
            "type": "zip",
            "filename": f"{base_name}_images.zip",
        }


async def merge_images_to_pdf(
    image_files: List[tuple[str, bytes]],
) -> bytes:
    """
    Merge multiple images (PNG/JPG) into a single PDF.
    image_files: list of (filename, file_bytes) tuples.
    Returns PDF bytes.
    """
    images: List[Image.Image] = []

    for filename, file_bytes in image_files:
        img = Image.open(io.BytesIO(file_bytes))
        # Convert to RGB if necessary (e.g., RGBA PNGs)
        if img.mode != "RGB":
            img = img.convert("RGB")
        images.append(img)

    if not images:
        raise ValueError("No valid images provided")

    pdf_buffer = io.BytesIO()
    # First image saves, rest appended
    images[0].save(
        pdf_buffer,
        format="PDF",
        save_all=True,
        append_images=images[1:] if len(images) > 1 else [],
    )

    pdf_buffer.seek(0)
    return pdf_buffer.read()


async def compress_pdf(
    pdf_bytes: bytes,
    quality: str = "medium",
) -> bytes:
    """
    Compress a PDF by reducing image quality and cleaning up.
    quality: 'low' (aggressive), 'medium' (balanced), 'high' (minimal)
    Returns compressed PDF bytes.
    """
    quality_settings = {
        "low": {"image_quality": 30, "dpi": 72},
        "medium": {"image_quality": 60, "dpi": 120},
        "high": {"image_quality": 85, "dpi": 150},
    }
    settings = quality_settings.get(quality, quality_settings["medium"])

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    for page_num in range(len(doc)):
        page = doc[page_num]
        image_list = page.get_images(full=True)

        for img_index, img_info in enumerate(image_list):
            xref = img_info[0]
            try:
                base_image = doc.extract_image(xref)
                if base_image is None:
                    continue

                image_bytes = base_image["image"]
                img = Image.open(io.BytesIO(image_bytes))

                # Resize if larger than target DPI equivalent
                max_dim = settings["dpi"] * 10
                if max(img.size) > max_dim:
                    img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

                # Convert to RGB for JPEG compression
                if img.mode != "RGB":
                    img = img.convert("RGB")

                img_buffer = io.BytesIO()
                img.save(img_buffer, format="JPEG", quality=settings["image_quality"])
                img_buffer.seek(0)

                # Replace image in PDF
                page.replace_image(xref, stream=img_buffer.read())
            except Exception:
                # Skip images that can't be processed
                continue

    # Save with garbage collection and deflation
    output_buffer = io.BytesIO()
    doc.save(
        output_buffer,
        garbage=4,
        deflate=True,
        clean=True,
    )
    doc.close()

    output_buffer.seek(0)
    return output_buffer.read()


async def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extract all text content from a PDF file.
    Returns the full text as a string.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text_parts = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text")
        if text.strip():
            text_parts.append(f"--- Page {page_num + 1} ---\n{text}")

    doc.close()
    return "\n\n".join(text_parts)
