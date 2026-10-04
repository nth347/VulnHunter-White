"""Canonical report section headings in every supported language.

The agent fills in templates/vuln-report.md; report.py, exposure_mode.py and the
Confirm gates then parse those headings back out of the generated report. Once
the template is translated the model emits English headings, so a parser pinned
to the Chinese wording silently stops matching - the gate passes a report that
has no PoC section, the calibration score is never read, and so on.

Both sides read their headings from here: writers take the canonical form for the
project language, parsers accept every language's form.
"""

from __future__ import annotations

import re

# key -> language -> accepted heading forms; the first form is canonical.
SECTIONS: dict[str, dict[str, tuple[str, ...]]] = {
    "summary": {"zh": ("摘要",), "en": ("Summary",)},
    "description": {"zh": ("漏洞描述",), "en": ("Vulnerability description",)},
    "impact": {"zh": ("漏洞危害",), "en": ("Impact",)},
    "vendor": {"zh": ("漏洞厂商全称",), "en": ("Vendor full name",)},
    "affected_products": {
        "zh": ("已知受影响产品及版本",),
        "en": ("Known affected products and versions",),
    },
    "asset_proof": {
        "zh": ("互联网资产证明", "应用搜索指纹"),
        "en": ("Internet asset proof", "App search fingerprints"),
    },
    "mapping_queries": {"zh": ("精准测绘语法",), "en": ("Precise mapping queries",)},
    "fofa": {"zh": ("FOFA",), "en": ("FOFA",)},
    "x_intel": {"zh": ("X 情报社区",), "en": ("X intelligence community",)},
    "technical_details": {"zh": ("漏洞技术细节",), "en": ("Technical details",)},
    "source_sink": {"zh": ("Source → Sink",), "en": ("Source → Sink",)},
    "vuln_code": {"zh": ("漏洞代码",), "en": ("Vulnerable code",)},
    "poc_description": {"zh": ("完整 PoC 描述",), "en": ("Full PoC description",)},
    "trigger_conditions": {"zh": ("触发条件",), "en": ("Trigger conditions",)},
    "same_root_cause": {
        "zh": ("同根因受影响点",),
        "en": ("Same-root-cause affected points",),
    },
    "reproduction": {"zh": ("复现证明",), "en": ("Reproduction proof",)},
    "environment_setup": {"zh": ("基础环境搭建",), "en": ("Environment setup",)},
    "trigger_steps": {"zh": ("漏洞触发操作",), "en": ("Trigger steps",)},
    "local_verification": {"zh": ("局部验证",), "en": ("Local verification",)},
    "dynamic_verification": {"zh": ("动态验证",), "en": ("Dynamic verification",)},
    "expected_evidence": {"zh": ("预期证据",), "en": ("Expected evidence",)},
    "reproduction_notes": {"zh": ("复现注意事项",), "en": ("Reproduction notes",)},
    "remediation": {"zh": ("修复方案",), "en": ("Remediation",)},
    "notes": {"zh": ("备注",), "en": ("Notes",)},
    "patch_bypass": {"zh": ("补丁绕过简析",), "en": ("Patch bypass analysis",)},
    "followup": {"zh": ("建议后续方向",), "en": ("Suggested next steps",)},
    "poc": {"zh": ("PoC",), "en": ("PoC",)},
    "environment": {"zh": ("环境",), "en": ("Environment",)},
    "conclusion": {"zh": ("结论",), "en": ("Conclusion",)},
}

# Inline bold labels (**label**: value), not headings.
LABELS: dict[str, dict[str, tuple[str, ...]]] = {
    "produced_at": {"zh": ("产出时间",), "en": ("Produced at",)},
    "calibration_score": {"zh": ("校准得分",), "en": ("Calibration score",)},
}

DEFAULT_LANGUAGE = "en"


def _forms(registry: dict[str, dict[str, tuple[str, ...]]], key: str) -> list[str]:
    """Every accepted form of a key across all languages, longest first.

    Longest-first keeps a prefix form from shadowing a longer one inside a
    regex alternation.
    """
    seen: list[str] = []
    for forms in registry[key].values():
        for form in forms:
            if form not in seen:
                seen.append(form)
    return sorted(seen, key=len, reverse=True)


def heading_text(key: str, language: str | None = None) -> str:
    """Canonical heading wording for a language, without the leading hashes."""
    lang = (language or DEFAULT_LANGUAGE).strip().lower()
    forms = SECTIONS[key]
    return (forms.get(lang) or forms[DEFAULT_LANGUAGE])[0]


def heading(key: str, level: int, language: str | None = None) -> str:
    """Canonical heading line, e.g. "### Vulnerable code"."""
    return f"{'#' * level} {heading_text(key, language)}"


def label_text(key: str, language: str | None = None) -> str:
    lang = (language or DEFAULT_LANGUAGE).strip().lower()
    forms = LABELS[key]
    return (forms.get(lang) or forms[DEFAULT_LANGUAGE])[0]


def heading_alternation(key: str) -> str:
    """Regex alternation matching the heading in any supported language."""
    return "|".join(re.escape(form) for form in _forms(SECTIONS, key))


def label_alternation(key: str) -> str:
    return "|".join(re.escape(form) for form in _forms(LABELS, key))


def heading_re(
    key: str,
    *,
    level: int | str = 2,
    exact: bool = True,
    flags: int = re.MULTILINE,
) -> re.Pattern[str]:
    """Match a section heading in any supported language.

    level may be an int or a regex quantifier fragment such as "{2,3}".
    exact=False matches headings that only start with the wording, so
    "### Local verification (harness)" still matches the local_verification key.
    """
    hashes = "#" * level if isinstance(level, int) else f"#{level}"
    tail = r"[ \t]*\r?$" if exact else ""
    return re.compile(rf"(?m)^{hashes}[ \t]*(?:{heading_alternation(key)}){tail}", flags)


def any_heading_re(level: int | str = 2) -> re.Pattern[str]:
    """Match any heading at a level, for "scan to the next section" logic."""
    hashes = "#" * level if isinstance(level, int) else f"#{level}"
    return re.compile(rf"(?m)^{hashes}\s+")

# (key, heading level) in the order templates/vuln-report.md lays them out.
# The output-language contract is rendered from this, so the headings the model
# is told to emit can never drift from the ones the parsers look for.
REPORT_OUTLINE: tuple[tuple[str, int], ...] = (
    ("summary", 2),
    ("description", 2),
    ("impact", 2),
    ("vendor", 2),
    ("affected_products", 2),
    ("asset_proof", 2),
    ("mapping_queries", 3),
    ("fofa", 4),
    ("x_intel", 4),
    ("technical_details", 2),
    ("source_sink", 3),
    ("vuln_code", 3),
    ("poc_description", 3),
    ("trigger_conditions", 3),
    ("same_root_cause", 2),
    ("reproduction", 2),
    ("environment_setup", 3),
    ("trigger_steps", 3),
    ("local_verification", 4),
    ("dynamic_verification", 4),
    ("expected_evidence", 3),
    ("reproduction_notes", 3),
    ("remediation", 2),
    ("notes", 2),
)


def outline_block(language: str | None = None) -> str:
    """The report outline as a markdown code block, for prompt injection."""
    lines = [heading(key, level, language) for key, level in REPORT_OUTLINE]
    return "\n".join(lines)
