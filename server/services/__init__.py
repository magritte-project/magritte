import importlib
import os
import sys
from traceback import print_tb
from types import ModuleType
from typing import Any

from schemas.service import ServiceFeature, ServiceKind, ServiceSearchResults

_loaded = dict[str, ModuleType | None]()


class Service:
    def __init__(
        self,
        name: str,
        module: ModuleType | None,
    ):
        self._name: str = name
        self._module: ModuleType | None = module

    @property
    def _module_dict(self) -> dict[str, Any]:
        if self._module is not None:
            return self._module.__dict__
        else:
            return {}

    @property
    def name(self) -> str:
        return self._name

    @property
    def display_name(self) -> str:
        return self._module_dict.get("display_name", self.name)

    @property
    def active(self) -> bool:
        return self._module is not None

    @property
    def features(self) -> set[ServiceFeature]:
        features = self._module_dict.get("features", [])
        return {ServiceFeature(feature) for feature in features}

    async def read_token(self) -> str:
        read_token = self._module_dict.get("read_token", [])
        return await read_token()

    async def search(
        self,
        query: str,
        kind: set[ServiceKind],
        offset: int,
        limit: int,
    ) -> ServiceSearchResults:
        search = self._module_dict.get("search", [])
        return await search(
            query=query,
            kind=kind,
            offset=offset,
            limit=limit,
        )


def get_services():
    return [Service(name, module) for name, module in _loaded.items()]


def get_service(name: str):
    module = _loaded.get(name)
    if module:
        return Service(name, module)
    else:
        return None


search_dir = os.path.dirname(os.path.abspath(__file__))
for name in os.listdir(search_dir):
    if name.startswith(".") or name.startswith("__"):
        continue

    try:
        existing_module = _loaded.get(name)
        if existing_module:
            _loaded[name] = importlib.reload(existing_module)
        else:
            _loaded[name] = importlib.import_module(f".{name}", package=__package__)
    except Exception as e:
        _loaded[name] = None
        print(f"*** Could not load service {name}: {str(e)}", file=sys.stderr)
        if e.__traceback__:
            print_tb(e.__traceback__, file=sys.stderr)
