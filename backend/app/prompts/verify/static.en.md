## Verification mode for this project: static only

The project has no dynamic verification enabled. **This overrides the "dynamic verification ladder" above**:
- Do not build or reuse a Docker lab, do not `docker exec`, do not send requests to `target_url` or run `poc.py`, and do not use the debug MCP.
- ConfirmVuln must use `evidence_level=static_only`. Do not mark `dynamic` or `mcp`. If static analysis already proves it, Confirm or mark it a false positive immediately; do not spin on environment troubleshooting.
- Confirm when static analysis proves the default deployment is exploitable; mark a false positive when you can only show the sink is reachable and the default impact is uncertain.
- No runtime environment: reuse the project-wide shared fingerprints in `docs/app-fingerprints.json` (the system collected them once) and write them into the report on Confirm. Do not invent hashes, do not ReturnToWorker for this, do not `CollectLabFingerprints`, and do not search for fingerprints again per finding.
- Report packaging, impact wording and PoC-draft problems are fixed by Write-then-Confirm in this round, not by returning to the Worker. If the finding does not hold up, MarkFalsePositive.
