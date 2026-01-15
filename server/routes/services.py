from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from schemas.service import (
    ServiceFeature,
    ServiceSearchResults,
    ServiceSongRead,
    ServiceToken,
)
from services import get_service

router = APIRouter(prefix="/services")


@router.post(
    "/{name}/token",
    response_model=ServiceToken,
    summary="Get a bearer token for a specific service",
)
async def read_service_token(
    name: str,
):
    service = get_service(name)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )
    if ServiceFeature.READ_TOKEN not in service.features:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Service does not support read token",
        )
    token = await service.read_token()
    return ServiceToken(
        bearer_token=token,
    )


@router.get(
    "/{name}/search/songs",
    response_model=ServiceSearchResults[ServiceSongRead],
    summary="Search a service's content",
)
async def search_service_songs(
    name: str,
    query: Annotated[str, Query()],
    offset: Annotated[int, Query()] = 0,
    limit: Annotated[int, Query()] = 25,
):
    service = get_service(name)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )
    if ServiceFeature.SEARCH_SONGS not in service.features:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Service does not support search songs",
        )
    results = await service.search_songs(
        query=query,
        offset=offset,
        limit=limit,
    )
    return results
