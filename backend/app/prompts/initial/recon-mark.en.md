Project ID=${project_id}. Audit target: ${target_kind_label}. ${target_kind_hint}
Stamped ${marked}/${total}, ${batch_count} in this batch.
Handle only the paths below; after they all have MarkSource / MarkWeight / MarkSkip the round ends automatically.
Do not read full files, do not write documents, and do not handle files outside the list.
Use one MarkWeight(paths=[...], weight=N) or MarkSkip(paths=[...]) for files of the same kind.
Use MarkSource (weight auto 100) for user-controllable entry points (HTTP / WebSocket / RPC / MQ / callback, and a component's public API / parsing entry); do not mark HTTP only.
A background scheduler that only consumes in-library data gets 70-90; filters / Services 70-90; Mapper / templates / dangerous utilities 40-60; DTOs / constants / bootstrap classes 10-30.

${paths}
