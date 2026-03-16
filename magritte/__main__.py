import uvicorn
from fastapi import FastAPI

from magritte import app, app_lifespan
from magritte.utilities.spa import SPAStaticFiles

if __name__ == "__main__":
    super_app = FastAPI(
        lifespan=app_lifespan,
        description="A Magritte instance",
    )
    super_app.mount("/api", app, name="api")
    super_app.mount(
        "/", SPAStaticFiles(directory="static", html=True), name="static-files"
    )

    uvicorn.run(super_app, host="0.0.0.0", port=8090)
