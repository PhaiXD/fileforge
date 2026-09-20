"""
FileForge — Main Application Entry Point
A local web application for file conversion, compression & media tools.
"""
import shutil
import uvicorn
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from config import (
    APP_DESCRIPTION,
    APP_NAME,
    APP_VERSION,
    HOST,
    PORT,
    STATIC_DIR,
    TEMP_DIR,
    TEMPLATES_DIR,
)
from routers import pdf, image, media, ai, system


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle events."""
    # Startup: create temp directory
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    print(f"\n{'='*50}")
    print(f"  {APP_NAME} v{APP_VERSION}")
    print(f"  Running at http://{HOST}:{PORT}")
    print(f"{'='*50}\n")
    yield
    # Shutdown: clean up temp directory
    if TEMP_DIR.exists():
        shutil.rmtree(TEMP_DIR, ignore_errors=True)


# --- Create FastAPI App ---
app = FastAPI(
    title=APP_NAME,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
    lifespan=lifespan,
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Mount Static Files ---
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# --- Include Routers ---
app.include_router(pdf.router)
app.include_router(image.router)
app.include_router(media.router)
app.include_router(ai.router)
app.include_router(system.router)


# --- Serve Frontend ---
@app.get("/")
async def serve_index():
    """Serve the main frontend page."""
    return FileResponse(str(TEMPLATES_DIR / "index.html"))


# --- Run Server ---
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=True,
    )
