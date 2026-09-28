import asyncio
import os
import subprocess
import uuid
from typing import Optional
from pathlib import Path

from config import TEMP_DIR

async def _run_ffmpeg(args: list[str]) -> tuple[str, str, int]:
    def _run_sync():
        result = subprocess.run(['ffmpeg', '-y'] + args, capture_output=True, text=True)
        return (result.stdout, result.stderr, result.returncode)
    return await asyncio.to_thread(_run_sync)

async def convert_media(
    input_file_path: str,
    target_format: str,
    original_filename: str,
    gif_width: Optional[str] = None,
    gif_fps: Optional[str] = None,
    gif_quality: Optional[str] = None
) -> tuple[str, str]:
    """
    Convert media using FFmpeg.
    target_format: e.g., 'mp3', 'gif', 'mp4'
    Returns (output_file_path, output_filename)
    """
    job_id = str(uuid.uuid4())[:8]
    output_dir = TEMP_DIR / f"convert_{job_id}"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    base_name = original_filename.rsplit('.', 1)[0]
    output_filename = f"{base_name}_converted.{target_format}"
    output_file_path = str(output_dir / output_filename)

    args = []
    
    # Audio formats
    audio_formats = {"mp3", "wav", "m4a", "ogg", "flac"}
    # Video formats
    video_formats = {"mp4", "mov", "webm", "mkv", "avi"}
    
    if target_format == "gif":
        vf_args = []
        if gif_fps and gif_fps != 'original':
            vf_args.append(f"fps={gif_fps}")
        if gif_width and gif_width != 'original':
            vf_args.append(f"scale={gif_width}:-1:flags=lanczos")
            
        vf_str = ",".join(vf_args) + "," if vf_args else ""
        
        if gif_quality == 'high':
            filter_complex = f"[0:v] {vf_str}split [a][b];[a] palettegen [p];[b][p] paletteuse"
        elif gif_quality == 'low':
            filter_complex = f"[0:v] {vf_str}split [a][b];[a] palettegen=max_colors=32 [p];[b][p] paletteuse=dither=bayer:bayer_scale=5"
        else: # medium or default
            filter_complex = f"[0:v] {vf_str}split [a][b];[a] palettegen=max_colors=128 [p];[b][p] paletteuse"

        args = ["-i", input_file_path, "-filter_complex", filter_complex, "-loop", "0", output_file_path]
    elif target_format in audio_formats:
        # Extract audio / Convert to target audio format
        if target_format == "mp3":
            args = ["-i", input_file_path, "-vn", "-ar", "44100", "-ac", "2", "-b:a", "192k", output_file_path]
        elif target_format == "m4a":
            args = ["-i", input_file_path, "-vn", "-c:a", "aac", "-b:a", "192k", output_file_path]
        else:
            args = ["-i", input_file_path, "-vn", output_file_path]
    elif target_format in video_formats:
        # Convert to target video format
        if target_format == "mp4":
            args = ["-i", input_file_path, "-c:v", "libx264", "-preset", "fast", "-c:a", "aac", output_file_path]
        else:
            args = ["-i", input_file_path, "-preset", "fast", output_file_path]
    else:
        # Generic copy/convert fallback
        args = ["-i", input_file_path, output_file_path]

    stdout, stderr, code = await _run_ffmpeg(args)

    if code != 0:
        raise RuntimeError(f"FFmpeg conversion failed: {stderr}")

    return output_file_path, output_filename
