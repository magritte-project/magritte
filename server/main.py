from contextlib import asynccontextmanager

from fastapi import FastAPI

from ingestion.watcher import library_watcher
from routes import router
from utilities.spa import SPAStaticFiles


@asynccontextmanager
async def app_lifespan(app: FastAPI):
    with library_watcher():
        yield


app = FastAPI(
    lifespan=app_lifespan,
    description="The API server for a Magritte instance",
)
app.include_router(router)

if __name__ == "__main__":
    import uvicorn

    super_app = FastAPI()
    super_app.mount("/api", app, name="api")
    super_app.mount(
        "/", SPAStaticFiles(directory="spa", html=True), name="spa-static-files"
    )

    uvicorn.run(super_app, host="0.0.0.0", port=8090)
