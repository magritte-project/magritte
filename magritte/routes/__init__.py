from fastapi import APIRouter

from .artworks import router as artworks_router
from .auth import router as auth_router
from .extensions import router as extensions_router
from .libraries import router as libraries_router
from .playback_events import router as playback_events_router
from .sources import router as sources_router
from .users import router as users_router

router = APIRouter()
router.include_router(artworks_router)
router.include_router(auth_router)
router.include_router(extensions_router)
router.include_router(libraries_router)
router.include_router(playback_events_router)
router.include_router(sources_router)
router.include_router(users_router)


__all__ = ["router"]
