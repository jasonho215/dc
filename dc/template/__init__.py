import jinja2
from jinja2 import Environment, select_autoescape
from jinja2.loaders import PackageLoader

env = Environment(
    loader=PackageLoader("dc", "template"),
    autoescape=select_autoescape(["html", "xml"]),
    trim_blocks=True,
    lstrip_blocks=True,
    enable_async=True,
)


def get_template(name) -> jinja2.Template:
    return env.get_template(name)
