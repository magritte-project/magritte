from contextlib import asynccontextmanager

from fastapi import FastAPI

from ingestion.watcher import library_watcher
from routes import router


@asynccontextmanager
async def app_lifespan(app: FastAPI):
    with library_watcher():
        yield


app = FastAPI(
    lifespan=app_lifespan,
    description="The API server for a Magritte instance",
)

app.include_router(router)
