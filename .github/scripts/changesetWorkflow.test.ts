// node --test .github/scripts/changesetWorkflow.test.ts
//
// Guards the permissions of .github/workflows/changeset.yml. Every step of a job can use the permissions
// of that job, so the job that can request the npm publishing token (id-token: write) must run nothing
// but the publish action and what the action needs. See agent-docs/references/ci-cd.md.
import { deepStrictEqual } from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { parse } from "yaml";

interface Step {
    name?: string;
    uses?: string;
    run?: string;
    with?: Record<string, unknown>;
}

interface Job {
    permissions?: Record<string, string> | string;
    steps?: Step[];
}

interface Workflow {
    permissions?: Record<string, string> | string;
    jobs: Record<string, Job>;
}

const PUBLISH_JOB = "publish";

// The write permissions a job may hold. A job that is not listed is read-only.
const ALLOWED_WRITE_PERMISSIONS: Record<string, string[]> = {
    version: ["contents", "pull-requests"],
    [PUBLISH_JOB]: ["contents", "id-token"]
};

// The only steps allowed in a job that holds id-token: write.
const PUBLISH_ACTION = "changesets/action/publish";
const ALLOWED_PUBLISH_ACTIONS = new Set(["actions/checkout", "pnpm/action-setup", "actions/setup-node", PUBLISH_ACTION]);
const ALLOWED_PUBLISH_COMMANDS = new Set(["pnpm install --frozen-lockfile --ignore-scripts"]);

const PINNED_ACTION = /^[^@]+@[0-9a-f]{40}$/;

function actionName(uses: string) {
    return uses.split("@")[0];
}

function stepLabel(step: Step) {
    return step.name ?? step.uses ?? step.run ?? "unnamed";
}

function writePermissions(job: Job) {
    if (typeof job.permissions === "string") {
        return job.permissions === "write-all" ? ["write-all"] : [];
    }

    return Object.entries(job.permissions ?? {})
        .filter(([, access]) => access === "write")
        .map(([permission]) => permission);
}

export function findViolations(workflowText: string) {
    const workflow = parse(workflowText) as Workflow;
    const violations: string[] = [];

    if (typeof workflow.permissions !== "object" || workflow.permissions === null || Object.keys(workflow.permissions).length > 0) {
        violations.push("The workflow must reset the default permissions with a top-level `permissions: {}`.");
    }

    for (const [jobName, job] of Object.entries(workflow.jobs)) {
        const steps = job.steps ?? [];
        const granted = writePermissions(job);

        for (const permission of granted) {
            if (!(ALLOWED_WRITE_PERMISSIONS[jobName] ?? []).includes(permission)) {
                violations.push(`The "${jobName}" job must not hold \`${permission}: write\`.`);
            }
        }

        for (const step of steps) {
            if (step.uses === undefined) {
                continue;
            }

            if (!PINNED_ACTION.test(step.uses)) {
                violations.push(`The "${jobName}" job must pin ${step.uses} to a commit hash.`);
            }

            if (actionName(step.uses) === "actions/checkout" && step.with?.["persist-credentials"] !== false) {
                violations.push(`The "${jobName}" job must check out with \`persist-credentials: false\`.`);
            }
        }

        if (!granted.includes("id-token") && !granted.includes("write-all")) {
            continue;
        }

        for (const step of steps) {
            const isAllowed = step.uses !== undefined ? ALLOWED_PUBLISH_ACTIONS.has(actionName(step.uses)) : ALLOWED_PUBLISH_COMMANDS.has(step.run ?? "");

            if (!isAllowed) {
                violations.push(`The "${jobName}" job can request the npm publishing token and must not run the "${stepLabel(step)}" step.`);
            }

            if (step.uses !== undefined && actionName(step.uses) === PUBLISH_ACTION && step.with?.script !== undefined) {
                violations.push(`The "${jobName}" job must publish the packed tarballs, not run a \`script\`.`);
            }
        }
    }

    return violations;
}

// The workflow as it was before the publish job was isolated: one job installs, builds and publishes.
const SINGLE_JOB_WORKFLOW = `
name: Changesets
on:
  push:
    branches: ["main"]
jobs:
  version:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: write
      pull-requests: write
    steps:
      - name: Checkout
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          fetch-depth: 0
      - name: Install pnpm
        uses: pnpm/action-setup@73e46992e05b19abd31f2f3c20e0e7370d762115 # v6.1.1
      - name: Install Node.js
        uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile --ignore-scripts
      - name: Build packages
        run: pnpm build-pkg
      - name: Create release Pull Request or publish to NPM
        uses: changesets/action@ae32849d5ba541f9ae29e40e22a623bc13562f51 # v2.1.2
        with:
          publish-script: pnpm publish-pkg
`;

const LOOSENED_WORKFLOW = `
name: Changesets
permissions: {}
jobs:
  pack:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
  publish:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: write
      pull-requests: write
    steps:
      - name: Publish to NPM
        uses: changesets/action/publish@ae32849d5ba541f9ae29e40e22a623bc13562f51 # v2.1.2
        with:
          script: pnpm publish-pkg
`;

void describe("changeset.yml", () => {
    void it("only lets the publish job request the npm publishing token, and only to publish", () => {
        const workflowText = readFileSync(join(import.meta.dirname, "../workflows/changeset.yml"), "utf8");

        deepStrictEqual(findViolations(workflowText), []);
    });
});

void describe("findViolations", () => {
    void it("rejects a single job that installs, builds and publishes", () => {
        deepStrictEqual(findViolations(SINGLE_JOB_WORKFLOW), [
            "The workflow must reset the default permissions with a top-level `permissions: {}`.",
            'The "version" job must not hold `id-token: write`.',
            'The "version" job must check out with `persist-credentials: false`.',
            'The "version" job can request the npm publishing token and must not run the "Build packages" step.',
            'The "version" job can request the npm publishing token and must not run the "Create release Pull Request or publish to NPM" step.'
        ]);
    });

    void it("rejects a write permission, an unpinned action or a publish script added to the split jobs", () => {
        deepStrictEqual(findViolations(LOOSENED_WORKFLOW), [
            'The "pack" job must not hold `contents: write`.',
            'The "pack" job must pin actions/checkout@v7 to a commit hash.',
            'The "publish" job must not hold `pull-requests: write`.',
            'The "publish" job must publish the packed tarballs, not run a `script`.'
        ]);
    });
});
