This project has dynamic verification enabled. This finding was previously confirmed (`${prior_basis}`). Continue the review round above, adding dynamic verification on top of ${prior_conclusion}; do not redo the static analysis from scratch.

First Read `vulns/${vuln_id}/report.md`, request.http, poc.py and `env/env.json`, `docs/lab.md`.

Requirements:
- Do not build a Docker lab (the environment round runs separately, see docs/lab.md).
- Follow the dynamic-verification ladder: **run the current poc.py first** (`python poc.py -u <target_url>`, add `-c/--cmd` for RCE, add `--proxy` when you need to capture) or send a request to target_url, and **observe** the impact with docker exec/logs/files. If poc.py hard-codes the address/command/proxy or lacks `--proxy` → make it CLI-parameterized first (Write + pass poc_code on ConfirmVuln). You fix same-chain payloads that will not run; do not return to the Worker. **The debug MCP is not the first choice**: attach it only when the PoC is missing, will not run, or reproduction fails and you need to rewrite/debug the PoC (runtime is java/nodejs/python and the debug port is available).
- ConfirmVuln re-runs the on-disk `poc.py -u <target_url>`; a non-zero exit rejects the confirmation. While the lab is available, do not use `static_only` or close out with `harness` (this round's goal is lab dynamic evidence).
- Dynamic reproduction succeeds → ConfirmVuln(`evidence_level=dynamic` or `mcp`). The value tier keeps the existing conclusion by default; only change `submission_tier` if the dynamic evidence clearly changes the impact.
- The environment will not start (no target_url): if it was previously `static_only` and static analysis still proves the default deployment is exploitable → ConfirmVuln(`evidence_level=static_only`), do not false-positive; if it was already harness, ConfirmVuln(`evidence_level=harness`) keeping the conclusion, do not downgrade to `static_only`.
- Dynamic proof that default exploitability does not hold (needs a planted file, a swapped sink) → MarkFalsePositive(reason=...). For a same-chain payload detail, fix it and re-run; do not false-positive and do not return.
- Do not MergeIntoVuln, and do not return to the Worker to "redo the static analysis" or fix the PoC.
- Only CollectLabFingerprints when there is a vulnerability environment and the project fingerprint still lacks a title/hash.

Vulnerability ID=${vuln_id}
${lab_note}
Dynamic verification plan: ${debug_plan}
