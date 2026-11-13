// Lists what `_update-skills` may install: for each vendored skill the commit it is pinned to and
// the commit it may move to, and the `skills` CLI version to run. Nothing younger than 7 days is
// offered, the same cooldown `minimumReleaseAge` gives npm packages: a poisoned upstream change
// has a week to be noticed and reverted before this repo pulls it.
//
//   node .claude/skills/_update-skills/scripts/listSkillPins.ts
//
// stdout is JSON: { cli, skills: [{ skill, source, pinned, latest, settled }] }.
//
//   cli      the newest stable `skills` release published at least 7 days ago that the registry
//            still serves and hasn't deprecated.
//   pinned   the `ref` of the skill's `skills-lock.json` entry.
//   settled  whether the skill's folder is the same at every position the source's default branch
//            is known to have held over the last 7 days: where it was 7 days ago, both ends of
//            every push since, and where the branch points now. A change that was reverted, or
//            bad content that was removed and pushed again, starts the 7 days over. Positions and
//            times come from the pushes GitHub recorded and the time it received each, never from
//            a commit's own date, which its author sets. Also false while the pushes on record
//            don't reach back 7 days.
//   latest   the newest commit that changed the folder, null while `settled` is false. Its folder
//            is the one compared, so an install must name that folder, never the whole repo.
//
// Exit codes:
//   0  done
//   1  crashed: `skills-lock.json` or pnpm's answer couldn't be read
//   3  gh or pnpm failed, a source no longer looks the way this file records it, a skill doesn't
//      come from a GitHub folder, or no `skills` release that can pin a commit is 7 days old yet
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { posix } from "node:path";

interface LockEntry {
    source: string;
    sourceType: string;
    ref?: string;
    skillPath?: string;
}

interface SkillsLock {
    skills: Record<string, LockEntry>;
}

interface Branch {
    head: string;
    // Every position the branch is known to have held over the last 7 days, undefined while the
    // pushes on record don't reach back 7 days.
    positions: string[] | undefined;
}

// The git object found at a path of each of the commits it is given, null where there is none.
export type Lookup = (commits: string[]) => (string | null)[];

// A push GitHub recorded: where it took the branch from and to, and when GitHub received it.
export interface Push {
    before: string;
    after: string;
    at: number;
}

const MIN_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const COMMIT_SHA = /^[0-9a-f]{40}$/;

// Positions looked up per GraphQL request. A busy source has held over 200 in a week.
const LOOKUPS_PER_REQUEST = 100;

const STABLE_VERSION = /^\d+\.\d+\.\d+$/;

// Before it, `owner/repo@<commit>` installs the default branch.
const MIN_CLI_VERSION = "1.8.0";

// A source that switches its default branch can present content that sat a week on a branch nobody
// watched, with no push to the new default on record. A change here is a human's to confirm.
const DEFAULT_BRANCHES: Record<string, string> = {
    "addyosmani/web-quality-skills": "main",
    "antfu/skills": "main",
    "github/awesome-copilot": "main",
    "vercel-labs/agent-browser": "main",
    "vercel/turborepo": "main",
    "workleap/wl-web-configs": "main"
};

// A stop this file decided on. It unwinds to the bottom of the file, which turns it into exit code
// 3 without `process.exit()`: called while a module is still evaluating, that one aborts on Windows
// instead of returning the code.
class Stop extends Error {}

function stop(message: string): never {
    throw new Stop(message);
}

function compareVersions(a: string, b: string) {
    const [left, right] = [a, b].map(version => version.split(".").map(Number));

    return (left?.[0] ?? 0) - (right?.[0] ?? 0) || (left?.[1] ?? 0) - (right?.[1] ?? 0) || (left?.[2] ?? 0) - (right?.[2] ?? 0);
}

export function pickCliVersion(publishedAt: Record<string, string>, now: Date) {
    const cutoff = now.getTime() - MIN_AGE_MS;

    return Object.entries(publishedAt)
        .filter(([version, published]) => STABLE_VERSION.test(version) && Date.parse(published) <= cutoff && compareVersions(version, MIN_CLI_VERSION) >= 0)
        .map(([version]) => version)
        .toSorted(compareVersions)
        .at(-1);
}

/**
 * The publish times of the releases the registry still serves. It keeps the time of a release that
 * was unpublished, which is what happens to a poisoned one: offered, it could not be installed.
 */
export function servedReleases(publishedAt: Record<string, string>, served: string[]) {
    return Object.fromEntries(Object.entries(publishedAt).filter(([version]) => served.includes(version)));
}

function pnpmView(what: string) {
    const result = spawnSync(`pnpm view ${what} --json`, { encoding: "utf8", shell: true });

    if (result.status !== 0) {
        return stop(`pnpm failed while reading ${what}: ${result.error?.message ?? result.stderr.trim()}`);
    }

    return result.stdout.trim();
}

function readCliVersion() {
    const { time, versions }: { time: Record<string, string>; versions: string | string[] } = JSON.parse(pnpmView("skills time versions"));
    const publishedAt = servedReleases(time, [versions].flat());
    const now = new Date();

    // A deprecated release is skipped: past the registry's unpublish window, deprecating is how a
    // maintainer flags a bad one.
    for (;;) {
        const version = pickCliVersion(publishedAt, now);

        if (!version) {
            return stop(`no skills release from ${MIN_CLI_VERSION} up is 7 days old yet`);
        }

        if (pnpmView(`skills@${version} deprecated`) === "") {
            return version;
        }

        delete publishedAt[version];
    }
}

function ghApi(path: string, fields: string[], jq: string, what: string, allPages = false) {
    try {
        return execFileSync("gh", ["api", "--method", "GET", ...(allPages ? ["--paginate"] : []), path, ...fields.flatMap(field => ["-f", field]), "--jq", jq], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim();
    } catch (error) {
        return stop(`gh failed while ${what}: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// The pushes GitHub recorded for a branch, newest first: the last one alone, or every one of a period.
function listPushes(source: string, branch: string, period?: "month" | "year"): Push[] {
    const window = period ? [`time_period=${period}`, "per_page=100"] : ["per_page=1"];
    const lines = ghApi(`repos/${source}/activity`, [`ref=refs/heads/${branch}`, "direction=desc", ...window], ".[] | [.before, .after, .timestamp] | tojson", `reading the pushes to ${source}`, period !== undefined);

    return lines
        .split("\n")
        .filter(Boolean)
        .map(line => {
            const [before, after, timestamp]: unknown[] = JSON.parse(line);

            return { before: typeof before === "string" ? before : "", after: typeof after === "string" ? after : "", at: typeof timestamp === "string" ? Date.parse(timestamp) : Number.NaN };
        });
}

/**
 * Every position a branch is known to have held over the last 7 days, read from its recorded pushes:
 * where the newest push at least 7 days old left it, then both ends of every push since. Undefined
 * when no listed push is that old, or when the listing doesn't hold `last`, the push the head was
 * read from: a listing that misses it may miss others.
 *
 * - The end of an old push stands for "7 days ago", never the start of the first recent one: GitHub
 *   now and then fails to record a push, and the first recent push then starts from what the
 *   unrecorded one brought in, however young that is.
 * - Both ends of each recent push, for the same reason: the start of a push is the only trace of an
 *   unrecorded one before it.
 * - A push whose time can't be read counts as recent.
 */
export function readPositions(pushes: Push[], now: Date, last: Push) {
    if (!pushes.some(push => push.after === last.after && push.at === last.at)) {
        return undefined;
    }

    const cutoff = now.getTime() - MIN_AGE_MS;
    const weekAgo = pushes.filter(push => push.at <= cutoff).reduce<Push | undefined>((newest, push) => (newest && newest.at >= push.at ? newest : push), undefined);

    if (!weekAgo) {
        return undefined;
    }

    const recent = pushes.filter(push => !(push.at <= cutoff));

    return [...new Set([weekAgo.after, ...recent.flatMap(push => [push.before, push.after])])];
}

function readBranch(source: string): Branch {
    const name = ghApi(`repos/${source}`, [], ".default_branch", `resolving the default branch of ${source}`);

    if (!Object.hasOwn(DEFAULT_BRANCHES, source)) {
        return stop(`${source} isn't in DEFAULT_BRANCHES — record its default branch ("${name}") there once you've confirmed it is the branch its skills should follow`);
    }

    if (name !== DEFAULT_BRANCHES[source]) {
        return stop(`${source}'s default branch is "${name}" and DEFAULT_BRANCHES records "${DEFAULT_BRANCHES[source]}" — find out why before recording the new one`);
    }

    // The head is the last recorded push, not the branch ref: the record trails the ref by a second
    // or so, and read from the record alone the head and the positions before it can't disagree.
    const [last] = listPushes(source, name);

    if (!last || !COMMIT_SHA.test(last.after)) {
        return stop(`${source}: GitHub's push history has no usable last push for ${name} ("${last?.after ?? ""}"), so the branch's last week can't be read`);
    }

    // A source with no push this week has held one position, its last push. Otherwise the month
    // holds a push old enough, or failing that the year.
    const now = new Date();
    const listed = (period: "month" | "year") => readPositions(listPushes(source, name, period), now, last);
    const positions = readPositions([last], now, last) ?? listed("month") ?? listed("year");

    // Where the ref points is one more position. It is the head again, unless a push is too fresh
    // for the record or GitHub never recorded it: then what that push did to a folder still counts.
    const ref = ghApi(`repos/${source}/git/ref/heads/${name}`, [], ".object.sha", `resolving the head of ${source}`);

    return { head: last.after, positions: positions && [...new Set([...positions, ref])] };
}

function folderTree(source: string, commit: string, folder: string) {
    return ghApi(`repos/${source}/git/trees/${commit}:${folder}`, [], ".sha", `reading ${folder} of ${source} at ${commit}`);
}

/**
 * What a lookup answered for each of `count` positions, from its "p<index> <oid>" lines. Null for
 * a position with no line or no oid, whatever else the answer holds.
 */
export function parseLookup(output: string, count: number) {
    const found = new Map(
        output
            .split("\n")
            .filter(Boolean)
            .map(line => {
                const [alias = "", oid = ""] = line.trim().split(" ");

                return [alias, oid] as const;
            })
    );

    return Array.from({ length: count }, (_unused, index) => found.get(`p${index}`) || null);
}

// The git object at `folder` of each of `commits`, null where there is none.
function folderTrees(source: string, commits: string[], folder: string) {
    const [owner = "", name = ""] = source.split("/");
    const lookups = commits.map((commit, index) => `p${index}: object(expression: ${JSON.stringify(`${commit}:${folder}`)}) { oid }`);
    const query = `query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) { ${lookups.join(" ")} } }`;
    // The query goes in as a JSON body on stdin rather than on the command line.
    const result = spawnSync("gh", ["api", "graphql", "--input", "-", "--jq", '.data.repository | to_entries[] | "\\(.key) \\(.value.oid // "")"'], { encoding: "utf8", input: JSON.stringify({ query, variables: { owner, name } }) });

    if (result.status !== 0) {
        return stop(`gh failed reading ${folder} of ${source} at ${commits.length} commits: ${result.error?.message ?? result.stderr.trim()}`);
    }

    return parseLookup(result.stdout, commits.length);
}

/**
 * Whether `lookup` finds `tree` at every one of `positions`, asked `LOOKUPS_PER_REQUEST` at a time.
 *
 * A position that isn't a full commit sha is one where it doesn't: GitHub would resolve a short sha
 * or a branch name to some other commit.
 */
export function isUnchanged(positions: string[], tree: string, lookup: Lookup) {
    if (positions.some(position => !COMMIT_SHA.test(position))) {
        return false;
    }

    for (let start = 0; start < positions.length; start += LOOKUPS_PER_REQUEST) {
        if (lookup(positions.slice(start, start + LOOKUPS_PER_REQUEST)).some(found => found !== tree)) {
            return false;
        }
    }

    return true;
}

function latestCommit(source: string, branch: Branch, folder: string, tree: string) {
    const sha = ghApi(`repos/${source}/commits`, [`sha=${branch.head}`, `path=${folder}`, "per_page=1"], ".[0].sha", `resolving the latest commit of ${source}/${folder}`);

    if (!COMMIT_SHA.test(sha)) {
        return stop(`gh answered "${sha}" for the latest commit of ${source}/${folder}`);
    }

    return folderTree(source, sha, folder) === tree ? sha : stop(`${source}/${folder} at its latest commit ${sha} isn't the folder the branch head holds`);
}

function listSkillPins() {
    const cli = readCliVersion();
    const lock: SkillsLock = JSON.parse(readFileSync("skills-lock.json", "utf8"));
    const branches = new Map<string, Branch>();

    const skills = Object.entries(lock.skills).map(([skill, entry]) => {
        // The cooldown is measured on a folder's commit history: a source without one has to be
        // given its own rule here before it can be installed.
        if (entry.sourceType !== "github" || !entry.skillPath) {
            return stop(`${skill} isn't recorded in skills-lock.json as a folder of a GitHub repository (sourceType "${entry.sourceType}", skillPath ${JSON.stringify(entry.skillPath)}), so it has no cooldown`);
        }

        const branch = branches.get(entry.source) ?? readBranch(entry.source);
        branches.set(entry.source, branch);

        const folder = posix.dirname(entry.skillPath);
        const tree = folderTree(entry.source, branch.head, folder);
        const settled =
            branch.positions !== undefined &&
            isUnchanged(
                branch.positions.filter(position => position !== branch.head),
                tree,
                commits => folderTrees(entry.source, commits, folder)
            );

        return { skill, source: entry.source, pinned: entry.ref ?? null, latest: settled ? latestCommit(entry.source, branch, folder, tree) : null, settled };
    });

    return { cli, skills };
}

if (import.meta.main) {
    try {
        console.log(JSON.stringify(listSkillPins(), null, 4));
    } catch (error) {
        if (!(error instanceof Stop)) {
            throw error;
        }

        console.error(error.message);
        process.exitCode = 3;
    }
}
