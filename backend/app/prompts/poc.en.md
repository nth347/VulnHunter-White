# PoC script (re-testable against any target)

`poc_code` / `vulns/{id}/poc.py` must be a standalone Python 3 script so a human, the Reviewer and the Verifier can re-test against a different target. Do not write a one-off fragment that only hits this lab.

## Boundary with harness.py

The two scripts must not do the same job.

| File | Responsibility | When to write |
| --- | --- | --- |
| `poc.py` | Re-test against the **real runtime surface**: a web / HTTP surface hits any origin; for a pure library finding, `import` the installed package and call its public API | There is an HTTP exploitation surface, or the finding reproduces after installing the real package |
| `harness.py` | Local-verification sandbox evidence: extracted function + mock by default; when the public entry point itself consumes HTTP / a request object, switch to in-process request-level reinforcement. Written to disk by `RunCode`. stdout must print real runtime data, never a hard-coded success field | Local verification mode only |

- It is **forbidden** to copy the harness's inlined source, mocks or TEST matrix into `poc.py`.
- It is **forbidden** to add an unused `-u/--url` / `--proxy` to a pure library finding "just for CLI compatibility".
- **The harness output must come from runtime**: `harness.py` must print the actual return value, query result, command echo or rendered result after calling the extracted function/sink. Do not print only a fixed `SUCCESS` / `VULNERABILITY CONFIRMED`, do not hard-code `success=True` or `{"success": true}`, and do not write the expected echo as a literal. Verdict labels are allowed, but the actual data must be printed too.
- When there is no HTTP surface and the installed package cannot be reproduced against: **do not write `poc.py` to disk**; put an API call recipe in `http_request` and the report. SubmitVuln may omit `poc_code` in that case.

## Required (when there is an HTTP exploitation surface)
The clauses below apply to web findings and to a `poc.py` in a component library / mixed repository that **does have an HTTP exploitation surface**. For pure library findings with no HTTP surface, see "Boundary" at the top and "Component library" at the bottom - do not apply `-u/--url`.

1. **The target is always passed on the CLI**: use `argparse`, with a required `-u/--url` (the site origin, such as `http://1.2.3.4:8080`). Do not hard-code `127.0.0.1`, a lab port or a particular FOFA host.
2. **The HTTP proxy is always passed on the CLI**: every `poc.py` must offer `--proxy` (optional, default empty string = direct), such as `http://127.0.0.1:8080`. Every HTTP/HTTPS request sent to the target must go through it (`ProxyHandler` for `urllib`, `proxies=` for `requests`/`httpx`). Do not hard-code a proxy address, and do not declare the argument without wiring it into the client.
   - **With `--proxy` set, requests to `127.0.0.1` / `localhost` / `::1` must also be forced through the proxy.** Python and Windows bypass the proxy for local addresses by default (`proxy_bypass` / `NO_PROXY` / "do not use proxy for local addresses"), so `ProxyHandler` or `proxies=` alone is not enough. Override `urllib.request.proxy_bypass` (and the registry/environment variants) to never bypass; with `requests`, also set `requests.utils.should_bypass_proxies` to always `False` and `session.trust_env=False`; with `httpx`, use an explicit `proxy=` and `trust_env=False`.
3. **HTTPS tolerates a certificate mismatch / self-signed certificate by default**: FOFA re-tests, HTTPS over an IP, or a lab's self-signed certificate make Python's default verification raise `SSLCertVerificationError` and abort. All HTTPS requests must **skip certificate verification by default** (`urllib` attaches an `SSLContext` with `check_hostname=False` / `verify_mode=CERT_NONE` to `HTTPSHandler`; `requests`/`httpx` default to `verify=False`), and **print one warning** when `-u` is `https://` and `--strict-ssl` was not passed, for example: `[!] Warning: HTTPS target skips TLS certificate verification by default (common for IP access or self-signed certs); pass --strict-ssl for strict verification`. An optional `--strict-ssl` restores the system default verification; HTTP targets are unaffected.
4. **The vulnerability parameters are customizable**: make every attacker-controllable value an optional CLI argument with a safe default, so that `python poc.py -u <target_url>` with no other argument still produces representative evidence.
   - RCE / command injection: `-c/--cmd` (default such as `id`). **With an echo, print the command output verbatim to stdout** (prefix with `Command output:`); with no echo, print the basis for the verdict (latency, status code, out-of-band DNS).
   - Arbitrary file read / path traversal: `-f/--file` (default a sensitive path).
   - SSRF: `--ssrf-url` (default an internal probe address). **With an echo, print the target response body** (prefix `SSRF echo:`); **with out-of-band exfiltration, print the content retrieved from the attacker channel** (prefix `SSRF exfil:`, and it must contain target-side information, not just "callback received"); with a response difference only, print the reachable/unreachable comparison (status code, latency or error for an open/closed port or a live/dead address), and do not treat a reflected URL as an echo.
   - SQLi / SSTI: `--payload` (default probe statement).
   - Privilege escalation / horizontal escalation: also provide victim or high-privilege account CLI args (such as `--victim-user` / `--victim-password`, or `--admin-user` / `--admin-password`). Default them from the lab `env.json` `credentials.low` (attacker) and `credentials.high` (comparison/victim admin), so `python poc.py -u <target_url>` with no account still works against the lab; override with the CLI when switching targets, and do not hard-code a particular FOFA host's credentials.
   - Requires login: `--cookie` / `--token`, or `-U/--user` `-P/--password`.
   - Other entry points (path, id, filename, etc.) likewise become CLI arguments; do not hard-code this sample.
5. **Print the result**: print the HTTP status, key response headers, and the response body (truncate if long and say so). For RCE with an echo, print the command output separately. Exit 0 when the expected impact lands, non-zero otherwise. Under lab dynamic, ConfirmVuln re-runs the on-disk script, and a non-zero exit rejects the confirmation.
6. **Bilingual output (`--zh`)**: the stdout/stderr labels, statuses, warnings and success/failure verdicts that the author of `poc.py` / `harness.py` (and `harness.*`, attack-chain scripts) prints must be prepared in both English and Chinese. **English by default**; `--zh` switches to Chinese. Python uses a `(en, zh)` **tuple** table + `msg(key, zh)`. **JavaScript must use an array `[en, zh]`**: parentheses `(en, zh)` are the comma operator and keep only the Chinese string, so `const [en, zh_s] = MSGS[key]` then destructuring by character prints single characters. PHP / Ruby use arrays, Go uses `[2]string{en, zh}`; do not paste Python tuple syntax verbatim. Scan argv / `process.argv` / `os.Args` for `--zh`. Do not hard-code Chinese only, and do not mix the two by default. Comments, docstrings and `argparse` `--help` stay in English. Print the target's echo (HTTP body, command output, file content, exception text) verbatim - do not translate it.
7. Do not write a notebook fragment, pseudocode, or anything that depends on files outside the current working directory.

A JavaScript harness / `harness.js` table must use an **array**, not the Python tuple above:

```javascript
const MSGS = {
  step: ["Step:", "步骤:"],
  result: ["Result:", "结果:"],
};
const zh = process.argv.includes("--zh");
function msg(key) {
  const pair = MSGS[key];
  return zh ? pair[1] : pair[0];
}
console.log(msg("step"), actualRuntimeValue);
```

node harness.js --zh

## Recommended skeleton

```python
#!/usr/bin/env python3
import argparse
import os
import ssl
import urllib.request

MSGS = {
    "ssl_warn": (
        "[!] Warning: HTTPS target skips TLS certificate verification by default "
        "(common for IP access or self-signed certs); pass --strict-ssl for strict verification",
        "[!] 警告：HTTPS 目标默认跳过 TLS 证书校验（常见于 IP 访问或自签证书）；传入 --strict-ssl 可恢复严格校验",
    ),
    "status": ("Status:", "状态:"),
    "response": ("Response:", "响应:"),
    "cmd_out": ("Command output:", "命令输出:"),
    "ssrf_echo": ("SSRF echo:", "SSRF 回显:"),
    "ssrf_exfil": ("SSRF exfil:", "SSRF 外带:"),
}

def msg(key: str, zh: bool) -> str:
    en, zh_s = MSGS[key]
    return zh_s if zh else en

def never_bypass(host, **kwargs):
    return False

def ssl_context(*, strict: bool) -> ssl.SSLContext:
    ctx = ssl.create_default_context()
    if strict:
        return ctx
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx

def opener(proxy: str, *, strict_ssl: bool):
    handlers = [urllib.request.HTTPSHandler(context=ssl_context(strict=strict_ssl))]
    if proxy:
        # Force proxy for 127.0.0.1/localhost; do not bypass local addresses.
        os.environ["no_proxy"] = ""
        os.environ["NO_PROXY"] = ""
        urllib.request.proxy_bypass = never_bypass
        if hasattr(urllib.request, "proxy_bypass_environment"):
            urllib.request.proxy_bypass_environment = never_bypass
        if hasattr(urllib.request, "proxy_bypass_registry"):
            urllib.request.proxy_bypass_registry = never_bypass
        handlers.insert(0, urllib.request.ProxyHandler({"http": proxy, "https": proxy}))
    return urllib.request.build_opener(*handlers)

def main() -> int:
    p = argparse.ArgumentParser(description="PoC")
    p.add_argument("-u", "--url", required=True, help="Target origin, e.g. http://127.0.0.1:8080")
    p.add_argument("--proxy", default="", help="HTTP proxy, e.g. http://127.0.0.1:8080; empty=direct")
    p.add_argument(
        "--strict-ssl",
        action="store_true",
        help="Strict HTTPS certificate verification (default: skip mismatch/self-signed)",
    )
    p.add_argument(
        "--zh",
        action="store_true",
        help="Print labels/status in Chinese (default: English)",
    )
    p.add_argument("-c", "--cmd", default="id", help="Command to execute (RCE)")
    args = p.parse_args()
    zh = args.zh
    base = args.url.rstrip("/")
    if base.lower().startswith("https://") and not args.strict_ssl:
        print(msg("ssl_warn", zh))
    http = opener(args.proxy, strict_ssl=args.strict_ssl)
    # Send request: http.open(urllib.request.Request(...))
    # requests: verify=args.strict_ssl; override proxy_bypass the same way
    # requests.utils.should_bypass_proxies = lambda url, no_proxy=None: False
    # session.trust_env = False; session.proxies = {"http": args.proxy, "https": args.proxy}
    # print(msg("status", zh), ...); print(msg("response", zh), ...)
    # If echoed: print(msg("cmd_out", zh)); print(output)
    # Return 0 only when the expected impact is observed, else 1
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
```

## Invocation examples

```text
python poc.py -u http://TARGET:PORT
python poc.py -u http://TARGET:PORT --zh
python poc.py -u http://TARGET:PORT --proxy http://127.0.0.1:8080
python poc.py -u http://TARGET:PORT -c "whoami"
python poc.py -u http://TARGET:PORT -c "id" --cookie "SESSION=..." --proxy http://127.0.0.1:8080
python poc.py -u https://110.238.73.241
python poc.py -u https://real-domain.com --strict-ssl
python harness.py
python harness.py --zh
```

## Reviewer / Verifier
- Dynamic verification (Reviewer): run `python vulns/{id}/poc.py -u <this target>` first, adding `-c`, `--proxy` etc. as needed; do not write the address or proxy back into the script.
- **Internet re-test (Verifier)**: first read the report and the PoC to understand the essence of the exploit (entry point, sink, payload mechanism, success evidence). When there is a `poc.py` that can switch targets, prefer `poc.py -u <this target>`; when there is no usable HTTP PoC (missing, harness-only, cannot switch targets) **do not skip** - construct the HTTP payload yourself from the report. When the original PoC no longer works, adjust the exploitation of the **same finding** (path prefix, encoding, header, parameter name) and try again; do not overwrite the confirmed `poc.py`, do not switch finding or sink, and do not point `harness.py` at the internet. Put the request actually sent into FinishVerifier.poc.
- **Lab dynamic closing gate**: ConfirmVuln re-runs the `poc.py -u <target_url>` about to be written to disk; a non-zero exit rejects the confirmation. You must still run it yourself first and observe the impact.
- **The Reviewer closes out the PoC**: the Worker hands over a static draft. A hard-coded address/parameter, a missing CLI (including `--proxy` / HTTPS certificate handling / `--zh`), a proxy set but `127.0.0.1` bypassing it, an HTTPS run aborting on certificate verification, output hard-coded to Chinese or mixing the two by default, or wrong payload details on the same chain - the Reviewer Writes `poc.py` and passes `poc_code` on ConfirmVuln. Do not ReturnToWorker for this.
- **debug MCP**: use it only when poc.py is missing, will not run, or reproduction fails and the Reviewer needs to rewrite / debug the PoC itself; it is not the first-choice verification method.
- It is **forbidden** to switch to a different exploitation chain or a different sink to get the finding through, and forbidden to modify the lab to cover for the Worker. Payload calibration on the same chain (encoding, parameter name, authentication header) is not a chain switch.

## Component library / mixed audit target
When the project `target_kind` is `library` or `mixed`:
- With an HTTP exploitation surface, still follow the `-u/--url` + `--proxy` contract above, and `poc_code` is required.
- **Pure library findings** use `harness.py` (`RunCode`) as the primary path for local-verification evidence. When the public entry point itself consumes HTTP / a request object, the harness must call that `src/` API and send the attack request in the same process (payload from the request), not just copy an internal function; request-less APIs such as YAML/codecs must not be wrapped in HTTP. Write `poc.py` **only** when, after installing the real package (pip/npm/maven, etc.), the public API can be `import`ed and made to produce impact: a minimal call script, with argparse for the package path/version, and **no** `-u/--url`. Do not copy the harness's inlined/mock test.
- No HTTP surface and no way to reproduce against an installed package: omit `poc_code`; do not hand over an empty shell or a fake HTTP CLI.
- SubmitVuln's `http_request` may hold an **API call recipe** (class / method / parameters) instead of an HTTP message; FOFA/X fingerprints may be "not applicable".
- The harness must also support `--zh` (Python `argparse`; other languages scan argv / `process.argv` / `os.Args` for `--zh`). English labels by default, `--zh` switches to Chinese; comments and `--help` stay in English. The final evidence on stdout must be real runtime data, never a hard-coded `success=True` / `{"success": true}` or just printing `CONFIRMED`.
