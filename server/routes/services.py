from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from schemas.service import (
    ServiceFeature,
    ServiceKind,
    ServiceRead,
    ServiceSearchResults,
    ServiceToken,
)
from services import Service, get_service, get_services

router = APIRouter(prefix="/services")


@router.get(
    "/available",
    response_model=list[ServiceRead],
    summary="Read details about available services",
)
async def read_services(
    services: list[Service] = Depends(get_services),
):
    return [
        ServiceRead(
            name=service.name,
            display_name=service.display_name,
            active=service.active,
            features=list(service.features),
        )
        for service in services
    ]


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
    "/{name}/search",
    response_model=ServiceSearchResults,
    summary="Search a service's content",
)
async def search_service(
    name: str,
    query: Annotated[str, Query()],
    kind: Annotated[list[ServiceKind], Query(...)] = [ServiceKind.SONGS],
    offset: Annotated[int, Query()] = 0,
    limit: Annotated[int, Query()] = 25,
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
    results = await service.search(
        query=query,
        kind=kind,
        offset=offset,
        limit=limit,
    )
    return results
