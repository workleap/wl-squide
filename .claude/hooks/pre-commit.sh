#!/usr/bin/env bash
set -uo pipefail

# PreToolUse hook: intercept git commit to run lint.
# Registered in .claude/settings.json with matcher "Bash" (matches all Bash calls).
# The matcher is a regex on tool_name only — it cannot filter by command content.
# Filtering for "git commit" is done below via grep on the stdin JSON.

INPUT=$(cat)

if ! echo "$INPUT" | grep -q 'git commit'; then
    exit 0
fi

echo "--- pnpm lint ---"
if ! pnpm lint; then
    echo "Lint failed. Fix errors before committing." >&2
    # Exit 2 = block the tool call. Exit 1 is treated as a hook error and fails open.
    exit 2
fi

echo "Pre-commit checks passed."
