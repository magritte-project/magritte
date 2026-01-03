# Magritte.server

The API server for Magritte. Written in Python using FastAPI, SQLModel, and Pydantic.

## Installation

After following the directions in the main README to set up an environment, install dependencies from this directory:

```sh
uv sync
```

## Running

The server can be manually run by invoking the FastAPI development server through `uv`:

```sh
uv --directory "./server" run fastapi dev main.py
```

**Note**: To run the server after it has been packaged, invoke main.py directly through `uv`:

```sh
uv --directory "./dist" run --no-active python main.py
```

## Testing

The tests can be run invoking `pytest` through uv:

```sh
uv --directory "./server" run pytest
```
