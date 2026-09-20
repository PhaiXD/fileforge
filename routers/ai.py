"""
FileForge — AI Router
API endpoints for AI-powered summarization via Google Gemini.
"""
from fastapi import APIRouter, File, Form, UploadFile
from typing import Optional

from services.ai_service import summarize_audio, summarize_text
from services.media_service import download_audio_only, get_subtitles
from services.pdf_service import extract_text_from_pdf

router = APIRouter(prefix="/api/ai", tags=["AI"])


@router.post("/summarize-pdf")
async def summarize_pdf(
    file: UploadFile = File(...),
    api_key: str = Form(...),
    custom_prompt: Optional[str] = Form(None),
):
    """
    Summarize a PDF document using Gemini AI.
    Extracts text from the PDF, then sends to Gemini for summarization.
    """
    if not file.filename.lower().endswith(".pdf"):
        return {"success": False, "error": "Please upload a PDF file"}

    if not api_key:
        return {"success": False, "error": "Google API key is required"}

    try:
        pdf_bytes = await file.read()
        text = await extract_text_from_pdf(pdf_bytes)

        if not text.strip():
            return {
                "success": False,
                "error": "Could not extract text from PDF. The PDF may contain only images.",
            }

        summary = await summarize_text(text, api_key, custom_prompt=custom_prompt)
        return {"success": True, "summary": summary}

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/check-subtitle")
async def check_subtitle(url: str = Form(...)):
    """
    Check if a YouTube video has subtitles available.
    Returns the subtitle status so the frontend can warn the user
    before proceeding with audio-based summarization.
    """
    try:
        subtitle_text = await get_subtitles(url)
        has_subtitle = subtitle_text is not None and len(subtitle_text.strip()) > 0

        return {
            "success": True,
            "has_subtitle": has_subtitle,
            "subtitle_length": len(subtitle_text) if subtitle_text else 0,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/summarize-video")
async def summarize_video(
    url: str = Form(...),
    api_key: str = Form(...),
    use_audio: bool = Form(False),
    custom_prompt: Optional[str] = Form(None),
):
    """
    Summarize a YouTube video using Gemini AI.
    
    Flow:
    1. Try to get manual subtitles
    2. If no manual subs, try auto-generated subtitles
    3. If use_audio=True, download audio and use Gemini 1.5 to listen & summarize
    
    The frontend should first call /check-subtitle, and if no subs are found,
    show a warning to the user before calling this endpoint with use_audio=True.
    """
    if not api_key:
        return {"success": False, "error": "Google API key is required"}

    try:
        # Step 1 & 2: Try to get subtitles (manual then auto)
        if not use_audio:
            subtitle_text = await get_subtitles(url)

            if subtitle_text and subtitle_text.strip():
                # Summarize subtitle text
                summary = await summarize_text(
                    subtitle_text, api_key, custom_prompt=custom_prompt
                )
                return {
                    "success": True,
                    "summary": summary,
                    "method": "subtitle",
                }

            # No subtitles found — tell frontend to confirm audio usage
            return {
                "success": False,
                "no_subtitle": True,
                "error": "No subtitles available. Audio-based summarization required (high token usage).",
            }

        # Step 3: Audio-based summarization (user confirmed)
        audio_path, audio_filename = await download_audio_only(url)

        try:
            summary = await summarize_audio(
                audio_path, api_key, custom_prompt=custom_prompt
            )
            return {
                "success": True,
                "summary": summary,
                "method": "audio",
            }
        finally:
            # Clean up audio file
            import os
            try:
                os.remove(audio_path)
                os.rmdir(os.path.dirname(audio_path))
            except OSError:
                pass

    except Exception as e:
        return {"success": False, "error": str(e)}
