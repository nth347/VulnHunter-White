## Current audit target: component library

This project is a **library or SDK (Maven / pip / npm, etc.)**, not an independently deployable web application.

### Threat model
- The attacker is the **calling application** (or the untrusted data it passes in), not a remote HTTP visitor.
- Entry points = **public APIs, SPIs, plugin points, config / codec / parser code, deserialization entry points**. Use `MarkSource` on caller-controlled parameter entry points; do not wait around for an HTTP controller.
- Draw the **trust boundary** clearly: it is only a vulnerability if untrusted input can reach a dangerous sink under the default configuration or the documented recommended usage. Be cautious about reporting anything that is only visible to internal packages, or where the documentation already mandates a sanitizer.

### Mining focus
- High weight: public API / parser / codec / serialize / path and URL normalization / reflection and dynamic loading.
- Prioritize: deserialization, XXE, path traversal, expression injection, command execution, arbitrary file access, SSRF-style URL fetch, insecure default configuration.
- De-prioritize: reflected XSS, CSRF, pure business IDOR (unless the library itself provides the authorization primitive and it can be bypassed).

### Submission and verification
- `http_request` may hold an **API call recipe** (class / method / parameters / dependency version) instead of an HTTP message; FOFA/X fingerprints may be "not applicable".
- Local verification by depth: **sink** (default function / mock) → `harness`; **module** (cross-module chain) → `harness`; **integration** (a service can be started and the full chain goes through an HTTP management surface, with a `poc.py`) → run the PoC in the system integration sandbox; on success → **`dynamic`**. When a public API consumes a request object, use httptest in-process (module/sink); do not wrap an API with no request surface in HTTP. Do not give `poc.py` an unused `-u/--proxy`, and do not copy the harness test into it.
- When there is an HTTP exploitation surface, still write a CLI `poc.py` (`-u/--proxy`).
- Do not invent site FOFA queries for a pure library. In the reproduction steps, state the affected API and the required dependency versions.
