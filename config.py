"""
FileForge — Application Configuration
"""
import os
from pathlib import Path

# --- App Info ---
APP_NAME = "FileForge"
APP_VERSION = "1.0.0"
APP_DESCRIPTION = "Local file conversion, compression & media tools"

# --- GitHub Repository (for auto-update) ---
GITHUB_REPO_OWNER = "ADMIN"
GITHUB_REPO_NAME = "fileforge"
GITHUB_REPO_URL = f"https://github.com/{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}"
GITHUB_API_URL = f"https://api.github.com/repos/{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}"

# --- Paths ---
BASE_DIR = Path(__file__).resolve().parent
TEMP_DIR = BASE_DIR / "temp"
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"

# --- Server ---
HOST = "127.0.0.1"
PORT = 8000

# --- Upload Limits ---
MAX_UPLOAD_SIZE_MB = 100
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

# --- Allowed Extensions ---
ALLOWED_EXTENSIONS = {
    "pdf": [".pdf"],
    "image": [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif", ".heic", ".svg"],
    "video": [".mp4", ".mov", ".avi", ".mkv", ".webm"],
    "audio": [".mp3", ".wav", ".aac", ".flac", ".ogg", ".m4a"],
    "document": [".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"],
}

# --- yt-dlp Config ---
YTDLP_DEFAULT_VIDEO_FORMAT = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"
YTDLP_DEFAULT_AUDIO_FORMAT = "bestaudio[ext=m4a]/bestaudio/best"

# --- Gemini Config ---
GEMINI_TEXT_MODEL = "gemini-2.0-flash"
GEMINI_AUDIO_MODEL = "gemini-1.5-pro"
GEMINI_SUMMARIZE_PROMPT = """You are a professional content summarizer. 
Provide a clear, well-structured summary of the following content.
Use bullet points for key takeaways. Keep it concise but comprehensive.
Respond in the same language as the content."""

GEMINI_AUDIO_SUMMARIZE_PROMPT = """You are a professional content summarizer.
Listen to the audio and provide a clear, well-structured summary.
Use bullet points for key takeaways. Keep it concise but comprehensive.
Respond in the same language as the audio content."""
