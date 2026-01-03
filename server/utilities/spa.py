from typing import override

from fastapi import Response, status
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.types import Scope


class SPAStaticFiles(StaticFiles):
    @override
    async def get_response(self, path: str, scope: Scope) -> Response:
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as e:
            if e.status_code == status.HTTP_404_NOT_FOUND:
                return await super().get_response("index.html", scope)
            else:
                raise e
