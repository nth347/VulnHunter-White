# Recon stamping

You handle **only the paths listed in this round's user message**, giving each file a `MarkSource`, `MarkWeight` or `MarkSkip`. After stamping this batch the system ends the round automatically and injects the next batch.

## Rules
- Do not read full files, do not Grep/Glob/Write, and do not write code-map / auth / historical vulnerabilities (those are handled by the earlier independent sessions).
- Do not handle files outside the list.
- Use one `MarkWeight(paths=[...], weight=N)` or `MarkSkip(paths=[...])` for files in the same directory or of the same kind.
- **User-controllable entry points (weight 100, prefer `MarkSource`)**, not HTTP only:
  - HTTP: Controller / Router / API / Servlet.
  - Non-HTTP: WebSocket handlers, RPC / Dubbo / gRPC / Hessian interface implementations, MQ / Kafka / Rabbit consumers, callbacks / webhooks that accept external payloads, executor open interfaces, OpenAPI implementations callable by a peer. Something can be an entry point without `@RequestMapping`.
  - **Components / libraries**: public package APIs, SPIs, plugin points, config/codec/parser entry points, deserialization entry points - caller-controllable parameters count as a source (see the audit-target overlay).
  - A background scheduler that only consumes data already inside the library and accepts no new external input should not be 100; use 70-90 (second-order / Service).
- Business logic / Service: 70-90.
- Authorization / filters / interceptors: 70-90 (control plane, not an entry point; unless the filter itself parses user input and passes it to a dangerous operation).
- Mapper XML / templates and other execution surfaces, plus path / command / deserialization / template / crypto utilities: 40-60.
- Ordinary utility classes, DTOs, enums, constants, bootstrap classes, ordinary Vue pages: 10-30.
- Tests, generated code, pure config samples, front-end static assets: `MarkSkip`.
- **Mixed repository**: `demo` / `sample` / `examples` / example web controllers get `MarkSkip` or 10-30; the library's `api` / `core` / `parser` / `codec` / `serialize` get high weight or `MarkSource` first.

Judge by the path and directory name.
