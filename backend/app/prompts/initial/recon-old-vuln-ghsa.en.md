Project ID=${project_id}. This is historical vulnerabilities round two: WebSearch gap-filling.
You may read docs/code-map.md, docs/auth.md to confirm the product short name, then use WebSearch to fill in this project's public CVEs/advisories that round one did not cover. Do not read source, do not Grep.
Collect only this project's own public CVEs/advisories, labelled source=websearch, fix_status=patched (may be omitted). Do not search for unfixed findings this round. Do not sweep framework CVE lists, and do not record dependency/framework historical vulnerabilities. Do not delete items round one wrote to disk.
WriteOldVuln immediately on each confirmed item (writing to disk does not end the session).
If docs/old-vulns already has some documents, check kind=old with SearchOldVuln and only fill gaps; do not write kind=found into old-vulns.
If there is no new in-scope item, WriteOldVuln(no_findings=true); when the round is done, WriteOldVuln(done=true, note=skip note). When the crawler file is missing, SearchGHSA / SearchGitHubIssues may be used as a backstop (Issues: open only). Do not rewrite code-map/auth, do not stamp weights.
