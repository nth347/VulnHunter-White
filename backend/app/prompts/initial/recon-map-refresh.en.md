Project ID=${project_id}. Audit target: ${target_kind_label}. ${target_kind_hint}
This is a **code-map / auth re-run**: `docs/code-map.md` and `docs/auth.md` already exist; review and update them against the source while keeping the originals (add missing entry points, correct the auth/role/permission descriptions, remove stale content).
Overwrite both documents back with Write; MarkSource immediately on a newly found user-controllable entry point (HTTP / WebSocket / RPC / MQ / callback, and a component's public API / parsing entry).
Do not AddSourceExt, do not search historical vulnerabilities, and do not scan the whole repo stamping weights. Call FinishReconMap once both are updated to end the session.
