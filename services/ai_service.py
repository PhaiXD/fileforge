"""
FileForge — AI Summarization Service
Handles text and audio summarization via Google Gemini API.
"""
import os
from pathlib import Path
from typing import Optional

import google.generativeai as genai

from config import (
    GEMINI_AUDIO_MODEL,
    GEMINI_AUDIO_SUMMARIZE_PROMPT,
    GEMINI_SUMMARIZE_PROMPT,
    GEMINI_TEXT_MODEL,
)


def _configure_genai(api_key: str):
    """Configure the Gemini API with the provided key."""
    genai.configure(api_key=api_key)


async def summarize_text(
    text: str,
    api_key: str,
    custom_prompt: Optional[str] = None,
) -> str:
    """
    Summarize text content using Gemini.
    Returns the summary string.
    """
    _configure_genai(api_key)
    model = genai.GenerativeModel(GEMINI_TEXT_MODEL)

    prompt = custom_prompt or GEMINI_SUMMARIZE_PROMPT
    full_prompt = f"{prompt}\n\n---\n\n{text}"

    response = model.generate_content(full_prompt)
    return response.text


async def summarize_audio(
    audio_path: str,
    api_key: str,
    custom_prompt: Optional[str] = None,
) -> str:
    """
    Summarize audio content using Gemini 1.5 (audio understanding).
    Uploads the audio file and asks Gemini to summarize it.
    Returns the summary string.
    """
    _configure_genai(api_key)
    model = genai.GenerativeModel(GEMINI_AUDIO_MODEL)

    prompt = custom_prompt or GEMINI_AUDIO_SUMMARIZE_PROMPT

    # Upload the audio file to Gemini
    audio_file = genai.upload_file(audio_path)

    response = model.generate_content([prompt, audio_file])

    # Clean up uploaded file
    try:
        genai.delete_file(audio_file.name)
    except Exception:
        pass

    return response.text
