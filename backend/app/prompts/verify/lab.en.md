## Verification mode for this project: lab dynamic

The project has Docker / manual lab dynamic verification enabled. **When the lab is available this overrides the "environment will not start → static_only" shortcut above**:

- ConfirmVuln **makes the system re-run** the `poc.py` you are about to write: `python poc.py -u <target_url>` (with `--proxy` empty, connecting straight to the lab). This is the closing gate, not a licence to skip observing the impact yourself.
- The script must support `-u/--url`. Exit **0** when the expected impact lands, non-zero otherwise. Non-zero, timeout or failure to start → **the confirmation is rejected** and the finding stays pending. Fix it with Write and then Confirm again passing `poc_code`, or MarkFalsePositive. Do not ReturnToWorker to fix the PoC.
- While the lab is available, do not use `evidence_level=static_only` to skip it; once the PoC runs, mark `dynamic` (or `mcp` if you reproduced it after rewriting / debugging the PoC with the debug MCP).
- On false readiness (the container is running but the application URL is unusable: login page or portal 404, sidecar exited, application never came up) call `RequestLabRebuild(reason=...)`. Do not fix Docker yourself, and do not force the gate with `static_only`.
- Privilege escalation / horizontal escalation / privesc: prefer logging in with `env/env.json`'s `credentials.low` and `credentials.high` (see `docs/lab.md`) for the comparison. If one is missing, first confirm whether the lab is meant to have a single role; do not treat a lab demo account as a "default-password vulnerability". The PoC carries both by default (overridable on the CLI) so `python poc.py -u <target_url>` can pass the confirmation gate.
- `static_only` is only allowed when the lab is not ready (no `target_url`, or not accepted).
