Mining mode: ${audit_mode_label}. ${audit_mode_hint}
Project ID=${project_id}. Source is in src/.
The user requested a **resume** of the environment setup (the last round ended on timeout/retries exhausted or failed to become ready).
This round is still the Reviewer's **separate environment-setup round**; do not review vulnerabilities.
Build a reusable web lab under env/ (prefer an existing Dockerfile / compose in src/) and write env/env.json.
The application under test must be built from the current code in src/ (the latest version); do not swap in an older release, an old git tag, an old application image or a vulhub historical lab to hit a known finding. Dependency images such as mysql/redis follow the project's needs.
Tag a self-built image `${lab_image}`, the web container `${lab_container}`, dependency containers `${lab_container}-<role>`; the compose project name `${lab_compose_project}`. Every container and self-built image must carry the labels `${lab_label_args}`.
Continue from the existing env/ or containers; do not repeat a long build from scratch (unless the image/compose does not exist).
Once the business application is reachable (login page/portal/health check, not a default page 200) with accepted=true / status=running, call FinishLab; if it cannot be built, FinishLab(skipped=true, reason=...).
This is not "creating an exploitation environment": build a default-deployment lab, and do not plant payloads or change non-application configuration in the container.
