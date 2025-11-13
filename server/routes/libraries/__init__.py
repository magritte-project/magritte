from fastapi import APIRouter

from .albums import router as albums_subrouter
from .artists import router as artists_subrouter
from .manage import router as manage_subrouter
from .songs import router as songs_subrouter

router = APIRouter(prefix="/libraries")

router.include_router(albums_subrouter)
router.include_router(artists_subrouter)
router.include_router(manage_subrouter)
router.include_router(songs_subrouter)
