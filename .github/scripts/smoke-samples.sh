#!/usr/bin/env bash
# Builds, serves and opens the endpoints and Storybook samples in a browser, and fails when a page
# does not render or throws. No agent is involved: the pages and what "rendered" means are fixed
# below.
#
#   bash .github/scripts/smoke-samples.sh
#
# Expects agent-browser on the PATH with its browser installed (agent-browser install --with-deps).
set -euo pipefail

ORIGIN="http://localhost:8080"
LOGS="${RUNNER_TEMP:-/tmp}"
# How long a page is left alone after it rendered, so that a query that fails late still shows.
SETTLE_MS=3000

# Every error screen of the endpoints sample writes its message in red, and nothing else does.
NO_ERROR_BOUNDARY='!document.querySelector("[style*=\"color: red\"]")'

failures=0

fail() {
    echo "::error::$1"
    failures=$((failures + 1))
}

serve() {
    local script="$1" log="$2"

    pnpm "$script" > "$log" 2>&1 &

    if ! curl --retry 60 --retry-delay 5 --retry-connrefused --silent --output /dev/null "$ORIGIN"; then
        cat "$log"
        echo "::error::\"pnpm $script\" never answered on $ORIGIN."
        exit 1
    fi
}

stop_serving() {
    fuser -k 8080/tcp > /dev/null 2>&1 || true
}

# Opens a page, waits for it to render, then checks that it is still rendered and threw nothing.
# A third argument of "throws" skips the last check, for a page that is meant to throw.
check_page() {
    local url="$1" rendered="$2" throws="${3:-}"

    echo "Checking $url"
    agent-browser errors --clear > /dev/null
    agent-browser open "$url" > /dev/null

    if ! agent-browser wait --fn "$rendered" > /dev/null; then
        fail "$url did not render."
        return
    fi

    agent-browser wait "$SETTLE_MS" > /dev/null

    if ! agent-browser wait --fn "$rendered" > /dev/null; then
        fail "$url rendered, then failed."
    fi

    local errors
    errors=$(agent-browser errors --json | node --eval '
        const { data } = JSON.parse(require("node:fs").readFileSync(0, "utf8"));
        console.log(data.errors.map(error => error.text).join("; "));
    ')

    if [ -n "$errors" ] && [ "$throws" != "throws" ]; then
        fail "$url threw: $errors"
    fi
}

trap stop_serving EXIT

echo "::group::Endpoints sample"
serve serve-endpoints "$LOGS/serve-endpoints.log"

agent-browser open "$ORIGIN" > /dev/null
agent-browser wait "#username" > /dev/null
agent-browser fill "#username" temp > /dev/null
agent-browser fill "#password" temp > /dev/null
agent-browser click "button[type=submit]" > /dev/null
agent-browser wait --fn '!location.pathname.startsWith("/login")' > /dev/null

check_page "$ORIGIN/" "location.pathname === \"/\" && !!document.querySelector(\"h2\") && $NO_ERROR_BOUNDARY"
check_page "$ORIGIN/subscription" "location.pathname === \"/subscription\" && !!document.querySelector(\"h1\") && $NO_ERROR_BOUNDARY"

for tab in "" /episodes /locations; do
    check_page "$ORIGIN/federated-tabs$tab" "location.pathname === \"/federated-tabs$tab\" && !!document.querySelector(\"h1\") && !!document.querySelector(\"h2\") && $NO_ERROR_BOUNDARY"
done

# This tab always throws: it proves that the checks above would have seen an error screen.
check_page "$ORIGIN/federated-tabs/failing" "!($NO_ERROR_BOUNDARY)" throws

stop_serving
# A new browser for the next sample: both are served from the same origin, and the service worker
# the endpoints sample registered would otherwise still be there.
agent-browser close > /dev/null
echo "::endgroup::"

echo "::group::Storybook sample"
serve serve-storybook "$LOGS/serve-storybook.log"

# The first story of every component.
stories=$(curl --silent --fail "$ORIGIN/index.json" | node --eval '
    const { entries } = JSON.parse(require("node:fs").readFileSync(0, "utf8"));
    const titles = new Set();
    for (const entry of Object.values(entries)) {
        if (entry.type === "story" && !titles.has(entry.title)) {
            titles.add(entry.title);
            console.log(entry.id);
        }
    }
')

if [ -z "$stories" ]; then
    fail "The Storybook sample lists no story."
fi

for story in $stories; do
    check_page "$ORIGIN/iframe.html?id=$story&viewMode=story" 'document.querySelector("#storybook-root")?.childElementCount > 0 && !document.body.classList.contains("sb-show-errordisplay")'
done

stop_serving
echo "::endgroup::"

agent-browser close > /dev/null 2>&1 || true

if [ "$failures" -gt 0 ]; then
    echo "::error::$failures page(s) failed."
    exit 1
fi

echo "Every page rendered."
