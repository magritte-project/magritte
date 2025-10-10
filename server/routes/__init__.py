from fastapi import APIRouter

from .users import router as users_router

router = APIRouter()
router.include_router(users_router)


@router.get("/")
def read_root():
    return {
        "message": "hello, world",
    }


__all__ = ["router"]
