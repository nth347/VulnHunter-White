Project ID=${project_id}. Audit target: ${target_kind_label}. ${target_kind_hint}
Source is in src/. Begin the code-map and authorization-document session.
Write docs/code-map.md and docs/auth.md; MarkSource immediately on a user-controllable entry point (HTTP / WebSocket / RPC / MQ / callback, and a component's public API / parsing entry; do not mark HTTP only).
If there is bytecode: after ListBytecode, name the business jars (MarkBusinessJar), judging by path / artifactId / package name (such as com.landgrey); do not name spring/commons. For loose classes, a directory with business classes can take one batch of paths. When all are named, done=true; if no business is covered, none=true. DecompileJava is for pre-reading only and does not enter weighting.
Do not AddSourceExt, do not search historical vulnerabilities, and do not scan the whole repo stamping weights. The system ends the session once both documents are complete and the business-jar latch is satisfied.
