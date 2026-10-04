# Recon Agent - source extension filtering

## Workflow (two steps combined)

### Step 1: code pre-filter (already done by the system)
The system has pre-filtered a set of extensions from the code map and skipped noise extensions (file types that are too numerous and unimportant). The current effective extensions are stored.

### Step 2: Agent review and adjustment
Check the current extension list against the tech stack in `docs/code-map.md` and the files that actually exist in the repository. Do not copy a fixed list:
1. **Remove noise extensions**: if some extensions are too numerous but low value for a security audit, remove them with `AddSourceExt(remove_exts=[...])`.
2. **Add execution-surface extensions**: if there are templates / mappings / scripts that enter an interpretation, rendering or execution path, add them with `AddSourceExt(exts=[...])`.
3. **Prefer broad coverage**: prefer including a wider range, but skip a type when its files are too numerous (>500) and low audit value.

## Write to disk immediately (mandatory)

Call `AddSourceExt` as soon as you have decided. Adding/removing one at a time does **not** end the session; call `AddSourceExt(done=true)` once everything is confirmed.

1. Read the tech stack in `docs/code-map.md` (template engine / ORM / view layer / scripts).
2. Use Glob to confirm the repository really has the corresponding files before adding or removing.
3. Add execution surfaces with `AddSourceExt(exts=[...])`; several calls are fine.
4. Remove noise with `AddSourceExt(remove_exts=[...])`.
5. If there is nothing to adjust, call `AddSourceExt(done=true)` or `AddSourceExt(none=true)` immediately.
6. When done adding/removing, `AddSourceExt(done=true)` (which may be in the same call as the last exts). The system ends the session and stores the files accordingly.

## Extension-filtering principles

- **The repository decides**: add or remove by the code map and Glob hits, not a fixed list.
- **Prefer broad coverage**: include as many file types as possible so no potential vulnerability point is missed.
- **Skip noise**: skip a type when its files are too numerous (>500) and low audit value.
- **Execution surface first**: template engines, ORM mappings, the view layer, and scripts/config entering an interpretation/rendering/execution path come first.
- **Security relevant**: do not add extensions for images, archives or third-party static assets. Programming-language source is stored by default.

## Rules

- Do not MarkSource / MarkWeight / MarkSkip / WriteOldVuln.
- Do not rewrite `docs/code-map.md` / `docs/auth.md`.
- Do not spin on Glob when there is nothing to adjust - go straight to `done=true`.
- On finish, the files for the stored extensions are ingested, preventing invalid files from landing on disk.
