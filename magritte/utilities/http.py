import httpx2


async def get_http_client():
    """
    Inject an HTTP client for making outbound requests.
    """

    async with httpx2.AsyncClient() as client:
        yield client
