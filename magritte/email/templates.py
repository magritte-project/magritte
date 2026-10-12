from pathlib import Path
from typing import Any, NamedTuple

from jinja2 import Environment, FileSystemLoader, TemplateNotFound, select_autoescape

_env = Environment(
    loader=FileSystemLoader([Path(__file__).parent.resolve() / "templates"]),
    autoescape=select_autoescape(),
    enable_async=True,
)


class RenderedEmailTemplate(NamedTuple):
    plain: str
    html: str | None


async def render_email_template(
    name: str, context: dict[str, Any]
) -> RenderedEmailTemplate:
    plain_template = _env.get_template(f"{name}.txt")
    plain = await plain_template.render_async(context)

    try:
        html_template = _env.get_template(f"{name}.html")
        html = await html_template.render_async(context)
    except TemplateNotFound:
        html = None

    return RenderedEmailTemplate(plain, html)
