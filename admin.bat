@echo off
cd /d "%~dp0"
if "%~1"=="" (
    uv run python -m magritte -h
) else (
    uv run python -m magritte %*
)
