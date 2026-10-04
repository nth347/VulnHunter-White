Project ID=${project_id}. The code map and authorization are ready.

The system has pre-filtered a set of extensions. Check and adjust them against docs/code-map.md and the repository's actual files (do not copy a fixed list):
- execution surfaces such as templates/mappings/scripts → AddSourceExt(exts=[...])
- noise extensions (too numerous and unimportant) → AddSourceExt(remove_exts=[...])
- nothing to adjust → AddSourceExt(done=true)

Extension-filtering principle: the repository decides, prefer broad coverage; skip a type when its files are too numerous (>500) and low audit value.

When all is confirmed, AddSourceExt(done=true). Do not rewrite the map/auth, do not stamp weights, and do not search historical vulnerabilities.
