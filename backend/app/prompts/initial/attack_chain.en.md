# Attack-chain assembly task

Mining mode: ${audit_mode_label}. Audit target: ${target_kind_label}.

Mining and review are over. This project currently has **${confirmed_count}** confirmed vulnerabilities (`confirmed` / `static_only`).

## Confirmed-vulnerability catalog (summary)
```json
${catalog}
```

## Requirements
1. Use `SearchOldVuln` to read candidates in full (only this project's confirmed output is allowed; historical old vulnerabilities are forbidden).
2. When needed, `Read`/`Grep` to check whether a prerequisite in the source can really be satisfied by the prior step. Gather candidates before ranking.
3. **At most 3 detailed documents**: `SubmitAttackChain` (with a steps body) only for the chains with the greatest impact and the simplest exploitation.
4. Write the other real chains into the index summary with `IndexAttackChain`, or submit them all at once in `FinishAttackChain(other_chains=...)`. Do not write a detailed document for a homogeneous variant.
5. When done, `FinishAttackChain(notes=...)`. Finish even if no reasonable chain is found; do not force it.

Current mining mode: ${audit_mode_label}
${audit_mode_hint}
