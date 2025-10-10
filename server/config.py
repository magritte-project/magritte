import os

from dotenv import load_dotenv

load_dotenv()

ALGORITHM = os.environ.get("ALGORITHM", "HS256")
SECRET = os.environ["SECRET"]
SALT = os.environ["SALT"]
