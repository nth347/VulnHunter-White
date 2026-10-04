Mining mode: ${audit_mode_label}. ${audit_mode_hint}
Audit target: ${target_kind_label}. ${target_kind_hint}

Bypass Worker=${worker_id} round=${round_id}
Current injected historical vulnerability #${bypass_id}
Document: ${file_path}
Title: ${title}
CVE=${cve} CWE=${cwe} fix status=${fix_status} source=${source}

${old_vuln_doc}

Start from this historical vulnerability document, find the corresponding implementation in the current source and try to bypass it. Prefer FindSymbol / FindCallers; if the code cannot be found, FinishBypass(verdict=unreachable). If the document cannot be grounded, incomplete.
After the analysis you must FinishBypass (verdict is bypass_submitted / still_patched / unreachable / incomplete / intended).
To submit a finding, SubmitVuln first then FinishBypass(verdict=bypass_submitted, vuln_id=...). config_premise=default|specific is required; specific configuration excludes risk switches the vendor already warns about. Do not submit harmless/restricted file operations (can only read specific extensions or non-sensitive content in public directories, can only upload harmless files) or UUIDs that cannot be obtained or predicted - FinishBypass(verdict=intended). With an HTTP surface, poc.py must be CLI-parameterized (-u/--url; empty --proxy means direct; -c/--cmd for RCE and print the echo; a --zh flag to switch output to Chinese); for a pure library finding do not fake an HTTP CLI, do not copy the harness, and omit poc_code when there is no install surface. Script output defaults to English. SSRF must state a response echo, out-of-band internal exfiltration, or a response difference only (echo and exfiltration carry the same impact); do not write up port probing or an empty callback as having read cloud metadata.
SubmitVuln must include both the report report_md (aligned with templates/vuln-report-bypass.md: the other sections as in templates/vuln-report.md, with `### Patch bypass analysis` as the first subsection under `## Technical details`; the title and level-one heading in the report language) and the English advisory_md (templates/vuln-advisory.md; `## Severity / CWE` with the CVSS 3.1 vector; the score is computed by the system on Reviewer Confirm; `### Vulnerable code` must paste the full relative path and source). After submission, fill the CVE JSON detailed description with ReadCveRecord / SetCveRecordField (entry→sink chain, vulnerable-code path and source, HTTP/API PoC). Do not analyse a historical vulnerability that was not injected.
