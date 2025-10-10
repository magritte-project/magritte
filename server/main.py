from dotenv import load_dotenv
from fastapi import FastAPI

from db import get_library_db_engine

load_dotenv()


async def app_lifespan(app: FastAPI):
    await get_library_db_engine()
    yield


app = FastAPI(
    lifespan=app_lifespan,
)


@app.get("/")
def read_root():
    return {
        "message": "hello, world",
    }
