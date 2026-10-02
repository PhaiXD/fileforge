"""
FileForge — Image Processing Service
Handles image compression and format conversion.
"""
import io
from typing import Optional

from PIL import Image
import pillow_heif

# Register HEIF opener to allow PIL to read .heic and .heif files natively
pillow_heif.register_heif_opener()


async def compress_image(
    image_bytes: bytes,
    filename: str,
    quality: int = 75,
    max_width: Optional[int] = None,
    max_height: Optional[int] = None,
    output_format: Optional[str] = None,
    target_size_kb: Optional[int] = None,
) -> tuple[bytes, str]:
    """
    Compress an image by reducing quality and optionally resizing.
    Returns (compressed_bytes, output_filename).
    """
    ext_lower = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    # Handle SVG input: convert to raster via cairosvg
    if ext_lower == "svg":
        try:
            import cairosvg
        except ImportError:
            raise ValueError("cairosvg is required for SVG conversion. Install with: pip install cairosvg")

        # Convert SVG to PNG bytes first, then open as PIL Image
        png_bytes = cairosvg.svg2png(bytestring=image_bytes)
        img = Image.open(io.BytesIO(png_bytes))
    else:
        img = Image.open(io.BytesIO(image_bytes))

    original_format = img.format or "JPEG"

    # Determine output format
    if output_format:
        fmt = output_format.upper()
        if fmt == "JPG":
            fmt = "JPEG"
    else:
        fmt = original_format.upper()
        if fmt == "PNG":
            fmt = "PNG"
        elif fmt in ("JPEG", "JPG"):
            fmt = "JPEG"
        else:
            fmt = "JPEG"

    # Force resize for ICO format to a maximum of 256x256 (standard max size)
    if fmt == "ICO":
        max_width = min(max_width or 256, 256)
        max_height = min(max_height or 256, 256)

    # Resize if max dimensions are specified
    if max_width or max_height:
        w, h = img.size
        target_w = max_width or w
        target_h = max_height or h

        # Calculate aspect-ratio-preserving dimensions
        ratio_w = target_w / w
        ratio_h = target_h / h
        ratio = min(ratio_w, ratio_h)

        if ratio < 1:  # Only downscale, never upscale
            new_size = (int(w * ratio), int(h * ratio))
            img = img.resize(new_size, Image.Resampling.LANCZOS)

    # Convert mode for JPEG and PDF (to replace transparency with white background)
    if fmt in ("JPEG", "PDF") and img.mode in ("RGBA", "P", "LA"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        background.paste(img, mask=img.split()[-1] if "A" in img.mode else None)
        img = background

    target_bytes = (target_size_kb * 1024) if target_size_kb else None

    def _save_with_quality(q):
        buf = io.BytesIO()
        sk = {}
        if fmt == "JPEG":
            sk["quality"] = q
            sk["optimize"] = True
        elif fmt == "PNG":
            sk["optimize"] = True
        elif fmt == "WEBP":
            sk["quality"] = q
        img.save(buf, format=fmt, **sk)
        return buf

    if target_bytes and fmt in ("JPEG", "WEBP"):
        # Binary search for optimal quality
        low, high = 1, 100
        best_buf = None
        
        # If target size is very small, start search from current quality to avoid unnecessary loops
        high = min(100, quality if quality else 100)

        while low <= high:
            mid = (low + high) // 2
            buf = _save_with_quality(mid)
            size = buf.getbuffer().nbytes
            
            if size <= target_bytes:
                best_buf = buf
                low = mid + 1  # Try for better quality
            else:
                high = mid - 1
                
        if best_buf is None:
            output_buffer = _save_with_quality(1)
        else:
            output_buffer = best_buf
    else:
        output_buffer = _save_with_quality(quality)

    output_buffer.seek(0)

    # Generate output filename
    ext_map = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp", "GIF": ".gif", "ICO": ".ico", "PDF": ".pdf"}
    ext = ext_map.get(fmt, ".jpg")
    base_name = ".".join(filename.rsplit(".", 1)[:-1]) if "." in filename else filename
    suffix = "_converted" if output_format else "_compressed"
    output_filename = f"{base_name}{suffix}{ext}"

    return output_buffer.read(), output_filename
