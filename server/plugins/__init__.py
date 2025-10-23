import importlib
import os
import sys
from traceback import print_tb
from types import ModuleType
from typing import TypeVar

from fastapi import APIRouter

from schemas.plugin import PluginRead

_T = TypeVar("_T")

router = APIRouter(prefix="/plugins")

_loaded_plugins = dict[str, ModuleType]()


def _get_plugin_attr(
    plugin_module: ModuleType, attr: str, value_type: type[_T]
) -> _T | None:
    value = plugin_module.__dict__[attr]
    if isinstance(value, value_type):
        return value
    else:
        return None


@router.get(
    "/installed",
    response_model=list[PluginRead],
    summary="Read the plugins installed on this server",
)
async def read_installed_plugins():
    return [
        PluginRead(
            name=name,
        )
        for name, _ in _loaded_plugins.items()
    ]


search_dir = os.path.dirname(os.path.abspath(__file__))
for name in os.listdir(search_dir):
    if name.startswith(".") or name.startswith("__"):
        continue

    try:
        if name in _loaded_plugins:
            importlib.reload(_loaded_plugins[name])
        else:
            plugin_module = importlib.import_module(f".{name}", package=__package__)
            plugin_router = _get_plugin_attr(plugin_module, "router", APIRouter)
            if plugin_router:
                router.include_router(
                    plugin_router,
                    prefix=f"/{name}",
                    include_in_schema=True,  # TODO: Not long term, no
                )
            _loaded_plugins[name] = plugin_module
    except Exception as e:
        print(f"*** Could not load plugin {name}: {str(e)}", file=sys.stderr)
        if e.__traceback__:
            print_tb(e.__traceback__, file=sys.stderr)
