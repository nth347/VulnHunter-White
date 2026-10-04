"""Backend message catalog.

User-facing backend text is written per key in every supported language and
resolved against the project's (or request's) language. The frontend keeps a
mapping of known Chinese strings in src/i18n/backendText.ts for messages that
have not been migrated yet; anything resolved here no longer needs that shim.

Keys are grouped by the area that raises them. Add the Chinese wording exactly
as it appeared at the call site: translate_source() builds a reverse index from
it so an un-migrated call site still gets translated on the way out.
"""

from __future__ import annotations

from .prompts import normalize_language

# key -> language -> message
CATALOG: dict[str, dict[str, str]] = {
    # --- auth / access ---
    "auth.token_invalid": {"zh": "访问令牌无效", "en": "Invalid access token"},
    "auth.token_wrong": {"zh": "当前令牌不正确", "en": "Current token is incorrect"},
    # --- projects ---
    "project.not_found": {"zh": "项目不存在", "en": "Project not found"},
    "project.no_fields": {"zh": "没有需要更新的字段", "en": "No fields to update"},
    "project.upload_zip_endpoint": {
        "zh": "请使用 /api/projects/upload 上传 zip",
        "en": "Use /api/projects/upload to upload a zip",
    },
    "project.missing_source_url": {"zh": "缺少 source_url", "en": "Missing source_url"},
    "project.missing_github_url": {"zh": "缺少 GitHub URL", "en": "Missing GitHub URL"},
    "project.missing_zip_path": {"zh": "缺少 zip 路径", "en": "Missing zip path"},
    "project.done_cannot_pause": {
        "zh": "已完成项目不可暂停",
        "en": "A finished project cannot be paused",
    },
    "project.report_not_found": {"zh": "报告不存在", "en": "Report not found"},
    "project.custom_mode_id_int": {
        "zh": "custom_audit_mode_id 必须是整数",
        "en": "custom_audit_mode_id must be an integer",
    },
    "project.target_kind_locked": {
        "zh": "审计对象仅在项目暂停或完成后可更改",
        "en": "The audit target can only be changed while the project is paused or finished",
    },
    "project.mining_paths_locked": {
        "zh": "挖掘路径仅在项目暂停或完成后可更改",
        "en": "Mining paths can only be changed while the project is paused or finished",
    },
    "project.audit_mode_locked": {
        "zh": "挖掘模式仅在项目暂停或完成后可更改",
        "en": "The mining mode can only be changed while the project is paused or finished",
    },
    "project.code_intel_locked": {
        "zh": "代码库仅在项目暂停或完成后可更改",
        "en": "Code intelligence can only be changed while the project is paused or finished",
    },
    "project.pause_all_before_reset": {
        "zh": "请先全部暂停项目，再重置挖掘进度",
        "en": "Pause the whole project before resetting mining progress",
    },
    # --- vulnerabilities ---
    "vuln.not_found": {"zh": "漏洞不存在", "en": "Vulnerability not found"},
    "vuln.candidate_not_found": {"zh": "候选不存在", "en": "Candidate not found"},
    "vuln.created_date_format": {
        "zh": "created_date 须为 YYYY-MM-DD",
        "en": "created_date must be YYYY-MM-DD",
    },
    "vuln.created_date_invalid": {
        "zh": "created_date 不是合法日期",
        "en": "created_date is not a valid date",
    },
    "vuln.month_range": {"zh": "month 须为 1–12", "en": "month must be 1-12"},
    "vuln.year_range": {"zh": "year 超出范围", "en": "year is out of range"},
    "vuln.kind_allowed": {
        "zh": "kind 须为 report|advisory|cve",
        "en": "kind must be report|advisory|cve",
    },
    "vuln.tracking_status_allowed": {
        "zh": "tracking_status 须为 none|submitted|ignored",
        "en": "tracking_status must be none|submitted|ignored",
    },
    "vuln.attack_surface_allowed": {
        "zh": "attack_surface 须为 frontend|backend",
        "en": "attack_surface must be frontend|backend",
    },
    "vuln.markdown_only": {
        "zh": "仅支持 markdown 报告",
        "en": "Only markdown reports are supported",
    },
    "vuln.cve_json_object": {
        "zh": "CVE JSON 须为对象",
        "en": "CVE JSON must be an object",
    },
    "vuln.revision_empty": {"zh": "修订内容不能为空", "en": "Revision content cannot be empty"},
    "vuln.instruction_empty": {
        "zh": "修改指令不能为空",
        "en": "The revision instruction cannot be empty",
    },
    "vuln.followup_empty": {"zh": "追问内容不能为空", "en": "The follow-up cannot be empty"},
    # --- submission gating ---
    "submit.missing_tier": {"zh": "缺少 submission_tier", "en": "Missing submission_tier"},
    "submit.missing_reason": {
        "zh": "缺少 submission_reason（须说明为何进入该提交分层）",
        "en": "Missing submission_reason (explain why this submission tier applies)",
    },
    "submit.reason_language": {
        "zh": "submission_reason 须用中文说明分层理由（产品名/类名/CVE 编号可保留英文）",
        "en": (
            "submission_reason must explain the tier in English (product names, "
            "class names and CVE ids may stay verbatim)"
        ),
    },
    "submit.duplicate_needs_root_cause": {
        "zh": "submission_tier=duplicate_grouped 时必须提供 root_cause_key",
        "en": "root_cause_key is required when submission_tier=duplicate_grouped",
    },
    "submit.rce_effect_bool": {
        "zh": "rce_effect 须为 true 或 false",
        "en": "rce_effect must be true or false",
    },
    # --- dynamic verification ---
    "verify.enable_first": {
        "zh": "请先在项目设置中开启靶场动态或局部验证",
        "en": "Enable lab dynamic or local verification in the project settings first",
    },
    "verify.project_state": {
        "zh": "当前项目状态不可追加动态验证",
        "en": "The project state does not allow adding dynamic verification",
    },
    "verify.already_running": {
        "zh": "该漏洞已在追加验证中",
        "en": "This vulnerability is already undergoing additional verification",
    },
    "verify.integration_done": {
        "zh": "该漏洞已完成集成验证",
        "en": "This vulnerability has already completed integration verification",
    },
    "verify.merged_elsewhere": {
        "zh": "该漏洞已并入其他报告",
        "en": "This vulnerability has been merged into another report",
    },
    "verify.local_done": {
        "zh": "该漏洞已局部验证；若有 poc.py 可追加集成验证，或切换靶场动态后再追加",
        "en": (
            "This vulnerability is already locally verified; add integration "
            "verification if poc.py exists, or switch to lab dynamic first"
        ),
    },
    "verify.lab_requires_static_or_local": {
        "zh": "仅 static_only 或局部验证确认的漏洞可追加靶场动态验证",
        "en": (
            "Only static_only or locally verified vulnerabilities can add lab "
            "dynamic verification"
        ),
    },
    "verify.local_requires_static": {
        "zh": "仅 static_only 的漏洞可追加局部验证",
        "en": "Only static_only vulnerabilities can add local verification",
    },
    "verify.lab_mode_only_new": {
        "zh": "仅靶场动态验证模式可新开环境搭建",
        "en": "Only lab dynamic verification mode can start a new environment setup",
    },
    "verify.lab_mode_only_resume": {
        "zh": "仅靶场动态验证模式可续跑环境搭建",
        "en": "Only lab dynamic verification mode can resume environment setup",
    },
    "verify.lab_not_enabled": {
        "zh": "当前项目未开启靶场动态验证",
        "en": "Lab dynamic verification is not enabled for this project",
    },
    "verify.env_in_progress": {"zh": "环境搭建正在进行中", "en": "Environment setup is in progress"},
    "verify.env_in_progress_steer": {
        "zh": "环境搭建正在进行中，请使用引导",
        "en": "Environment setup is in progress; use steering instead",
    },
    "verify.env_no_resume": {
        "zh": "环境搭建尚未结束或靶场已就绪，无需续跑",
        "en": "Environment setup has not finished or the lab is ready; no resume needed",
    },
    "verify.env_state": {
        "zh": "当前项目状态不可续跑环境搭建",
        "en": "The project state does not allow resuming environment setup",
    },
    # --- phases / conversation ---
    "phase.unknown": {"zh": "未知阶段", "en": "Unknown phase"},
    "phase.unknown_sub": {"zh": "未知子阶段", "en": "Unknown sub-phase"},
    "phase.already_running": {"zh": "该小阶段正在运行中", "en": "This sub-phase is already running"},
    "phase.not_running": {
        "zh": "当前小阶段未在运行，请使用接续或新开",
        "en": "This sub-phase is not running; resume it or start a new one",
    },
    "phase.create_run_failed": {"zh": "无法创建 phase_run", "en": "Could not create phase_run"},
    "conversation.no_resumable": {
        "zh": "没有可接续的对话",
        "en": "There is no conversation to resume",
    },
    "conversation.action_allowed": {
        "zh": "action 须为 steer、continue 或 new",
        "en": "action must be steer, continue or new",
    },
    "conversation.project_state": {
        "zh": "当前项目状态不可操作对话",
        "en": "The project state does not allow conversation actions",
    },
    "conversation.message_text": {
        "zh": "消息必须是文本，不能包含空字节",
        "en": "The message must be text and cannot contain null bytes",
    },
    "conversation.resume_note_text": {
        "zh": "续跑说明必须是文本，不能包含空字节",
        "en": "The resume note must be text and cannot contain null bytes",
    },
    "conversation.steer_empty": {"zh": "引导内容不能为空", "en": "Steering content cannot be empty"},
    # --- recon re-runs ---
    "recon.rerun_kind": {
        "zh": "仅支持重跑 map（地图/鉴权）或 old_vulns（历史漏洞）",
        "en": "Only map (code map / auth) or old_vulns (historical vulnerabilities) can be re-run",
    },
    "recon.sub_already_rerunning": {
        "zh": "已有侦察子阶段正在重跑",
        "en": "A recon sub-phase is already being re-run",
    },
    "recon.rerun_state": {
        "zh": "当前项目状态不可重跑侦察子阶段",
        "en": "The project state does not allow re-running a recon sub-phase",
    },
    "recon.map_incomplete_new": {
        "zh": "地图/鉴权尚未完成，完成后才能新开更新",
        "en": "The code map / auth docs are unfinished; start an update only after they complete",
    },
    "recon.map_incomplete_rerun": {
        "zh": "地图/鉴权尚未完成，完成后才能重跑更新",
        "en": "The code map / auth docs are unfinished; re-run an update only after they complete",
    },
    "recon.old_vulns_incomplete_new": {
        "zh": "历史漏洞尚未完成，完成后才能新开更新",
        "en": "Historical vulnerability collection is unfinished; start an update only after it completes",
    },
    "recon.old_vulns_incomplete_rerun": {
        "zh": "历史漏洞尚未完成，完成后才能重跑更新",
        "en": "Historical vulnerability collection is unfinished; re-run an update only after it completes",
    },
    # --- code intelligence ---
    "code_intel.not_enabled": {
        "zh": "未开启代码库。请先在项目配置中开启（需暂停或完成）",
        "en": (
            "Code intelligence is off. Enable it in the project configuration "
            "(the project must be paused or finished)"
        ),
    },
    "code_intel.no_agent_session": {
        "zh": "代码库构建无 Agent 会话，请使用重建按钮",
        "en": "The code intelligence build has no agent session; use the rebuild button",
    },
    "code_intel.rebuild_state": {
        "zh": "当前项目状态不可重建代码库",
        "en": "The project state does not allow rebuilding code intelligence",
    },
    "code_intel.build_running": {
        "zh": "上一轮构建尚未退出，请稍后重试",
        "en": "The previous build has not exited yet; retry shortly",
    },
    "code_intel.codegraph_version": {
        "zh": "无法解析 CodeGraph 最新版本",
        "en": "Could not resolve the latest CodeGraph version",
    },
    # --- custom audit modes ---
    "custom_mode.not_found": {
        "zh": "自定义审计模式不存在",
        "en": "Custom audit mode not found",
    },
    "custom_mode.not_found_create": {
        "zh": "自定义审计模式不存在，请先在设置页创建",
        "en": "Custom audit mode not found; create it on the settings page first",
    },
    "custom_mode.name_empty": {
        "zh": "自定义审计模式名称不能为空",
        "en": "The custom audit mode name cannot be empty",
    },
    "custom_mode.body_empty": {
        "zh": "自定义审计模式正文不能为空",
        "en": "The custom audit mode body cannot be empty",
    },
    "custom_mode.id_required": {
        "zh": "自定义模式须指定 custom_audit_mode_id",
        "en": "custom_audit_mode_id is required for custom mode",
    },
    # --- LLM settings ---
    "llm.provider_id_empty": {"zh": "Provider id 不能为空", "en": "Provider id cannot be empty"},
    "llm.base_url_scheme": {
        "zh": "Base URL 只允许 http 或 https",
        "en": "Base URL must use http or https",
    },
    "llm.base_url_no_host": {"zh": "Base URL 缺少主机名", "en": "Base URL is missing a hostname"},
    "llm.base_url_bad_host": {"zh": "Base URL 主机名无效", "en": "Base URL hostname is invalid"},
    "llm.base_url_no_credentials": {
        "zh": "Base URL 不能包含用户名或密码",
        "en": "Base URL must not contain a username or password",
    },
    "llm.base_url_no_metadata": {
        "zh": "Base URL 不能指向云元数据地址",
        "en": "Base URL must not point at a cloud metadata address",
    },
    "llm.keep_one_endpoint": {
        "zh": "至少保留一个 Base URL 端点",
        "en": "Keep at least one Base URL endpoint",
    },
    # --- token budget ---
    "token.max_usage_non_negative": {
        "zh": "max_token_usage 不能为负数",
        "en": "max_token_usage cannot be negative",
    },
    "token.max_usage_int": {
        "zh": "max_token_usage 必须是非负整数，0 表示不限制",
        "en": "max_token_usage must be a non-negative integer; 0 means unlimited",
    },
    "token.days_non_negative": {"zh": "天数须 >= 0", "en": "days must be >= 0"},
    # --- paths / sandbox ---
    "path.no_parent_refs": {
        "zh": "路径不允许包含 ..",
        "en": "Paths must not contain ..",
    },
    "path.out_of_bounds": {"zh": "路径越界", "en": "Path is out of bounds"},
    "path.illegal": {"zh": "非法路径", "en": "Illegal path"},
    "path.class_jar_war": {
        "zh": "请指定具体 .class/.jar/.war 路径",
        "en": "Specify a concrete .class/.jar/.war path",
    },
    # --- misc runtime ---
    "runtime.no_free_port": {"zh": "无可用端口", "en": "No free port available"},
}

_SOURCE_INDEX: dict[str, str] = {}
for _key, _forms in CATALOG.items():
    _zh = _forms.get("zh")
    if _zh and _zh not in _SOURCE_INDEX:
        _SOURCE_INDEX[_zh] = _key


def tr(key: str, language: str | None = None, **fmt: object) -> str:
    """Resolve a catalog key for a language, falling back to English then the key."""
    lang = normalize_language(language)
    forms = CATALOG.get(key)
    if not forms:
        return key
    text = forms.get(lang) or forms.get("en") or next(iter(forms.values()))
    return text.format(**fmt) if fmt else text


def translate_source(text: str, language: str | None = None) -> str:
    """Translate a message that is still written inline in Chinese.

    Safety net for call sites not yet migrated to tr(): an exact Chinese string
    in the catalog is swapped for the requested language, anything else is
    returned unchanged.
    """
    key = _SOURCE_INDEX.get((text or "").strip())
    if not key:
        return text
    return tr(key, language)


def project_language(project_id: int | None) -> str:
    """Prompt/message language for a project, defaulting when it has none."""
    if not project_id:
        return normalize_language(None)
    from .models import Project, SessionLocal  # local import: avoids an import cycle

    try:
        with SessionLocal() as db:
            proj = db.get(Project, int(project_id))
            return normalize_language(getattr(proj, "language", None) if proj else None)
    except Exception:  # noqa: BLE001 - language must never break the caller
        return normalize_language(None)
