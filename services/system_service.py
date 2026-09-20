"""
FileForge — System Service
Handles version checking, auto-update via GitHub, and system health.
"""
import asyncio
import subprocess
from pathlib import Path
from typing import Any, Dict, Optional

import httpx

from config import APP_VERSION, BASE_DIR, GITHUB_API_URL, GITHUB_REPO_URL


async def get_current_version() -> str:
    """Return the current app version."""
    return APP_VERSION


async def check_for_update() -> Dict[str, Any]:
    """
    Check GitHub for the latest version by reading the remote config.py
    or using GitHub tags/releases.
    Returns dict with update info.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Try to get latest release from GitHub API
            response = await client.get(
                f"{GITHUB_API_URL}/releases/latest",
                headers={"Accept": "application/vnd.github.v3+json"},
            )

            if response.status_code == 200:
                data = response.json()
                latest_version = data.get("tag_name", "").lstrip("v")
                return {
                    "current_version": APP_VERSION,
                    "latest_version": latest_version,
                    "update_available": latest_version != APP_VERSION and latest_version != "",
                    "release_notes": data.get("body", ""),
                    "release_url": data.get("html_url", ""),
                }

            # Fallback: check tags
            response = await client.get(
                f"{GITHUB_API_URL}/tags",
                headers={"Accept": "application/vnd.github.v3+json"},
            )

            if response.status_code == 200:
                tags = response.json()
                if tags:
                    latest_tag = tags[0].get("name", "").lstrip("v")
                    return {
                        "current_version": APP_VERSION,
                        "latest_version": latest_tag,
                        "update_available": latest_tag != APP_VERSION and latest_tag != "",
                        "release_notes": "",
                        "release_url": f"{GITHUB_REPO_URL}/releases",
                    }

            # No releases or tags found
            return {
                "current_version": APP_VERSION,
                "latest_version": APP_VERSION,
                "update_available": False,
                "release_notes": "",
                "release_url": "",
            }

    except Exception as e:
        return {
            "current_version": APP_VERSION,
            "latest_version": "unknown",
            "update_available": False,
            "error": str(e),
        }


async def perform_update() -> Dict[str, Any]:
    """
    Perform a git pull to update the application from GitHub.
    Returns the result of the operation.
    """
    try:
        process = await asyncio.create_subprocess_exec(
            "git",
            "pull",
            "--rebase",
            cwd=str(BASE_DIR),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await process.communicate()

        stdout_text = stdout.decode("utf-8", errors="replace")
        stderr_text = stderr.decode("utf-8", errors="replace")

        if process.returncode == 0:
            return {
                "success": True,
                "message": stdout_text.strip() or "Update complete!",
                "requires_restart": True,
            }
        else:
            return {
                "success": False,
                "message": f"Update failed: {stderr_text.strip()}",
                "requires_restart": False,
            }

    except FileNotFoundError:
        return {
            "success": False,
            "message": "Git is not installed or not in PATH.",
            "requires_restart": False,
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Update error: {str(e)}",
            "requires_restart": False,
        }


async def check_dependencies() -> Dict[str, bool]:
    """
    Check if required external dependencies are installed.
    """
    deps = {}

    # Check yt-dlp
    try:
        process = await asyncio.create_subprocess_exec(
            "yt-dlp", "--version",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        await process.communicate()
        deps["yt-dlp"] = process.returncode == 0
    except FileNotFoundError:
        deps["yt-dlp"] = False

    # Check ffmpeg
    try:
        process = await asyncio.create_subprocess_exec(
            "ffmpeg", "-version",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        await process.communicate()
        deps["ffmpeg"] = process.returncode == 0
    except FileNotFoundError:
        deps["ffmpeg"] = False

    # Check git
    try:
        process = await asyncio.create_subprocess_exec(
            "git", "--version",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        await process.communicate()
        deps["git"] = process.returncode == 0
    except FileNotFoundError:
        deps["git"] = False

    return deps
