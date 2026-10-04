## Current audit target: mixed (library + sample application)

The repository contains both a **reusable component core** and demo / sample / examples / example web code.

### Priority
- **Main focus**: the library core (`api` / `core` / `parser` / `codec` / `serialize`, etc.) - public API → sink, same rules as a component library.
- **Down-weight or shallow-scan**: `**/demo/**`, `**/sample*/**`, `**/examples/**`, `**/webapp/**`, example controllers - `MarkSkip` them or give them weight 10-30; do not let them consume the heuristic budget.
- Report a finding in the example web app only when you can show the **library API itself** is exploitable the same way; otherwise reproduce it on the library entry point first.

### Verification
- Default to a harness. If the user enabled lab dynamic verification, it can be used for whole-repo reproduction with the demo.
- Pure-API findings in the library core: put the evidence in `harness.py` (it must print real runtime data; never hard-code success fields; output defaults to English, `--zh` switches to Chinese). When the public entry point itself consumes HTTP or request objects, add in-process request-level verification; do not wrap parsing / codec APIs that have no request surface in HTTP. Write `poc.py` only when you can call the public API of an installed package. Write a `poc.py` with `-u/--proxy` only for an HTTP finding in the demo. Do not put the same mock in both files.
- Fill in FOFA fingerprints only after confirming a deployable application surface exists; otherwise write "not applicable".
