# Smoke Test: Endpoints Sample App

## Constraints
- Do NOT read CLAUDE.md or agent-docs/
- Do NOT read the target app's source code
- Do NOT take screenshots or record videos
- Use ONLY `agent-browser snapshot` (text) and `agent-browser console` for verification
- Do NOT run `agent-browser skills`, `--help`, or `eval` — every command you need is spelled out below

## Shell constraints (read before running anything)

The sandbox rejects some shell constructs. Using them wastes turns, so avoid them:

- **No `&`** — background a command with the Bash tool's `run_in_background` parameter instead.
- **No output redirection to a file** (`> some.log`) — it is blocked even inside the working directory. `>/dev/null` is fine.
- **No command substitution** (`$(...)`).
- **Always invoke `agent-browser` as a bare command** — never `node_modules/.bin/agent-browser`, which is not allowlisted.

Chaining allowlisted commands with `;` and piping into `grep`/`head`/`tail` are both fine, and are how the recipes below stay within one turn.

## Task
Smoke-test the endpoints sample app. Start the servers, log in, then visit
every page listed below and verify each renders content without JavaScript errors.

### Step 1 — Start servers

Run this exact command with the Bash tool's `run_in_background` parameter set to `true` (no `&`, no redirection):

```bash
pnpm serve-endpoints
```

Then wait for both servers in a single turn:

```bash
curl --retry 30 --retry-delay 5 --retry-connrefused --silent --output /dev/null http://localhost:8080 && curl --retry 30 --retry-delay 5 --retry-connrefused --silent --output /dev/null http://localhost:8081 && echo "BOTH SERVERS READY"
```

If that command fails, read the background task's output file for diagnostics and stop with "SMOKE TEST FAILED".

### Step 2 — Log in

The app runs at `http://localhost:8080` behind a mock login page. Credentials: `temp` / `temp`.

```bash
agent-browser open http://localhost:8080
```

```bash
agent-browser snapshot -i
```

The snapshot returns refs for the username textbox, password textbox and login button (typically `@e3`, `@e4`, `@e5` — use whatever refs the snapshot actually reports). Submit in one turn:

```bash
agent-browser fill @e3 temp >/dev/null 2>&1; agent-browser fill @e4 temp >/dev/null 2>&1; agent-browser click @e5 >/dev/null 2>&1; agent-browser wait 4000 >/dev/null 2>&1; agent-browser get url
```

The session persists across full page loads, so you only log in once.

### Step 3 — Validate pages

Navigate to each page **by URL** and verify it renders content without JavaScript errors:

1. `/` (Home page)
2. `/subscription`
3. `/federated-tabs`
4. `/federated-tabs/episodes`
5. `/federated-tabs/locations`
6. `/federated-tabs/failing` (expected to show an error boundary — see "Known noise")

Use one turn per page. Substitute the page's URL into this recipe as-is — it clears the console buffer, navigates, waits for the SPA to settle, snapshots, and filters the console down to errors:

```bash
agent-browser console --clear >/dev/null 2>&1; agent-browser open http://localhost:8080/PAGE >/dev/null 2>&1; agent-browser wait 8000 >/dev/null 2>&1; agent-browser snapshot -c | head -80; echo "=== ERRORS ==="; agent-browser console | grep -E "^\[error\]" | head -20; echo "=== END ==="
```

Two details in that recipe are load-bearing:

- **Piping `console` into `grep`** — the raw buffer is tens of kilobytes of `[log]`/`[warning]` lines, which spills to a file and costs you an extra turn to read back.
- **`wait 8000`** — `/federated-tabs/failing` renders its error boundary noticeably later than the other pages. Waiting less means snapshotting a half-rendered page and spending a turn to retry.

`snapshot -c` (compact, all elements) is what shows page content such as headings and data rows. `-i` lists only interactive elements, so use it for the login form and not here.

Do **not** try to verify navigation by clicking links. Past runs have seen `agent-browser` stop delivering input events to the page after the login form, and debugging that consumed most of the turn budget without finding an app defect. Direct URL navigation exercises the same routes.

**Known noise (IGNORE these):**
- **LaunchDarkly errors on every page** — `LAUNCH_DARKLY_CLIENT_ID` is not set in CI, so the client always fails to initialize (`No environment/client-side ID was specified`, `Environment not found`, `LaunchDarklyFlagFetchError`). The app catches and logs these; rendering is unaffected.
- `/federated-tabs/failing` — intentionally throws to exercise error boundaries. The error boundary UI and its `500 Internal Server Error` are expected.
- Module Federation `does not satisfy the requirement of host` version warnings — expected for `workspace:*` dependencies.
- MSW (Mock Service Worker) console warnings — expected in this mock-data app.
- React warnings, deprecation notices — only flag actual JS errors/exceptions.

**What counts as a failure:**
- A page renders blank or shows an unhandled error (except `/federated-tabs/failing`)
- JavaScript exceptions in the console that are not covered by "Known noise" above

### Result

If all pages pass: end with "SMOKE TEST PASSED".
If any page fails: end with "SMOKE TEST FAILED" and list which pages failed and why.
