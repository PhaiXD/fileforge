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


async def extract_pdf_pages(pdf_bytes: bytes, pages: str) -> bytes:
    """
    Extract specific pages from a PDF and return a new PDF.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page_indices = _parse_page_range(pages, len(doc))
    
    new_doc = fitz.open()
    for idx in page_indices:
        new_doc.insert_pdf(doc, from_page=idx, to_page=idx)
    
    pdf_out = new_doc.tobytes()
    new_doc.close()
    doc.close()
    
    return pdf_out


async def merge_multiple_pdfs(files: List[tuple[bytes, str]], pages_list: List[str]) -> bytes:
    """
    Merge multiple PDFs into one, extracting specific pages if requested.
    files: List of (pdf_bytes, filename)
    pages_list: List of page range strings (same length as files)
    """
    new_doc = fitz.open()
    
    for i, (pdf_bytes, filename) in enumerate(files):
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            pages_str = pages_list[i] if i < len(pages_list) else ""
            page_indices = _parse_page_range(pages_str, len(doc))
            
            for idx in page_indices:
                new_doc.insert_pdf(doc, from_page=idx, to_page=idx)
            doc.close()
        except Exception:
            continue
            
    pdf_out = new_doc.tobytes()
    new_doc.close()
    return pdf_out



async def convert_pdf_to_image(
    pdf_bytes: bytes,
    filename: str,
    dpi: int = 300,
    quality: int = 95,
    pages: Optional[str] = None,
    target_format: str = "jpeg",
) -> dict:
    """
    Convert PDF page(s) to image(s) (JPEG/PNG).
    Returns a dict with:
      - data: bytes
      - type: 'jpeg', 'png', or 'zip'
      - filename: suggested output filename
    """
    target_format = target_format.lower()
    if target_format == "jpg":
        target_format = "jpeg"
        
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page_indices = _parse_page_range(pages, len(doc))
    base_name = Path(filename).stem
    results = []
    
    ext = ".jpg" if target_format == "jpeg" else f".{target_format}"

    for page_num in page_indices:
        try:
            page = doc[page_num]
            zoom = dpi / 72
            matrix = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=matrix)

            if pix.n == 4:
                img = Image.frombytes("RGBA", [pix.width, pix.height], pix.samples)
                if target_format == "jpeg":
                    bg = Image.new("RGB", img.size, (255, 255, 255))
                    bg.paste(img, mask=img.split()[3])
                    img = bg
            else:
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

            img_buffer = io.BytesIO()
            if target_format == "jpeg":
                img.save(img_buffer, format="JPEG", quality=quality)
            else:
                img.save(img_buffer, format=target_format.upper(), optimize=True)
            img_buffer.seek(0)

            img_name = f"{base_name}_page_{page_num + 1}{ext}"
            results.append((img_name, img_buffer.read()))
        except Exception as e:
            print(f"Error converting page {page_num + 1}: {e}")
            continue

    doc.close()

    if len(results) == 1:
        return {
            "data": results[0][1],
            "type": target_format,
            "filename": results[0][0],
        }
    else:
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for name, data in results:
                zf.writestr(name, data)
        zip_buffer.seek(0)
        return {
            "data": zip_buffer.read(),
            "type": "zip",
            "filename": f"{base_name}_images.zip",
        }


async def convert_pdf_to_word(pdf_bytes: bytes, filename: str) -> bytes:
    import tempfile
    from pdf2docx import Converter
    
    with tempfile.TemporaryDirectory() as temp_dir:
        pdf_path = os.path.join(temp_dir, "input.pdf")
        docx_path = os.path.join(temp_dir, "output.docx")
        
        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)
            
        cv = Converter(pdf_path)
        cv.convert(docx_path)
        cv.close()
        
        with open(docx_path, "rb") as f:
            return f.read()


async def convert_word_to_pdf(word_bytes: bytes, filename: str) -> bytes:
    import tempfile
    import pythoncom
    from docx2pdf import convert
    
    with tempfile.TemporaryDirectory() as temp_dir:
        safe_name = os.path.basename(filename)
        word_path = os.path.abspath(os.path.join(temp_dir, safe_name))
        pdf_path = os.path.abspath(os.path.join(temp_dir, "output.pdf"))
        
        with open(word_path, "wb") as f:
            f.write(word_bytes)
            
        pythoncom.CoInitialize()
        try:
            convert(word_path, pdf_path)
        finally:
            pythoncom.CoUninitialize()
            
        with open(pdf_path, "rb") as f:
            return f.read()


async def convert_excel_to_pdf(excel_bytes: bytes, filename: str) -> bytes:
    import tempfile
    import pythoncom
    import win32com.client
    
    with tempfile.TemporaryDirectory() as temp_dir:
        safe_name = os.path.basename(filename)
        excel_path = os.path.abspath(os.path.join(temp_dir, safe_name))
        pdf_path = os.path.abspath(os.path.join(temp_dir, "output.pdf"))
        
        with open(excel_path, "wb") as f:
            f.write(excel_bytes)
            
        pythoncom.CoInitialize()
        try:
            excel = win32com.client.DispatchEx("Excel.Application")
            excel.Visible = False
            excel.DisplayAlerts = False
            
            wb = excel.Workbooks.Open(excel_path)
            # 0 corresponds to xlTypePDF
            wb.ExportAsFixedFormat(0, pdf_path)
            wb.Close(False)
            excel.Quit()
        finally:
            pythoncom.CoUninitialize()
            
        with open(pdf_path, "rb") as f:
            return f.read()


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
    target_size_kb: Optional[int] = None,
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
    target_bytes = (target_size_kb * 1024) if target_size_kb else None

    def _compress_with_params(img_qual, max_dpi):
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
                    max_dim = max_dpi * 10
                    if max(img.size) > max_dim:
                        img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
                    if img.mode != "RGB":
                        img = img.convert("RGB")
                    img_buffer = io.BytesIO()
                    img.save(img_buffer, format="JPEG", quality=img_qual)
                    img_buffer.seek(0)
                    page.replace_image(xref, stream=img_buffer.read())
                except Exception:
                    continue
        output_buffer = io.BytesIO()
        doc.save(output_buffer, garbage=4, deflate=True, clean=True)
        doc.close()
        output_buffer.seek(0)
        return output_buffer.read()

    if target_bytes:
        low, high = 10, 85
        best_bytes = None
        max_dpi = 120 # Fix DPI for binary search

        while low <= high:
            mid = (low + high) // 2
            compressed = _compress_with_params(mid, max_dpi)
            
            if len(compressed) <= target_bytes:
                best_bytes = compressed
                low = mid + 1
            else:
                high = mid - 1
                
        if best_bytes is None:
            # Even lowest quality is too big, just return lowest
            return _compress_with_params(10, 72)
        return best_bytes
    else:
        return _compress_with_params(settings["image_quality"], settings["dpi"])


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
