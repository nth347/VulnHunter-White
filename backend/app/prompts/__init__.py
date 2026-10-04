"""Load and render prompt markdown documents."""

from __future__ import annotations

import os
from pathlib import Path
from string import Template

PROMPTS_DIR = Path(__file__).resolve().parent
# Fallback language when a call site has no project context. English is the
# product default; set USE_ENGLISH_PROMPTS=false to fall back to Chinese.
USE_ENGLISH_PROMPTS = os.getenv("USE_ENGLISH_PROMPTS", "true").lower() in ("true", "1", "yes")

DEFAULT_LANGUAGE = "en"
SUPPORTED_LANGUAGES = ("en", "zh")


def normalize_language(language: str | None) -> str:
    """Map an arbitrary language tag onto a supported prompt language."""
    tag = str(language or "").strip().lower().replace("_", "-")
    if not tag:
        return "en" if USE_ENGLISH_PROMPTS else "zh"
    if tag.startswith("zh"):
        return "zh"
    if tag.startswith("en"):
        return "en"
    return DEFAULT_LANGUAGE


def _english_candidates(name: str) -> list[str]:
    """English sibling names for a prompt.

    Call sites pass names that already carry the extension ("worker.md"), so the
    English sibling has to be built from the stem - appending to the full name
    would look for "worker.md.en.md".
    """
    stem = name[:-3] if name.endswith(".md") else name
    return [f"{stem}.en.md", f"{stem}.en"]


def english_prompt_path(name: str) -> Path | None:
    """Return the English sibling for a prompt, or None when it has none."""
    for candidate in _english_candidates(name):
        path = PROMPTS_DIR / candidate
        if path.exists():
            return path
    return None


def load_prompt(name: str, language: str | None = None) -> str:
    if normalize_language(language) == "en":
        path = english_prompt_path(name)
        if path is not None:
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


def cvss_scoring_prompt(language: str | None = None) -> str:
    """CVSS 3.1 metric selection rules shared by Reviewer prompts and ConfirmVuln."""
    return load_prompt("cvss.md", language=language).strip()
