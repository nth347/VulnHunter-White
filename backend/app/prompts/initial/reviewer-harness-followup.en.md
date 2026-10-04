This project has local verification enabled. This finding was previously confirmed (`${prior_basis}`). Continue the review round above, adding local verification on top of ${prior_conclusion}; do not redo the static analysis from scratch, and do not build a Docker lab.

First Read `vulns/${vuln_id}/report.md`, request.http, poc.py and the suspect functions in the source.

Requirements:
- Use `RunCode` to write a mock / harness in the target language for local dynamic verification. Do not send requests to target_url, do not run `poc.py -u`, and do not use the debug MCP. When the component's public entry point itself consumes HTTP / a request object, add in-process request-level reinforcement against the `src/` public API (httptest or an in-process client); copying only the internal sink is forbidden; do not wrap request-less APIs such as YAML/codecs in HTTP. The harness output must be bilingual: English by default, with a required `--zh` flag to switch the labels/steps/verdicts to Chinese; comments stay in English. stdout must print real runtime data (return value/query result/echo/rendered result); printing only a fixed SUCCESS/CONFIRMED is forbidden, and hard-coding `success=True` / `{"success": true}` is forbidden. Java harnesses default to JDK 8 (no `var`/record/text block or other 9+ syntax); only when the target source needs a higher version, write `// java-release: 11` or `// java-release: 17` at the top of the file.
- It runs and the finding still holds up → first Write the report to complete `### Vulnerable code` (the **full file path** + the source in a fenced code block), then ConfirmVuln(`evidence_level=harness`), passing `harness_code` when needed. A missing path or code block is rejected by the system. The value tier keeps the existing conclusion by default; only change `submission_tier` if the evidence clearly changes the impact.
- The sandbox is unavailable or the mock fails → do not false-positive; if static analysis still proves the default deployment is exploitable, ConfirmVuln(`evidence_level=static_only`).
- Local verification proving default exploitability does not hold (does not land, needs a planted file) → MarkFalsePositive(reason=...). Do not return to the Worker for this.
- Do not MergeIntoVuln, and do not return to the Worker to "redo the static analysis".
- Do not CollectLabFingerprints. Do not write the harness's inline/mock or the same TEST matrix into `poc.py`. For a pure library finding with no HTTP/install surface, do not add a fake `-u/--proxy` for compatibility.

Vulnerability ID=${vuln_id}
${lab_note}
Local verification plan: ${debug_plan}
