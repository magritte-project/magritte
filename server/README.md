# Magritte.server

The API server for Magritte. Written in Python using FastAPI, SQLModel, and Pydantic.

## Installation

After following the directions in the main README to set up an environment, install dependencies from this directory:

```sh
uv sync
```

## Running

The server can be manually run from this directory:

```sh
uv run fastapi dev main.py
```

## Testing

The tests can be run invoking `pytest` from this directory:

```sh
uv run pytest
```
