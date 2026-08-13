import asyncio
import pathlib
from contextlib import asynccontextmanager

import alembic.command
from alembic.config import Config
from fastapi import FastAPI

from magritte.routes import router
from magritte.worker import library_worker


@asynccontextmanager
async def app_lifespan(app: FastAPI):
    cfg = Config()
    cfg.set_main_option(
        "script_location", str(pathlib.Path(__file__).parent / "migrations")
    )
    await asyncio.to_thread(alembic.command.upgrade, cfg, "head")

    with library_worker():
        yield


app = FastAPI(
    lifespan=app_lifespan,
    description="The API server for a Magritte instance",
)
app.include_router(router)
