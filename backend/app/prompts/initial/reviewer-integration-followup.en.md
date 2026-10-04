This project has local verification enabled. This finding was previously confirmed (`${prior_basis}`). Continue the review round above, adding **L3 integration verification** on top of ${prior_conclusion}; do not redo the static analysis from scratch, and do not build a Docker lab.

First Read `vulns/${vuln_id}/report.md`, request.http, poc.py, the existing harness script and `env/env.json`.

Requirements:
- The report must already have a `#### Local verification` section (L1/L2 evidence). Add integration verification on top of it.
- Call `ConfirmVuln(harness_depth=integration, integration_start=..., integration_setup=...)`.
  - **integration_start** (required unless the sandbox is unavailable and `env/env.json`'s `local_service_url` is written): the background start command, which must listen on `127.0.0.1:$PORT` (`$PORT` is injected by the system in the integration sandbox), for example `node bin/whistle.js start -p $PORT` or `npx w2 start -p $PORT`.
  - **integration_setup** (optional): install dependencies in the container, multi-line shell, such as `npm ci`.
- The system, inside the **integration sandbox** (not the harness sandbox): installs dependencies temporarily → starts the loopback service → runs `poc.py -u http://127.0.0.1:$PORT`. Do **not** leave a long-running service on the host or reuse the host's global node/python environment; use the `local_service_url` fallback only when the sandbox is unavailable.
- Integration verification passes → `evidence_level=dynamic`, `harness_depth=integration`; Write the report adding `#### Dynamic verification (integration)` and paste the PoC output.
- Integration verification fails → do not false-positive; keep the harness conclusion, state the failure cause, and retry after fixing integration_start/setup or the PoC.
- Do not copy the harness inline/mock into `poc.py`; do not write the same test into both the harness and the PoC.
- Do not MergeIntoVuln, do not return to the Worker.

Vulnerability ID=${vuln_id}
${lab_note}
Integration verification plan: ${debug_plan}
