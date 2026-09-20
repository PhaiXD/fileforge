"""
FileForge — System Router
API endpoints for version checking, auto-update, and system health.
"""
from fastapi import APIRouter

from services.system_service import check_dependencies, check_for_update, get_current_version, perform_update

router = APIRouter(prefix="/api/system", tags=["System"])


@router.get("/version")
async def version():
    """Get the current application version."""
    current = await get_current_version()
    return {"version": current}


@router.get("/check-update")
async def check_update():
    """Check if a newer version is available on GitHub."""
    result = await check_for_update()
    return result


@router.post("/update")
async def update():
    """Perform a git pull to update the application."""
    result = await perform_update()
    return result


@router.get("/health")
async def health_check():
    """Check system health and external dependency availability."""
    deps = await check_dependencies()
    all_ok = all(deps.values())
    return {
        "status": "healthy" if all_ok else "degraded",
        "dependencies": deps,
    }
