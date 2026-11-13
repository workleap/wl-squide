#!/usr/bin/env bash

# Fails when the commits between <base-ref> and HEAD change an agent skill that ships in an npm package
# without adding a changeset for that package.
#
# A skill linked by pnpm only reaches consumers when its package is published. Changesets cannot catch
# a missing changeset by itself: the skill source can live outside the package directory, and an agent
# updating only the skill has no package change telling it that a release is needed.
#
# Usage: check-agent-skill-changeset.sh <base-ref> <skill-dir>=<package-dir>...
# Example: check-agent-skill-changeset.sh HEAD^1 agent-skills/workleap-logging=packages/logging

set -euo pipefail

if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <base-ref> <skill-dir>=<package-dir>..." >&2
    exit 2
fi

base="$1"
shift

# Renames are listed as a deletion and an addition, so a file moved out of a skill still counts as a skill change.
# Paths are not quoted, so a path with non-ASCII characters still matches its skill directory.
changed_files=$(git -c core.quotePath=false diff --no-renames --name-only "$base" HEAD)

# Only the changesets added or edited by these commits count. A changeset already pending on the base
# branch can be released before these commits are merged, which would leave the skill change unreleased.
changesets=$(git -c core.quotePath=false diff --no-renames --name-only --diff-filter=AM "$base" HEAD -- ".changeset/*.md" | grep -v "^\.changeset/README\.md$" || true)

failed=0

for mapping in "$@"; do
    skill_dir="${mapping%%=*}"
    skill_dir="${skill_dir%/}"
    package_dir="${mapping#*=}"
    package_dir="${package_dir%/}"

    # Match on "<skill-dir>/" so a versioned sibling such as "<skill-dir>-v2" is not taken for the skill.
    skill_changed=0
    while IFS= read -r file; do
        case "$file" in
            "$skill_dir"/*) skill_changed=1 ;;
        esac
    done <<< "$changed_files"

    if [ "$skill_changed" -eq 0 ]; then
        continue
    fi

    package_name=""
    if [ -f "$package_dir/package.json" ]; then
        package_name=$(sed -nE 's/^[[:space:]]*"name":[[:space:]]*"([^"]+)".*/\1/p' "$package_dir/package.json" | head -n 1)
    fi

    if [ -z "$package_name" ]; then
        echo "::error::Cannot read the package name from $package_dir/package.json."
        failed=1
        continue
    fi

    changeset_found=0
    while IFS= read -r changeset; do
        if [ -n "$changeset" ] && [ -f "$changeset" ] && grep -qE "^[\"']?${package_name}[\"']?:[[:space:]]*(patch|minor|major)[[:space:]]*$" "$changeset"; then
            changeset_found=1
        fi
    done <<< "$changesets"

    if [ "$changeset_found" -eq 1 ]; then
        echo "$skill_dir changed and a changeset for $package_name was added."
    else
        echo "::error::$skill_dir changed but no changeset for $package_name was added. The skill ships in the $package_name npm package, so the change is only released with a changeset. Add a .changeset/*.md file with a \"patch\" bump for \"$package_name\"."
        failed=1
    fi
done

exit "$failed"
