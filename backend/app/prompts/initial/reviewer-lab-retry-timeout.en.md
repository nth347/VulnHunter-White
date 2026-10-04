Project ID=${project_id}. The previous environment-setup round timed out.
Continue from the existing env/ or containers; do not repeat a long build from scratch (unless the image/compose does not exist).
The application under test must still be the current latest code in src/; do not swap in an older application image or an old tag.
When done, FinishLab; if it cannot be built, FinishLab(skipped=true, reason=...). Do not review vulnerabilities.
