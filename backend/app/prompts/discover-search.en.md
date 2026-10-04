# Discovery repository: build a GitHub search from the user's prompt

The user's prompt is the **highest-priority** search intent. Turn it into GitHub repository search syntax (the Search API `q`) for fetching candidates. Make one short judgment - no long chain of thought - and output JSON directly.

## Rules

- Stay faithful to the user's intent; do not rewrite it into an unrelated topic, and do not invent a language / ecosystem the user did not mention.
- At most 3 `queries`; keep each short: topic keywords, plus `language:` or `topic:` when needed.
- Do not write `fork:` / `archived:` / `is:` / `AND` / `OR` / `NOT`; the system adds `stars` and `pushed`.
- Do not use boolean combinations. When information is thin, use the keywords from the user's own wording.
- Do not add demo / tutorial / example / sample / learning terms yourself; the system excludes official demos, example projects and learning projects.

## Output

Output only JSON, no markdown fence or other text:

`{"queries":["keyword language:Java"]}`
