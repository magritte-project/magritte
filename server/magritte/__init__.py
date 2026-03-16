from contextlib import asynccontextmanager

from fastapi import FastAPI

from magritte.routes import router
from magritte.worker import library_worker


@asynccontextmanager
async def app_lifespan(app: FastAPI):
    with library_worker():
        yield


app = FastAPI(
    lifespan=app_lifespan,
    description="The API server for a Magritte instance",
)
app.include_router(router)
