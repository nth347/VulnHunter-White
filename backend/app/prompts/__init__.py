"""Load and render prompt markdown documents."""

from __future__ import annotations

import os
from pathlib import Path
from string import Template

PROMPTS_DIR = Path(__file__).resolve().parent
USE_ENGLISH_PROMPTS = os.getenv("USE_ENGLISH_PROMPTS", "false").lower() in ("true", "1", "yes")


def load_prompt(name: str, language: str | None = None) -> str:
    use_english = language == "en" or (language is None and USE_ENGLISH_PROMPTS)

    if use_english:
        for en_suffix in [f"{name}.en.md", f"{name}.en"]:
            path = PROMPTS_DIR / en_suffix
            if path.exists():
                return path.read_text(encoding="utf-8")

    path = PROMPTS_DIR / name
    if not path.exists():
        path = PROMPTS_DIR / f"{name}.md"
    if not path.exists():
        raise FileNotFoundError(f"prompt not found: {name}")
    return path.read_text(encoding="utf-8")


def render_prompt(name: str, language: str | None = None, **kwargs: object) -> str:
    """Load a prompt document and substitute ${placeholders}."""
    mapping = {key: "" if value is None else str(value) for key, value in kwargs.items()}
    return Template(load_prompt(name, language=language)).safe_substitute(mapping).strip()


def cvss_scoring_prompt() -> str:
    """CVSS 3.1 metric selection rules shared by Reviewer prompts and ConfirmVuln."""
    return load_prompt("cvss.md").strip()
