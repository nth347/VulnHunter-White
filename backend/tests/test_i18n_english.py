"""English-path coverage for the i18n work.

The rest of the suite pins the Chinese path (see conftest and the per-module
language pins); this module checks the English behaviour those pins displaced:
the loader, the report parsers, the gates, and the backend message catalog.
"""

from __future__ import annotations

import re

import pytest

from app import i18n
from app.prompts import load_prompt, normalize_language
from app.report_sections import heading, heading_re, outline_block
from app.services import report as R

_CJK = re.compile(r"[一-鿿]")

# Prompts concatenated into every system prompt: an English project must get
# an English sibling, or the system prompt becomes a mix of languages.
_ALWAYS_CONCATENATED = [
    "worker.md",
    "reviewer.md",
    "modes/bounty.md",
    "modes/full.md",
    "poc.md",
    "report-formats.md",
    "cvss.md",
    "verify/static.md",
    "verify/harness.md",
    "verify/lab.md",
    "target_kinds/web.md",
    "target_kinds/library.md",
    "target_kinds/mixed.md",
]


def test_normalize_language_defaults_to_english():
    assert normalize_language(None) == "en"
    assert normalize_language("en-US") == "en"
    assert normalize_language("zh-CN") == "zh"
    assert normalize_language("fr") == "en"


@pytest.mark.parametrize("name", _ALWAYS_CONCATENATED)
def test_concatenated_prompts_have_english_siblings(name):
    # The skeleton in poc.md keeps a deliberate bilingual (en, zh) label table,
    # so only assert the prose outside fenced code blocks is CJK-free.
    text = load_prompt(name, language="en")
    outside = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    assert not _CJK.search(outside), f"{name} still has Chinese outside code fences"


def test_english_report_passes_heading_and_title_gates():
    report = f"# SQL injection in LoginController\n\n{outline_block('en')}\n"
    # The required-heading gate accepts the English report.
    assert R.missing_report_headings(report, language="en") == []
    # The title gate accepts an English title and rejects a Chinese-only one.
    assert R.title_language_block_reason("SQL injection in login", language="en") is None
    assert R.title_language_block_reason("登录处注入", language="en") is not None


def test_english_asset_proof_roundtrips():
    section = R.search_fingerprint_section(fofa='title="A"', x='app="A"', language="en")
    assert heading("asset_proof", 2, "en") in section
    assert not _CJK.search(re.sub(r"```.*?```", "", section, flags=re.DOTALL))
    assert R.extract_asset_queries(section) == ('title="A"', 'app="A"')


def test_parsers_match_both_languages():
    for lang in ("en", "zh"):
        h = heading("vuln_code", 3, lang)
        assert heading_re("vuln_code", level=3).search(h)
        trig = heading("trigger_conditions", 3, lang)
        assert heading_re("trigger_conditions", level=3).search(trig)


def test_produced_at_line_follows_language():
    assert R.produced_at_line(None, "en").startswith("**Produced at**: ")
    assert R.produced_at_line(None, "zh").startswith("**产出时间**：")


def test_backend_catalog_resolves_both_languages():
    assert i18n.tr("project.not_found", "en") == "Project not found"
    assert i18n.tr("project.not_found", "zh") == "项目不存在"
    # Unknown key falls back to the key itself.
    assert i18n.tr("nope.nope", "en") == "nope.nope"
    # The inline-Chinese safety net translates a known source string.
    assert i18n.translate_source("项目不存在", "en") == "Project not found"
    assert i18n.translate_source("not in catalog", "en") == "not in catalog"


def test_submission_reason_gate_is_language_aware():
    from app.vuln_types import normalize_submission_decision

    assert (
        normalize_submission_decision(
            submission_tier="low_impact",
            submission_reason="Frontend unauthenticated RCE",
            language="en",
        ).tier
        == "low_impact"
    )
    with pytest.raises(ValueError):
        normalize_submission_decision(
            submission_tier="low_impact",
            submission_reason="前台未授权",
            language="en",
        )
