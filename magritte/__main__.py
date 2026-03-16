import uvicorn
from fastapi import FastAPI

from magritte import app
from magritte.utilities.spa import SPAStaticFiles

if __name__ == "__main__":
    super_app = FastAPI()
    super_app.mount("/api", app, name="api")
    super_app.mount(
        "/", SPAStaticFiles(directory="spa", html=True), name="spa-static-files"
    )

    uvicorn.run(super_app, host="0.0.0.0", port=8090)
