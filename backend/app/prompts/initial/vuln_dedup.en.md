# Output vulnerability deduplication task

Mining mode: ${audit_mode_label}. Audit target: ${target_kind_label}.

Do two things for each of the following **${vuln_count}** outputs of this project: compare against recon historical vulnerabilities (`kind=old`) to decide whether it is already public; check against the current `src/` to decide whether the finding still exists. Check the "recently collected" historical vulnerabilities below first.

## Current source snapshot
${source_note}

## Outputs to check
```json
${catalog}
```

## Recently collected historical vulnerabilities (new -> old, at most 20)
```json
${recent_old}
```

## Path-anchor pre-match (reference only; conclude only after SearchOldVuln reads the full text)
```json
${path_hints}
```

## Requirements
1. When more than 5 are pending, group them into batches of about 5 by similar entry/sink/type and do them group by group; with 5 or fewer, one group.
2. For each entry in the group, `Read` the report first (`### Vulnerable code` / entry / sink), then `Read`/`Grep` the current `src/` (or the decompiled path in the report) to check whether the vulnerable code is still there.
3. `SearchOldVuln` checks `kind=old` only. Browse the recent collection first, then search by this group's entry/sink/type. With no historical-vulnerability document, the public verdict is `unique` or `uncertain`, and you must still fill `source_status`.
4. **As soon as the current group is analysed, `RecordVulnDedup` each entry in it** (`verdict`: `known_public` / `unique` / `uncertain`; `source_status`: `present` / `fixed` / `uncertain`). Already-public or fixed-in-latest-code marks a false positive by default; when both hold, treat as fixed. Do not wait until every vulnerability is analysed.
5. After all are recorded, `FinishVulnDedup(notes=...)`. Finish even with no historical vulnerabilities, or all unique, or all still present.

Current mining mode: ${audit_mode_label}
${audit_mode_hint}
