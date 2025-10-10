from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()

app = FastAPI()


@app.get("/")
def read_root():
    return {
        "message": "hello, world",
    }
