// Fails when a change to update-dependencies.yml lets the resolve job install what it resolved,
// hands that job a credential or a cache, or makes the open-pr job run anything but git and gh.
// See "Dependency update workflow" in agent-docs/references/ci-cd.md.
//
//   node --test .github/scripts/updateDependenciesWorkflow.test.ts

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const workflow = readFileSync(new URL("../workflows/update-dependencies.yml", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter(line => !line.trim().startsWith("#"))
    .join("\n");

function readJob(name: string) {
    const match = workflow.match(new RegExp(`\\n  ${name}:\\n([\\s\\S]*?)(?=\\n  [\\w-]+:\\n|$)`));
    assert.ok(match, `The ${name} job is missing.`);

    return match[1];
}

// The command lines of the run blocks of a job.
function listCommands(job: string) {
    const commands: string[] = [];
    let blockIndent = -1;

    for (const line of job.split("\n")) {
        const indent = line.search(/\S/);
        const run = line.match(/^\s*(?:- )?run: (.*)$/);

        if (run) {
            blockIndent = run[1] === "|" ? indent : -1;
            if (run[1] !== "|") {
                commands.push(run[1]);
            }
        } else if (blockIndent !== -1 && (indent === -1 || indent > blockIndent)) {
            commands.push(line.trim());
        } else {
            blockIndent = -1;
        }
    }

    return commands;
}

function listActions(job: string) {
    return [...job.matchAll(/uses: ([^@\s]+)@/g)].map(match => match[1]);
}

const resolve = readJob("resolve");
const openPr = readJob("open-pr");

test("the workflow holds no secret, no identity token and no agent", () => {
    assert.doesNotMatch(workflow, /secrets\./);
    assert.doesNotMatch(workflow, /id-token/);
    assert.doesNotMatch(workflow, /claude-code-action/);
    assert.match(workflow, /\npermissions: \{\}\n/);
});

test("the resolve job holds a read-only token, no credential and no cache", () => {
    assert.doesNotMatch(resolve, /: write/);
    assert.doesNotMatch(resolve, /token/i);
    assert.doesNotMatch(resolve, /\bcache:/);
    assert.match(resolve, /persist-credentials: false/);
    assert.deepEqual(listActions(resolve), ["actions/checkout", "pnpm/action-setup", "actions/setup-node", "actions/upload-artifact"]);
});

test("the resolve job never installs what it resolved", () => {
    const pnpmCommands = listCommands(resolve).filter(command => /\bpnpm\s/.test(command));
    const resolveIndex = pnpmCommands.findIndex(command => command.includes("update-outdated-deps:update-versions"));

    assert.equal(resolveIndex, 1, "The versions are resolved right after the frozen install.");
    assert.match(pnpmCommands[0], /--frozen-lockfile/);
    assert.match(pnpmCommands[1], /--lockfile-only/);

    for (const command of pnpmCommands.slice(2)) {
        assert.doesNotMatch(command, /\bpnpm (run|exec|dlx)\b/, command);
        assert.match(command, /--lockfile-only/, command);
        assert.match(command, /--config\.pmOnFail=ignore/, command);
    }

    assert.match(resolve, /node_modules changed/);
});

test("the open-pr job runs git and gh only", () => {
    assert.deepEqual(listActions(openPr), ["actions/checkout", "actions/download-artifact"]);

    for (const command of listCommands(openPr)) {
        assert.doesNotMatch(command, /\b(pnpm|npm|npx|node|bun|deno|make|bash|sh|source|eval)\s/, command);
        assert.doesNotMatch(command, /(^|\s)\.{1,2}\//, command);
    }

    assert.match(openPr, /core\.hooksPath=\/dev\/null commit/);
});

test("no run block reads an expression", () => {
    for (const command of [...listCommands(resolve), ...listCommands(openPr)]) {
        assert.doesNotMatch(command, /\$\{\{/, command);
    }
});
