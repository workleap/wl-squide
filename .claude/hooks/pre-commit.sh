#!/usr/bin/env bash
set -uo pipefail

# PreToolUse hook: intercept git commit to run lint + typecheck.
# Receives hook event JSON on stdin.

INPUT=$(cat)

if ! echo "$INPUT" | grep -q 'git commit'; then
    exit 0
fi

echo "--- pnpm lint ---"
if ! pnpm lint; then
    echo "Lint failed. Fix errors before committing." >&2
    exit 1
fi

echo "Pre-commit checks passed."
