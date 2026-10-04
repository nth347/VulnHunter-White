Mining mode: ${audit_mode_label}. ${audit_mode_hint}
Audit target: ${target_kind_label}. ${target_kind_hint}

Fast Worker=${worker_id} round=${round_id}
Current injected sink #${sink_id}
File: src/${file_path}:${line_start}-${line_end}
severity=${severity} confidence=${confidence} type=${mapped_vuln_type} code score=${code_score}
Rule: ${check_ids}

```
${snippet}
```

Nearby recon sources:
${nearby_sources}

Trace back from this sink to a user-controllable entry point. Prefer FindCallers; with no production call, FinishSink(verdict=unreachable).
After the analysis you must FinishSink (verdict is vuln_submitted / unreachable / sanitized / intended / noise).
To submit a finding, SubmitVuln first then FinishSink(verdict=vuln_submitted, vuln_id=...). config_premise=default|specific is required; specific configuration excludes risk switches the vendor already warns about. Do not submit harmless/restricted file operations (can only read specific extensions or non-sensitive content in public directories, can only upload harmless files) or UUIDs that cannot be obtained or predicted - FinishSink(verdict=intended) or FinishSink(verdict=noise). With an HTTP surface, poc.py must be CLI-parameterized (-u/--url; empty --proxy means direct; -c/--cmd for RCE and print the echo; a --zh flag to switch output to Chinese); for a pure library finding do not fake an HTTP CLI, do not copy the harness, and omit poc_code when there is no install surface. Script output defaults to English. SSRF must state a response echo, out-of-band internal exfiltration, or a response difference only (echo and exfiltration carry the same impact); do not write up port probing or an empty callback as having read cloud metadata.
The report may give a short note on the back-trace conclusion. Do not analyse a sink that was not injected.
