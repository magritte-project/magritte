from dotenv import load_dotenv
from fastapi import FastAPI

from db import get_db_engine
from routes import router

load_dotenv()


async def app_lifespan(app: FastAPI):
    await get_db_engine()
    yield


app = FastAPI(
    lifespan=app_lifespan,
)

app.include_router(router)
