# Smoke Test: Endpoints Sample App

## Constraints
- Do NOT read CLAUDE.md or agent-docs/
- Do NOT read the target app's source code
- Do NOT take screenshots or record videos
- Use ONLY `agent-browser snapshot -i` (text) and `agent-browser console` for verification

## Task
Smoke-test the endpoints sample app. Start the servers, log in, then visit
every page listed below and verify each renders content without JavaScript errors.

### Step 1 — Start servers

Start the endpoint servers in the background and wait for them to be ready:

```bash
pnpm serve-endpoints > /tmp/endpoints-serve.log 2>&1 &
```

Wait for both servers to be ready (single command to save a turn):

```bash
curl --retry 30 --retry-delay 5 --retry-connrefused --silent --output /dev/null http://localhost:8080 && curl --retry 30 --retry-delay 5 --retry-connrefused --silent --output /dev/null http://localhost:8081
```

If either curl command fails, run `cat /tmp/endpoints-serve.log` for diagnostics and stop with "SMOKE TEST FAILED".

### Step 2 — Validate pages

The app runs at `http://localhost:8080`. It has a mock login page — use username `temp` and password `temp` to authenticate.

Navigate to each page below and verify it renders content without JavaScript errors:

1. `/` (Home page)
2. `/subscription`
3. `/federated-tabs`
4. `/federated-tabs/episodes`
5. `/federated-tabs/locations`
6. `/federated-tabs/failing` (expected to show an error boundary — see "Known noise")

For each page:
1. Navigate to the page
2. `agent-browser snapshot -i` — confirm meaningful content rendered (not blank/error)
3. `agent-browser console` — check for JS errors (exceptions, failed assertions)

**Known noise (IGNORE these):**
- `/federated-tabs/failing` — intentionally throws to exercise error boundaries. The error boundary UI is expected.
- MSW (Mock Service Worker) console warnings — expected in this mock-data app.
- React warnings, deprecation notices — only flag actual JS errors/exceptions.

**What counts as a failure:**
- A page renders blank or shows an unhandled error (except /federated-tabs/failing)
- JavaScript exceptions in the console (not warnings)
- Navigation links that lead nowhere or crash

### Result

If all pages pass: end with "SMOKE TEST PASSED".
If any page fails: end with "SMOKE TEST FAILED" and list which pages failed and why.
