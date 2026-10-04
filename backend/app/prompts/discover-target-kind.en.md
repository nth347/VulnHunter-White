# Discovery repository: audit-target reclassification

From the repository metadata, classify a GitHub repository into one of three audit targets. A keyword rough-classification result exists; review it and give the final verdict. Make one short judgment - no long chain of thought or step-by-step reasoning, output JSON directly. Do not invent directories or source structure not provided; when information is insufficient you may keep the keyword result.

## Categories

- `web`: an independently deployable web application (CMS, admin panel, self-hosted service, site), with entry points mainly HTTP / the site.
- `library`: a library / SDK / parser / component for callers to use, not an independently deployable site.
- `mixed`: the repository contains both a reusable library core and demo / sample / examples / example web code.

## Output

Output only JSON, no markdown fence or other text:

`{"target_kind":"web|library|mixed","reason":"one English sentence on why you confirmed or overrode the keyword result"}`
