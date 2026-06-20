import logging
import os
import sys


def is_verbose() -> bool:
    return os.getenv("VERBOSE", "0") == "1"


def setup() -> None:
    verbose = is_verbose()
    level = logging.DEBUG if verbose else logging.INFO

    fmt = (
        "%(asctime)s.%(msecs)03d [%(levelname)s] %(name)s: %(message)s"
        if verbose
        else "[%(levelname)s] %(message)s"
    )
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)
    handler.setFormatter(logging.Formatter(fmt, datefmt="%H:%M:%S"))

    logging.root.setLevel(level)
    logging.root.addHandler(handler)

    # Raw HTTP from Cohere — only when verbose
    for name in ("httpx", "httpcore", "cohere"):
        logging.getLogger(name).setLevel(logging.DEBUG if verbose else logging.WARNING)

    # Always useful
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)

    if verbose:
        logging.getLogger(__name__).debug("VERBOSE=1 — full debug logging active")
