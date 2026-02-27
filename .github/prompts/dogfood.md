# Dogfood: Endpoints Sample App

## Constraints
- Do NOT read AGENTS.md or agent-docs/
- Do NOT read the target app's source code

## Task

Run an exploratory QA session on the endpoints sample app using the `/dogfood` skill, then report findings as a GitHub issue.

### Step 1 — Run the dogfood skill

Invoke the `/dogfood` skill with these parameters:
- **Target URL**: `http://localhost:8080`
- **Session name**: `endpoints`
- **Output directory**: `/tmp/dogfood-output`
- **Auth credentials**: username `temp`, password `temp`

### Step 2 — Known noise (IGNORE these)

Tell the skill to ignore:
- `/federated-tabs/failing` — intentionally throws to exercise error boundaries. The error boundary UI is expected.
- MSW (Mock Service Worker) console warnings — expected in this mock-data app.
- React warnings and deprecation notices — only flag actual JS errors/exceptions.

### Step 3 — File a GitHub issue (or stop)

After the skill completes, read the generated report at `/tmp/dogfood-output/report.md`.

- **If the report contains zero issues**: end with "DOGFOOD PASSED — no issues found" and stop.
- **If the report contains issues**: create a GitHub issue with the following format:

```bash
gh issue create \
  --title "Dogfood: endpoints — $(date +%Y-%m-%d)" \
  --body "$(cat /tmp/dogfood-output/report.md)"
```
