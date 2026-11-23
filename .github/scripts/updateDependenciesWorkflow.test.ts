// node --test .github/scripts/updateDependenciesWorkflow.test.ts
//
// Guards the split of .github/workflows/update-dependencies.yml: the job that resolves the new
// dependency versions never installs or runs them and cannot write, and the job that can write
// runs nothing but git and gh. See agent-docs/references/ci-cd.md.
import { deepStrictEqual, notDeepStrictEqual } from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { parse } from "yaml";

interface Step {
    name?: string;
    uses?: string;
    run?: string;
    with?: Record<string, unknown>;
    env?: Record<string, unknown>;
}

interface Job {
    permissions?: Record<string, string> | string;
    env?: Record<string, unknown>;
    steps?: Step[];
}

interface Workflow {
    permissions?: Record<string, string> | string;
    env?: Record<string, unknown>;
    jobs: Record<string, Job>;
}

const WORKFLOW_PATH = ".github/workflows/update-dependencies.yml";

const RESOLVE_JOB = "resolve";
const OPEN_PR_JOB = "open-pr";

const ALLOWED_ACTIONS: Record<string, string[]> = {
    [RESOLVE_JOB]: ["actions/checkout", "pnpm/action-setup", "actions/setup-node", "actions/upload-artifact"],
    [OPEN_PR_JOB]: ["actions/checkout", "actions/download-artifact"]
};

// A pnpm command at the start of a command, not the word in a message.
const PNPM_COMMAND = /(?:^|\$\(|[|;&])\s*pnpm\s/;
// What keeps a pnpm command from installing a version this run resolved.
const INSTALLS_NOTHING_NEW = /--frozen-lockfile|--lockfile-only|--version/;
// What would make the job that can write run a package manager, a runtime or a file.
const RUNS_CODE = /\b(?:pnpm|pnpx|npm|npx|yarn|corepack|node|bun|bunx|deno|python3?|make|bash|sh|source|eval)\b|(?:^|\s)\.{1,2}\//;

// A GitHub Actions expression, written so that no string here looks like a template literal.
function expression(value: string) {
    return "$".concat(`{{ ${value} }}`);
}

function actionName(uses: string) {
    return uses.split("@")[0]!;
}

function stepLabel(step: Step) {
    return step.name ?? step.uses ?? "unnamed";
}

function isReadOnly(permissions: Job["permissions"]) {
    return typeof permissions === "object" && permissions !== null && Object.values(permissions).every(access => access === "read" || access === "none");
}

function listStrings(value: unknown): string[] {
    if (typeof value === "string") {
        return [value];
    }

    if (typeof value === "object" && value !== null) {
        return Object.values(value).flatMap(listStrings);
    }

    return [];
}

function runLines(step: Step) {
    return (step.run ?? "").split(/\r?\n/);
}

export function findViolations(workflow: Workflow) {
    const violations: string[] = [];
    const strings = listStrings(workflow);

    if (typeof workflow.permissions !== "object" || workflow.permissions === null || Object.keys(workflow.permissions).length > 0) {
        violations.push("The workflow must reset the default permissions with a top-level `permissions: {}`.");
    }

    if (workflow.env) {
        violations.push("The workflow must not set a workflow-level `env`: every job would receive it.");
    }

    if (strings.some(text => /\bsecrets\b/i.test(text))) {
        violations.push("The workflow must not reference a secret.");
    }

    for (const [jobName, job] of Object.entries(workflow.jobs)) {
        const steps = job.steps ?? [];

        if (typeof job.permissions === "object" && job.permissions !== null && "id-token" in job.permissions) {
            violations.push(`${jobName}: no job may hold the \`id-token\` permission.`);
        }

        if (jobName !== OPEN_PR_JOB && !isReadOnly(job.permissions)) {
            violations.push(`${jobName}: only the ${OPEN_PR_JOB} job may hold a write permission.`);
        }

        for (const step of steps) {
            if (step.uses && !(ALLOWED_ACTIONS[jobName] ?? []).includes(actionName(step.uses))) {
                violations.push(`${jobName}: the "${stepLabel(step)}" step uses ${actionName(step.uses)}, which this job may not use.`);
            }

            if (step.run?.includes("${{")) {
                violations.push(`${jobName}: the "${stepLabel(step)}" step puts an expression in its script. Pass the value through \`env\`.`);
            }
        }
    }

    const resolve = workflow.jobs[RESOLVE_JOB];
    if (!resolve) {
        violations.push(`The workflow must have a ${RESOLVE_JOB} job.`);
    } else {
        if (listStrings({ env: resolve.env, steps: resolve.steps }).some(text => /github\.token|GITHUB_TOKEN/i.test(text))) {
            violations.push(`${RESOLVE_JOB}: the job must not hand the job token to a step.`);
        }

        for (const step of resolve.steps ?? []) {
            const action = step.uses ? actionName(step.uses) : undefined;

            if (action === "actions/checkout" && step.with?.["persist-credentials"] !== false) {
                violations.push(`${RESOLVE_JOB}: the checkout must set \`persist-credentials: false\`.`);
            }

            if (action === "pnpm/action-setup" && step.with?.["run_install"] !== false) {
                violations.push(`${RESOLVE_JOB}: pnpm/action-setup must set \`run_install: false\`.`);
            }

            if (action === "actions/setup-node" && step.with && "cache" in step.with) {
                violations.push(`${RESOLVE_JOB}: the Node setup must not restore a cache.`);
            }

            for (const line of runLines(step)) {
                if (PNPM_COMMAND.test(line) && !INSTALLS_NOTHING_NEW.test(line)) {
                    violations.push(`${RESOLVE_JOB}: \`${line.trim()}\` can install the versions this run resolved. Only --frozen-lockfile and --lockfile-only commands are allowed.`);
                }
            }
        }
    }

    const openPr = workflow.jobs[OPEN_PR_JOB];
    if (!openPr) {
        violations.push(`The workflow must have an ${OPEN_PR_JOB} job.`);
    } else {
        for (const step of openPr.steps ?? []) {
            const action = step.uses ? actionName(step.uses) : undefined;

            if (action === "actions/download-artifact" && !String(step.with?.["path"] ?? "").startsWith(expression("runner.temp"))) {
                violations.push(`${OPEN_PR_JOB}: the artifact must be downloaded under \`runner.temp\`, outside the checkout.`);
            }

            for (const line of runLines(step)) {
                if (RUNS_CODE.test(line)) {
                    violations.push(`${OPEN_PR_JOB}: \`${line.trim()}\` runs something other than git and gh in the job that can write.`);
                }

                if (/\bgit\b.*\bcommit\b/.test(line) && !line.includes("core.hooksPath=/dev/null")) {
                    violations.push(`${OPEN_PR_JOB}: the commit must disable the git hooks with \`-c core.hooksPath=/dev/null\`.`);
                }
            }
        }
    }

    return violations;
}

function readWorkflow() {
    return parse(readFileSync(WORKFLOW_PATH, "utf8")) as Workflow;
}

function findStep(workflow: Workflow, jobName: string, name: string) {
    const found = workflow.jobs[jobName]!.steps!.find(candidate => candidate.name === name);
    if (!found) {
        throw new Error(`No "${name}" step in the ${jobName} job.`);
    }

    return found;
}

describe("update-dependencies.yml", () => {
    it("keeps the resolve job read-only and the open-pr job free of code", () => {
        deepStrictEqual(findViolations(readWorkflow()), []);
    });

    const breakingChanges: Record<string, (workflow: Workflow) => void> = {
        "default permissions that are not reset": workflow => {
            delete workflow.permissions;
        },
        "a workflow-level env": workflow => {
            workflow.env = { CI: true };
        },
        "a secret": workflow => {
            findStep(workflow, RESOLVE_JOB, "Install dependencies").env = { TOKEN: expression("Secrets.NPM_TOKEN") };
        },
        "the id-token permission": workflow => {
            workflow.jobs[OPEN_PR_JOB]!.permissions = { contents: "write", "id-token": "write" };
        },
        "a write permission on the resolve job": workflow => {
            workflow.jobs[RESOLVE_JOB]!.permissions = { contents: "write" };
        },
        "the job token in the resolve job": workflow => {
            findStep(workflow, RESOLVE_JOB, "Install dependencies").env = { GH_TOKEN: expression("github.token") };
        },
        "a checkout that keeps its credentials in the resolve job": workflow => {
            delete findStep(workflow, RESOLVE_JOB, "Checkout").with;
        },
        "a pnpm cache in the resolve job": workflow => {
            findStep(workflow, RESOLVE_JOB, "Install Node.js").with!["cache"] = "pnpm";
        },
        "an agent in the resolve job": workflow => {
            workflow.jobs[RESOLVE_JOB]!.steps!.push({ name: "Fix", uses: "anthropics/claude-code-action@f3b070c88125d33dbae5653df5f143101d4ea9dc" });
        },
        "an install of the resolved versions": workflow => {
            findStep(workflow, RESOLVE_JOB, "Sync the lockfile").run = "pnpm install --no-frozen-lockfile";
        },
        "a package script run after the resolution": workflow => {
            findStep(workflow, RESOLVE_JOB, "Align the peer dependency ranges").run = "pnpm run update-outdated-deps:update-peers";
        },
        "a repository script in the open-pr job": workflow => {
            workflow.jobs[OPEN_PR_JOB]!.steps!.push({ name: "Summarize", run: "node .github/scripts/summarizeDependencyChanges.ts" });
        },
        "an action other than checkout and download in the open-pr job": workflow => {
            workflow.jobs[OPEN_PR_JOB]!.steps!.push({ name: "Install pnpm", uses: "pnpm/action-setup@73e46992e05b19abd31f2f3c20e0e7370d762115" });
        },
        "an artifact downloaded into the checkout": workflow => {
            findStep(workflow, OPEN_PR_JOB, "Download the update").with!["path"] = "update";
        },
        "a commit that runs the git hooks": workflow => {
            findStep(workflow, OPEN_PR_JOB, "Push the branch").run = 'git commit -m "chore: update dependencies"';
        },
        "an expression in a script": workflow => {
            findStep(workflow, OPEN_PR_JOB, "Push the branch").run = `git push origin "agent/update-deps-${expression("github.run_id")}"`;
        }
    };

    for (const [change, apply] of Object.entries(breakingChanges)) {
        it(`rejects ${change}`, () => {
            const workflow = readWorkflow();
            apply(workflow);

            notDeepStrictEqual(findViolations(workflow), []);
        });
    }
});
