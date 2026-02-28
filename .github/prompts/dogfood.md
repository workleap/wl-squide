# Dogfood: Endpoints Sample App

## Constraints
- Do NOT read AGENTS.md or agent-docs/
- Do NOT read the target app's source code
- Do NOT use the Skill tool — read skill files directly with the Read tool

## Task

Run an exploratory QA session on the endpoints sample app using the agent-browser dogfood skill, then report findings as a GitHub issue.

### Step 1 — Start servers

Start the endpoint servers in the background and wait for them to be ready:

```bash
pnpm serve-endpoints > /tmp/endpoints-serve.log 2>&1 &
```

Wait for both servers to be ready (single command to save a turn):

```bash
curl --retry 30 --retry-delay 5 --retry-connrefused --silent --output /dev/null http://localhost:8080 && curl --retry 30 --retry-delay 5 --retry-connrefused --silent --output /dev/null http://localhost:8081
```

If either curl command fails, run `cat /tmp/endpoints-serve.log` for diagnostics and stop.

### Step 2 — Run the dogfood session

Read and follow the skill instructions at `node_modules/agent-browser/skills/dogfood/SKILL.md` with these parameters:
- **Target URL**: `http://localhost:8080`
- **Session name**: `endpoints`
- **Output directory**: `/tmp/dogfood-output`
- **Auth credentials**: username `temp`, password `temp`

### Step 3 — Known noise (IGNORE these)

Apply these ignore rules during the dogfood session:
- `/federated-tabs/failing` — intentionally throws to exercise error boundaries. The error boundary UI is expected.
- MSW (Mock Service Worker) console warnings — expected in this mock-data app.
- React warnings and deprecation notices — only flag actual JS errors/exceptions.

### Step 4 — Upload evidence and file a GitHub issue (or stop)

After the skill completes, read the generated report at `/tmp/dogfood-output/report.md`.

- **If the report contains zero issues**: end with "DOGFOOD PASSED — no issues found" and stop.
- **If the report contains issues**:

  1. **Identify referenced evidence** — Using the Grep tool (parameter is `path`, not `file_path`), find all `screenshots/*.png` and `videos/*.webm` paths referenced in the report. Only these files should be uploaded (ignore exploration screenshots not cited in the report).

  2. **Push evidence to the `dogfood-evidence` branch** — Evidence is stored in date-stamped directories (`YYYY-MM-DD/screenshots/`, `YYYY-MM-DD/videos/`) so each run's evidence persists and old issue links keep working.
     - Configure git auth (use `--global` so it applies to any repo or clone):
       ```bash
       git config --global user.name "github-actions[bot]"
       git config --global user.email "github-actions[bot]@users.noreply.github.com"
       git remote set-url origin "https://x-access-token:${GH_TOKEN}@github.com/workleap/wl-squide.git"
       ```
     - Fetch or create the `dogfood-evidence` branch:
       - If it exists: `git fetch origin dogfood-evidence && git checkout -B dogfood-evidence origin/dogfood-evidence`
       - If not: `git checkout --orphan dogfood-evidence && git rm -rf . 2>/dev/null || true`
     - **Prune old evidence** — This step is mandatory even if you expect nothing to prune. Delete date directories older than 60 days, then commit the deletions if any files were removed:
       ```bash
       CUTOFF=$(date -d '60 days ago' +%Y-%m-%d)
       for d in ./[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]/; do
         name=$(basename "$d")
         [[ "$name" < "$CUTOFF" ]] && rm -rf "$d"
       done
       git add -A && { git diff --cached --quiet || git commit -m "Prune evidence older than 60 days"; } || true
       ```
     - **Add new evidence** — Create `YYYY-MM-DD/screenshots/` and `YYYY-MM-DD/videos/`, copy only the referenced files, stage, commit, push.
     - **Return to main branch** — `git checkout main`

  3. **Rewrite evidence paths** in the report — Replace relative asset paths with absolute GitHub URLs so images render in the issue. First, capture today's date into a variable, then use it in the sed replacements:
     ```bash
     TODAY=$(date +%Y-%m-%d)
     sed -i "s|screenshots/|https://raw.githubusercontent.com/workleap/wl-squide/dogfood-evidence/${TODAY}/screenshots/|g" /tmp/dogfood-output/report.md
     sed -i "s|videos/|https://raw.githubusercontent.com/workleap/wl-squide/dogfood-evidence/${TODAY}/videos/|g" /tmp/dogfood-output/report.md
     ```

  4. **Create the issue**:
     ```bash
     gh issue create \
       --title "Dogfood: endpoints — $(date +%Y-%m-%d)" \
       --body "$(cat /tmp/dogfood-output/report.md)"
     ```
