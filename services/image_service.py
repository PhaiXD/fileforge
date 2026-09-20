"""
FileForge — Image Processing Service
Handles image compression and format conversion.
"""
import io
from typing import Optional

from PIL import Image


async def compress_image(
    image_bytes: bytes,
    filename: str,
    quality: int = 75,
    max_width: Optional[int] = None,
    max_height: Optional[int] = None,
    output_format: Optional[str] = None,
) -> tuple[bytes, str]:
    """
    Compress an image by reducing quality and optionally resizing.
    Returns (compressed_bytes, output_filename).
    """
    img = Image.open(io.BytesIO(image_bytes))
    original_format = img.format or "JPEG"

    # Determine output format
    if output_format:
        fmt = output_format.upper()
    else:
        fmt = original_format.upper()
        if fmt == "PNG":
            fmt = "PNG"
        elif fmt in ("JPEG", "JPG"):
            fmt = "JPEG"
        else:
            fmt = "JPEG"

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

    # Convert mode for JPEG
    if fmt == "JPEG" and img.mode in ("RGBA", "P", "LA"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        background.paste(img, mask=img.split()[-1] if "A" in img.mode else None)
        img = background

    # Save compressed image
    output_buffer = io.BytesIO()
    save_kwargs = {}

    if fmt == "JPEG":
        save_kwargs["quality"] = quality
        save_kwargs["optimize"] = True
    elif fmt == "PNG":
        save_kwargs["optimize"] = True
    elif fmt == "WEBP":
        save_kwargs["quality"] = quality

    img.save(output_buffer, format=fmt, **save_kwargs)
    output_buffer.seek(0)

    # Generate output filename
    ext_map = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp", "GIF": ".gif"}
    ext = ext_map.get(fmt, ".jpg")
    base_name = ".".join(filename.rsplit(".", 1)[:-1]) if "." in filename else filename
    output_filename = f"{base_name}_compressed{ext}"

    return output_buffer.read(), output_filename
