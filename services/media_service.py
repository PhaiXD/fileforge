"""
FileForge — Media Download Service
Handles media downloading via yt-dlp (YouTube, TikTok, etc.).
"""
import asyncio
import json
import os
import re
import shutil
import subprocess
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

from config import TEMP_DIR, YTDLP_DEFAULT_AUDIO_FORMAT, YTDLP_DEFAULT_VIDEO_FORMAT


async def _run_ytdlp(args):
    def _run_sync():
        result = subprocess.run(['yt-dlp'] + list(args), capture_output=True, text=True, timeout=60)
        return (result.stdout, result.stderr, result.returncode)
    return await asyncio.to_thread(_run_sync)


async def get_media_info(url: str) -> Dict[str, Any]:
    """
    Get metadata about a media URL (title, duration, formats, thumbnail).
    """
    args = [
        "--dump-json",
        "--no-download",
        "--no-warnings",
        url,
    ]
    stdout, stderr, code = await _run_ytdlp(args)

    if code != 0:
        raise RuntimeError(f"yt-dlp failed: {stderr}")

    try:
        data = json.loads(stdout)
    except Exception:
        print(stderr)
        raise

    # Extract available quality options
    formats = []
    if "formats" in data:
        seen_resolutions = set()
        for fmt in data["formats"]:
            height = fmt.get("height")
            if height and height not in seen_resolutions:
                seen_resolutions.add(height)
                formats.append({
                    "quality": f"{height}p",
                    "height": height,
                    "ext": fmt.get("ext", "mp4"),
                })
        formats.sort(key=lambda x: x["height"], reverse=True)

    return {
        "title": data.get("title", "Unknown"),
        "duration": data.get("duration", 0),
        "duration_string": data.get("duration_string", "0:00"),
        "thumbnail": data.get("thumbnail", ""),
        "uploader": data.get("uploader", "Unknown"),
        "formats": formats,
        "url": url,
    }


async def download_media(
    url: str,
    format_type: str = "mp4",
    quality: Optional[str] = None,
) -> tuple[str, str]:
    """
    Download media from URL.
    format_type: 'mp4' or 'mp3'
    quality: e.g. '720p', '1080p' (only for video)
    Returns (file_path, filename).
    """
    download_id = str(uuid.uuid4())[:8]
    output_dir = TEMP_DIR / download_id
    output_dir.mkdir(parents=True, exist_ok=True)

    output_template = str(output_dir / "%(title)s.%(ext)s")

    if format_type == "mp3":
        args = [
            "-f", YTDLP_DEFAULT_AUDIO_FORMAT,
            "-x",
            "--audio-format", "mp3",
            "--audio-quality", "0",
            "-o", output_template,
            "--no-playlist",
            "--no-warnings",
            url,
        ]
    else:
        # Video download
        if quality:
            height = quality.replace("p", "")
            format_spec = (
                f"bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]/"
                f"bestvideo[height<={height}]+bestaudio/"
                f"best[height<={height}]/best"
            )
        else:
            format_spec = YTDLP_DEFAULT_VIDEO_FORMAT

        args = [
            "-f", format_spec,
            "--merge-output-format", "mp4",
            "-o", output_template,
            "--no-playlist",
            "--no-warnings",
            url,
        ]

    stdout, stderr, code = await _run_ytdlp(args)

    if code != 0:
        raise RuntimeError(f"Download failed: {stderr}")

    # Find the downloaded file
    downloaded_files = list(output_dir.iterdir())
    if not downloaded_files:
        raise RuntimeError("No file was downloaded")

    file_path = downloaded_files[0]
    return str(file_path), file_path.name


async def get_subtitles(url: str) -> Optional[str]:
    """
    Attempt to download subtitles from a YouTube video.
    Priority: manual subs → auto-generated subs.
    Returns subtitle text or None.
    """
    download_id = str(uuid.uuid4())[:8]
    sub_dir = TEMP_DIR / f"subs_{download_id}"
    sub_dir.mkdir(parents=True, exist_ok=True)

    # Try manual subtitles first
    for sub_type in ["--write-subs", "--write-auto-subs"]:
        args = [
            sub_type,
            "--sub-format", "vtt",
            "--sub-langs", "en,th,ja,ko,zh",  # Common languages
            "--skip-download",
            "-o", str(sub_dir / "subtitle"),
            "--no-warnings",
            url,
        ]
        stdout, stderr, code = await _run_ytdlp(args)

        # Check if any subtitle file was created
        sub_files = list(sub_dir.glob("*.vtt"))
        if sub_files:
            subtitle_text = _parse_vtt(sub_files[0].read_text(encoding="utf-8"))
            # Cleanup
            for f in sub_dir.iterdir():
                f.unlink()
            sub_dir.rmdir()
            return subtitle_text

    # Cleanup
    for f in sub_dir.iterdir():
        f.unlink()
    sub_dir.rmdir()
    return None


def _parse_vtt(vtt_content: str) -> str:
    """Parse VTT subtitle content and extract clean text."""
    lines = vtt_content.split("\n")
    text_lines = []
    seen = set()

    for line in lines:
        line = line.strip()
        # Skip VTT headers, timestamps, and empty lines
        if (
            not line
            or line.startswith("WEBVTT")
            or line.startswith("Kind:")
            or line.startswith("Language:")
            or "-->" in line
            or re.match(r"^\d+$", line)
        ):
            continue

        # Remove HTML tags
        clean = re.sub(r"<[^>]+>", "", line)
        if clean and clean not in seen:
            seen.add(clean)
            text_lines.append(clean)

    return " ".join(text_lines)


async def download_audio_only(url: str) -> tuple[str, str]:
    """
    Download only the audio from a video URL (for AI audio summarization).
    Returns (file_path, filename).
    """
    download_id = str(uuid.uuid4())[:8]
    output_dir = TEMP_DIR / f"audio_{download_id}"
    output_dir.mkdir(parents=True, exist_ok=True)

    output_template = str(output_dir / "%(title)s.%(ext)s")

    args = [
        "-f", YTDLP_DEFAULT_AUDIO_FORMAT,
        "-x",
        "--audio-format", "mp3",
        "--audio-quality", "5",  # Lower quality to reduce size/tokens
        "-o", output_template,
        "--no-playlist",
        "--no-warnings",
        url,
    ]

    stdout, stderr, code = await _run_ytdlp(args)

    if code != 0:
        raise RuntimeError(f"Audio download failed: {stderr}")

    downloaded_files = list(output_dir.iterdir())
    if not downloaded_files:
        raise RuntimeError("No audio file was downloaded")

    file_path = downloaded_files[0]
    return str(file_path), file_path.name
