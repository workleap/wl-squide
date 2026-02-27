# Smoke Test: Endpoints Sample App

## Constraints
- Do NOT read AGENTS.md or agent-docs/
- Do NOT read the target app's source code
- Do NOT take screenshots or record videos
- Use ONLY `agent-browser snapshot -i` (text) and `agent-browser console` for verification

## Task
Smoke-test the endpoints sample app at http://localhost:8080. Log in, then visit
every page listed below and verify each renders content without JavaScript errors.

## Authentication
The app has a mock login page. Use username `temp` and password `temp`.

## Pages to validate
1. `/` (Home page)
2. `/subscription`
3. `/federated-tabs`
4. `/federated-tabs/episodes`
5. `/federated-tabs/locations`
6. `/federated-tabs/failing` (expected to show an error boundary — see "Known noise")

## How to verify each page
1. Navigate to the page
2. `agent-browser snapshot -i` — confirm meaningful content rendered (not blank/error)
3. `agent-browser console` — check for JS errors (exceptions, failed assertions)

## Known noise (IGNORE these)
- `/federated-tabs/failing` — intentionally throws to exercise error boundaries. The error boundary UI is expected.
- MSW (Mock Service Worker) console warnings — expected in this mock-data app.
- React warnings, deprecation notices — only flag actual JS errors/exceptions.

## What counts as a failure
- A page renders blank or shows an unhandled error (except /federated-tabs/failing)
- JavaScript exceptions in the console (not warnings)
- Navigation links that lead nowhere or crash

## Result
If all pages pass: end with "SMOKE TEST PASSED".
If any page fails: end with "SMOKE TEST FAILED" and list which pages failed and why.
