import importlib
import inspect
import logging
from pathlib import Path
from types import ModuleType

from fastapi import HTTPException, Request, Response, status
from fastapi.responses import JSONResponse

_loaded_modules = dict[str, ModuleType | None]()


class Functions:
    def __init__(
        self,
        modules: dict[str, ModuleType | None],
    ):
        self._modules: dict[str, ModuleType | None] = modules

    @property
    def available(self) -> list[str]:
        """List of available functions"""
        return list(
            name for name, module in self._modules.items() if module is not None
        )

    async def call(self, name: str, request: Request) -> Response:
        """
        Call a function by name to service an incoming request.

        :param name: The name of the function to call.
        :param request: The request object.
        :returns: A response object.
        """

        module = self._modules.get(name)
        if not module:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"detail": "Function not found"},
            )
        try:
            handler = module.__dict__["handler"]
            if inspect.iscoroutinefunction(handler):
                return await handler(request)
            else:
                return handler(request)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Function {name} error: {e}",
            ) from e


def get_functions():
    return Functions(
        modules=_loaded_modules.copy(),
    )


serach_dir = Path(__file__).absolute().parent
for subpath in serach_dir.iterdir():
    name = subpath.name
    if name.startswith(".") or name.startswith("__"):
        continue

    try:
        existing_module = _loaded_modules.get(name)
        if existing_module:
            _loaded_modules[name] = importlib.reload(existing_module)
        else:
            _loaded_modules[name] = importlib.import_module(
                f".{name}", package=__package__
            )
    except NotImplementedError:
        _loaded_modules[name] = None
        logging.info(f"Function '{name}' is disabled")
    except Exception as e:
        _loaded_modules[name] = None
        logging.error(f"*** Could not load function {name}: {str(e)}", stack_info=True)
