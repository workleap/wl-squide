// Lists the open pull requests the update-dependencies workflow opened itself, for
// `.github/prompts/update-dependencies.md` to supersede.
//
//   node .github/scripts/listUpdateDependenciesPrs.ts
//
// stdout is JSON: [{ number, dependencies }].
//
//   number        an open pull request that the workflow's identity authored, from a branch of this
//                 repository named `agent/update-deps-*`. Opening one takes write access to this
//                 repository. A title or a body is whatever its author typed, on a fork included,
//                 so neither is read.
//   dependencies  whether the pull request changes a `package.json`, the test the prompt's Step 1
//                 uses for "dependency changes". False for a skills-only pull request.
//
// Exits non-zero when gh fails or answers something else than expected.
import { spawnSync } from "node:child_process";

export interface PullRequest {
    number: number;
    author: string;
    headRefName: string;
    isCrossRepository: boolean;
}

// The identity `anthropics/claude-code-action` gives the agent's gh and git.
const AUTHOR = "app/claude";
const BRANCH_PREFIX = "agent/update-deps-";

// Above what gh ever holds in memory for a listing or a pull request's files.
const MAX_OUTPUT_BYTES = 64 * 1024 * 1024;
const CALL_TIMEOUT_MS = 120_000;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

export function parsePullRequests(output: string): PullRequest[] {
    const answer: unknown = JSON.parse(output);

    if (!Array.isArray(answer)) {
        throw new Error("gh pr list didn't answer a list");
    }

    return answer.map((item: unknown) => {
        const author = isRecord(item) ? item.author : undefined;

        if (!isRecord(item) || !Number.isInteger(item.number) || !isRecord(author) || typeof author.login !== "string" || typeof item.headRefName !== "string" || typeof item.isCrossRepository !== "boolean") {
            throw new Error("gh pr list answered a pull request without the fields asked for");
        }

        return { number: item.number as number, author: author.login, headRefName: item.headRefName, isCrossRepository: item.isCrossRepository };
    });
}

export function selectOwn(pullRequests: PullRequest[]) {
    return pullRequests.filter(pullRequest => !pullRequest.isCrossRepository && pullRequest.author === AUTHOR && pullRequest.headRefName.startsWith(BRANCH_PREFIX));
}

export function carriesDependencies(paths: string[]) {
    return paths.some(path => path === "package.json" || path.endsWith("/package.json"));
}

function gh(args: string[]) {
    const result = spawnSync("gh", args, { encoding: "utf8", maxBuffer: MAX_OUTPUT_BYTES, timeout: CALL_TIMEOUT_MS });

    if (result.status !== 0) {
        throw new Error(`gh ${args.slice(0, 2).join(" ")} failed`);
    }

    return result.stdout;
}

function listFiles(number: number) {
    return gh(["api", `repos/{owner}/{repo}/pulls/${number}/files`, "--paginate", "--jq", ".[].filename"])
        .split("\n")
        .filter(path => path !== "");
}

if (import.meta.main) {
    const own = selectOwn(parsePullRequests(gh(["pr", "list", "--state", "open", "--limit", "1000", "--json", "number,author,headRefName,isCrossRepository"])));

    console.log(JSON.stringify(own.map(pullRequest => ({ number: pullRequest.number, dependencies: carriesDependencies(listFiles(pullRequest.number)) }))));
}
