from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, Request

from functions import Functions, get_functions

router = APIRouter(prefix="/functions")


@router.post(
    "/{name}",
    summary="Call a server function",
)
async def call_function(
    name: str,
    body: Annotated[Any, Body()],
    functions: Annotated[Functions, Depends(get_functions)],
    request: Request,
):
    return await functions.call(name, request)
