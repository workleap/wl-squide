// Lists what `_update-skills` may install: for each vendored skill the commit it is pinned to and
// the commit it may move to, and the `skills` CLI version to run. Nothing younger than 7 days is
// offered, the kind of gate `minimumReleaseAge` puts on npm packages: a poisoned upstream change
// has a week to be noticed and reverted before this repo pulls it. DESIGN.md, beside the skill,
// tells what that does and doesn't cover.
//
//   node .claude/skills/_update-skills/scripts/listSkillPins.ts
//
// stdout is JSON: { cli, skills: [{ skill, source, pinned, latest, settled, problem }] }.
//
//   cli      the newest stable `skills` release published at least 7 days ago that the registry
//            still serves, hasn't deprecated and doesn't rank above its `latest` tag.
//   pinned   the `ref` of the skill's `skills-lock.json` entry.
//   settled  whether the skill's folder is the same at every position the source's default branch
//            is known to have held over the last 7 days: where it was 7 days ago, both ends of
//            every push since, and where the branch points now. A change that was reverted, or
//            bad content that was removed and pushed again, starts the 7 days over. Positions and
//            times come from the pushes GitHub recorded, never from a commit's own date, which its
//            author sets. Also false while the pushes on record don't reach back 7 days.
//   latest   the newest commit that changed the folder, null while `settled` is false. Its folder
//            is the one compared, so an install must name that folder, never the whole repo.
//   problem  why the skill can't be listed, null when it can: its source no longer looks the way
//            SOURCES records it, its folder is gone, gh failed. A human's to sort out; the other
//            skills are listed all the same.
//
// A skill named in NO_COOLDOWN has `pinned`, `latest` and `settled` all null.
//
//   node .claude/skills/_update-skills/scripts/listSkillPins.ts --verify <skill>
//
// After a pull. stdout is JSON: { skill, source, ref, verified, unlike }. `verified` tells whether
// every file installed for the skill is, byte for byte, a file of the skill's folder at the commit
// its lock entry now pins; `unlike` names those that aren't. The lock's `ref` is only what the CLI
// was asked for: this is what tells that it is also what the CLI fetched.
//
// Exit codes:
//   0  done
//   1  crashed: `skills-lock.json` or pnpm's answer couldn't be read
//   3  stopped, the reason on stderr: pnpm failed, no usable `skills` release that can pin a
//      commit, or `--verify` couldn't compare
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { join, posix, relative } from "node:path";

export interface LockEntry {
    source: string;
    sourceType: string;
    ref?: string;
    skillPath?: string;
}

export interface SkillsLock {
    skills: Record<string, LockEntry>;
}

// What this file records of a source: the repository GitHub must answer with, and its default branch.
export interface Source {
    id: number;
    branch: string;
}

// What GitHub answers for a source.
export interface Repository {
    id: number;
    fullName: string;
    defaultBranch: string;
}

interface Branch {
    head: string;
    // Every position the branch is known to have held over the last 7 days, undefined while the
    // pushes on record don't reach back 7 days.
    positions: string[] | undefined;
}

// The git object found at a path of each of the commits it is given, null where there is none.
export type Lookup = (commits: string[]) => (string | null)[];

// A push GitHub recorded: where it took the branch from and to, and when.
export interface Push {
    before: string;
    after: string;
    at: number;
}

// What the listing asks GitHub. The real one runs `gh`; the tests answer from memory.
export interface GitHub {
    repository: (source: string) => Repository;
    // The pushes recorded for a branch, newest first: the last one alone, or every one of a period.
    pushes: (source: string, branch: string, period?: "month" | "year") => Push[];
    // Where the branch points.
    ref: (source: string, branch: string) => string;
    // The git tree `folder` is at `commit`. It stops when there is none.
    folderTree: (source: string, commit: string, folder: string) => string;
    // The git object at `folder` of each of `commits`, null where there is none.
    folderTrees: (source: string, commits: string[], folder: string) => (string | null)[];
    // The newest commit reachable from `head` that changed `folder`.
    latestCommit: (source: string, head: string, folder: string) => string;
    // The git blob of every file under `folder` at `commit`, by its path inside the folder.
    files: (source: string, commit: string, folder: string) => Record<string, string>;
}

export interface ListedSkill {
    skill: string;
    source: string;
    pinned: string | null;
    latest: string | null;
    settled: boolean | null;
    problem: string | null;
}

const MIN_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const COMMIT_SHA = /^[0-9a-f]{40}$/;

// Positions looked up per GraphQL request. A busy source has held over 200 in a week.
const LOOKUPS_PER_REQUEST = 100;

// A year of pushes to a busy source is a third of a megabyte.
const MAX_OUTPUT_BYTES = 64 * 1024 * 1024;

const CALL_TIMEOUT_MS = 2 * 60 * 1000;

const STABLE_VERSION = /^\d+\.\d+\.\d+$/;

// Before it, `owner/repo@<commit>` installs the default branch.
const MIN_CLI_VERSION = "1.8.0";

const INSTALL_FOLDER = ".claude/skills";

// The repository each source is, by the id GitHub gave it, and its default branch.
//
// - A renamed or transferred source keeps answering under its old name until someone registers
//   that name again, and from then on a stranger's repository answers. The id tells both apart.
// - A source that switches its default branch can present content that sat a week on a branch
//   nobody watched, with no push to the new default on record.
//
// Either change is a human's to confirm. `gh api repos/<source> --jq ".id, .default_branch"`
// prints what to record.
const SOURCES: Record<string, Source> = {
    "addyosmani/web-quality-skills": { id: 1136782037, branch: "main" },
    "antfu/skills": { id: 1143952193, branch: "main" },
    "github/awesome-copilot": { id: 1000362065, branch: "main" },
    "vercel-labs/agent-browser": { id: 1132001614, branch: "main" },
    "vercel/turborepo": { id: 413918947, branch: "main" },
    "workleap/wl-web-configs": { id: 619993206, branch: "main" }
};

// Skills that don't come from a GitHub folder and so have no commit to pin or to wait on. Naming
// one here lists it with nothing to compare; SKILL.md tells how it is refreshed. Any other skill
// that isn't a GitHub folder is a problem.
const NO_COOLDOWN: string[] = [];

// A stop this file decided on. Inside the listing it becomes the `problem` of the skill it was
// raised for; anywhere else it unwinds to the bottom of the file, which turns it into exit code 3
// without `process.exit()`: called while a module is still evaluating, that one aborts on Windows
// instead of returning the code.
export class Stop extends Error {}

function stop(message: string): never {
    throw new Stop(message);
}

// A name GitHub answered, quoted, when it holds nothing but what a repository or branch name
// ordinarily does. A stop's message is printed by an agent and pasted into an issue, and those
// names are whatever a source's owner chose.
function printable(name: string) {
    return /^[\w./-]{1,100}$/.test(name) ? `"${name}"` : "a name this file won't print";
}

// What a command printed, cut short and without the characters a shell or a reader could take
// for more than text, for the same reason.
export function tame(text: string) {
    return text
        .replaceAll(/[^\w .,:;/()'=?&@#%+<>!*[\]-]/g, " ")
        .replaceAll(/\s+/g, " ")
        .trim()
        .slice(0, 300);
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
 * The publish times of the releases the registry offers: those it still serves, up to the one its
 * `latest` tag names.
 *
 * - The registry keeps the time of a release that was unpublished, which is what happens to a
 *   poisoned one: offered, it could not be installed.
 * - A release above `latest` is one its maintainers haven't put forward, or took back.
 */
export function servedReleases(publishedAt: Record<string, string>, served: string[], latest: string) {
    if (!STABLE_VERSION.test(latest)) {
        return {};
    }

    return Object.fromEntries(Object.entries(publishedAt).filter(([version]) => served.includes(version) && STABLE_VERSION.test(version) && compareVersions(version, latest) <= 0));
}

function pnpmView(what: string) {
    const result = spawnSync(`pnpm view ${what} --json`, { encoding: "utf8", shell: true, timeout: CALL_TIMEOUT_MS });

    if (result.status !== 0) {
        // pnpm prints its errors on stdout.
        return stop(`pnpm failed while reading ${what}: ${tame(result.error?.message ?? `${result.stderr} ${result.stdout}`)}`);
    }

    return result.stdout.trim();
}

/**
 * The newest release `pickCliVersion` accepts among those the registry offers, a deprecated one
 * skipped: past the registry's unpublish window, deprecating is how a maintainer flags a bad one.
 */
export function pickUsableCliVersion(publishedAt: Record<string, string>, served: string[], latest: string, now: Date, isDeprecated: (version: string) => boolean) {
    const candidates = servedReleases(publishedAt, served, latest);

    for (;;) {
        const version = pickCliVersion(candidates, now);

        if (!version || !isDeprecated(version)) {
            return version;
        }

        delete candidates[version];
    }
}

/**
 * What `pnpm view skills time versions dist-tags --json` answered: when each release was
 * published, which ones the registry serves, and the one its `latest` tag names. pnpm answers a
 * single version as text rather than as a list of one.
 */
export function parseCliAnswer(output: string) {
    const answer: { time?: Record<string, string>; versions?: string | string[]; "dist-tags"?: { latest?: unknown } } = JSON.parse(output);
    const latest = answer["dist-tags"]?.latest;

    return { publishedAt: answer.time ?? {}, served: [answer.versions ?? []].flat(), latest: typeof latest === "string" ? latest : "" };
}

function readCliVersion() {
    const { publishedAt, served, latest } = parseCliAnswer(pnpmView("skills time versions dist-tags"));

    // pnpm prints nothing for a release that isn't deprecated.
    return pickUsableCliVersion(publishedAt, served, latest, new Date(), version => pnpmView(`skills@${version} deprecated`) !== "") ?? stop(`no usable skills release: none from ${MIN_CLI_VERSION} up to the registry's "latest" is 7 days old, still served and not deprecated`);
}

function gh(args: string[], what: string, input?: string) {
    const result = spawnSync("gh", args, { encoding: "utf8", input, maxBuffer: MAX_OUTPUT_BYTES, timeout: CALL_TIMEOUT_MS });

    if (result.status !== 0) {
        return stop(`gh failed while ${what}: ${tame(result.error?.message ?? result.stderr)}`);
    }

    return result.stdout.trim();
}

function ghApi(path: string, fields: string[], jq: string, what: string, allPages = false) {
    return gh(["api", "--method", "GET", ...(allPages ? ["--paginate"] : []), path, ...fields.flatMap(field => ["-f", field]), "--jq", jq], what);
}

function lines(output: string) {
    return output
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);
}

/**
 * What GitHub answered for a source, from its `[id, full_name, default_branch]` line. Anything it
 * should have answered and didn't comes out as a value no source is recorded with.
 */
export function parseRepository(output: string): Repository {
    const [id, fullName, defaultBranch]: unknown[] = JSON.parse(output);

    return { id: typeof id === "number" ? id : Number.NaN, fullName: typeof fullName === "string" ? fullName : "", defaultBranch: typeof defaultBranch === "string" ? defaultBranch : "" };
}

/**
 * The pushes of a listing, from its `[before, after, timestamp]` lines. An end that isn't text
 * comes out empty and a time that can't be read as NaN: neither is ever taken for a commit or for
 * a push old enough.
 */
export function parsePushes(output: string): Push[] {
    return lines(output).map(line => {
        const [before, after, timestamp]: unknown[] = JSON.parse(line);

        return { before: typeof before === "string" ? before : "", after: typeof after === "string" ? after : "", at: typeof timestamp === "string" ? Date.parse(timestamp) : Number.NaN };
    });
}

function listPushes(source: string, branch: string, period?: "month" | "year") {
    const window = period ? [`time_period=${period}`, "per_page=100"] : ["per_page=1"];

    return parsePushes(ghApi(`repos/${source}/activity`, [`ref=refs/heads/${branch}`, "direction=desc", ...window], ".[] | [.before, .after, .timestamp] | tojson", `reading the pushes to ${source}`, period !== undefined));
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
 * - A push whose time can't be read counts as recent. So does one GitHub dates late, which it has
 *   been seen to do by an hour: both only add positions.
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

function readBranch(github: GitHub, source: string, sources: Record<string, Source>, now: Date): Branch {
    const recorded = Object.hasOwn(sources, source) ? sources[source] : undefined;

    // Before anything is asked of GitHub: `source` is whatever skills-lock.json holds.
    if (!recorded) {
        return stop(`${printable(source)} isn't in SOURCES — record its repository id and default branch there once you've confirmed it is where its skills should come from`);
    }

    const repository = github.repository(source);

    if (repository.id !== recorded.id || repository.fullName.toLowerCase() !== source.toLowerCase()) {
        return stop(
            `${source} now answers as ${printable(repository.fullName)}, repository ${Number.isSafeInteger(repository.id) ? repository.id : "unknown"}, and SOURCES records repository ${recorded.id} — it was renamed, moved or replaced. Find out which before changing skills-lock.json or SOURCES`
        );
    }

    if (repository.defaultBranch !== recorded.branch) {
        return stop(`${source}'s default branch is ${printable(repository.defaultBranch)} and SOURCES records "${recorded.branch}" — find out why before recording the new one`);
    }

    // The head is the last recorded push, not the branch ref: the record trails the ref by a second
    // or so, and read from the record alone the head and the positions before it can't disagree.
    const [last] = github.pushes(source, recorded.branch);

    if (!last || !COMMIT_SHA.test(last.after)) {
        return stop(`${source}: GitHub's push history has no usable last push for ${recorded.branch}, so the branch's last week can't be read`);
    }

    // A source with no push this week has held one position, its last push. Otherwise the month
    // holds a push old enough, or failing that the year.
    const listed = (period: "month" | "year") => readPositions(github.pushes(source, recorded.branch, period), now, last);
    const positions = readPositions([last], now, last) ?? listed("month") ?? listed("year");

    // Where the ref points is one more position. It is the head again, unless a push is too fresh
    // for the record or GitHub never recorded it: then what that push did to a folder still counts.
    const ref = github.ref(source, recorded.branch);

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
        lines(output).map(line => {
            const [alias = "", oid = ""] = line.split(" ");

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
    return parseLookup(gh(["api", "graphql", "--input", "-", "--jq", '.data.repository | to_entries[] | "\\(.key) \\(.value.oid // "")"'], `reading ${folder} of ${source} at ${commits.length} commits`, JSON.stringify({ query, variables: { owner, name } })), commits.length);
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

function latestCommit(github: GitHub, source: string, branch: Branch, folder: string, tree: string) {
    const sha = github.latestCommit(source, branch.head, folder);

    if (!COMMIT_SHA.test(sha)) {
        return stop(`gh answered no commit for the latest commit of ${source}/${folder}`);
    }

    return github.folderTree(source, sha, folder) === tree ? sha : stop(`${source}/${folder} at its latest commit ${sha} isn't the folder the branch head holds`);
}

/**
 * The folder a lock entry installs from, undefined unless the entry is a folder of a GitHub
 * repository: `skillPath` is the folder's SKILL.md, with nothing in it that leaves the repository
 * or names its root.
 */
export function skillFolder(entry: LockEntry) {
    const { skillPath } = entry;

    if (entry.sourceType !== "github" || typeof skillPath !== "string" || skillPath.includes("\\")) {
        return undefined;
    }

    const folder = posix.dirname(skillPath);

    return folder.split("/").every(part => part !== "" && part !== "." && part !== "..") ? folder : undefined;
}

// The `skills` of the listing: what each skill of the lock is pinned to and may move to.
export function listSkills(lock: SkillsLock, github: GitHub, now: Date, sources: Record<string, Source> = SOURCES, noCooldown: string[] = NO_COOLDOWN): ListedSkill[] {
    // A source is read once for all its skills, and so is what stopped it from being read.
    const branches = new Map<string, Branch | Stop>();

    function readOnce(source: string) {
        let branch = branches.get(source);

        if (!branch) {
            try {
                branch = readBranch(github, source, sources, now);
            } catch (error) {
                if (!(error instanceof Stop)) {
                    throw error;
                }

                branch = error;
            }

            branches.set(source, branch);
        }

        if (branch instanceof Stop) {
            throw branch;
        }

        return branch;
    }

    function list(entry: LockEntry) {
        const folder = skillFolder(entry);

        // The cooldown is measured on a folder's commit history.
        if (!folder) {
            return stop(`not recorded in skills-lock.json as a folder of a GitHub repository (sourceType ${JSON.stringify(entry.sourceType)}, skillPath ${JSON.stringify(entry.skillPath)}), so it has no cooldown`);
        }

        const branch = readOnce(entry.source);
        const tree = github.folderTree(entry.source, branch.head, folder);
        const settled =
            branch.positions !== undefined &&
            isUnchanged(
                branch.positions.filter(position => position !== branch.head),
                tree,
                commits => github.folderTrees(entry.source, commits, folder)
            );

        return { latest: settled ? latestCommit(github, entry.source, branch, folder, tree) : null, settled };
    }

    return Object.entries(lock.skills).map(([skill, entry]) => {
        // Never a way to switch the cooldown off for a skill that has one.
        if (entry.sourceType !== "github" && noCooldown.includes(skill)) {
            return { skill, source: entry.source, pinned: null, latest: null, settled: null, problem: null };
        }

        try {
            return { skill, source: entry.source, pinned: entry.ref ?? null, ...list(entry), problem: null };
        } catch (error) {
            if (!(error instanceof Stop)) {
                throw error;
            }

            return { skill, source: entry.source, pinned: entry.ref ?? null, latest: null, settled: false, problem: error.message };
        }
    });
}

/**
 * The files of a folder, from a recursive tree listing's lines: whether GitHub cut the listing
 * short, then a "<blob sha> <path>" line per file. Undefined for a listing that was cut short.
 */
export function parseFiles(output: string) {
    const [truncated, ...files] = lines(output);

    if (truncated !== "false") {
        return undefined;
    }

    return Object.fromEntries(
        files.map(line => {
            const cut = line.indexOf(" ");

            return [line.slice(cut + 1), line.slice(0, cut)] as const;
        })
    );
}

function listFiles(source: string, commit: string, folder: string) {
    const tree = folderTree(source, commit, folder);

    return (
        parseFiles(ghApi(`repos/${source}/git/trees/${tree}`, ["recursive=1"], '.truncated, (.tree[] | select(.type == "blob") | "\\(.sha) \\(.path)")', `listing the files of ${folder} of ${source} at ${commit}`)) ??
        stop(`${source}/${folder} at ${commit} holds more files than GitHub lists in one answer`)
    );
}

export function blobSha(content: Buffer) {
    return createHash("sha1").update(`blob ${content.length}\0`).update(content).digest("hex");
}

/**
 * Whether what is installed for a skill is what its source holds at the commit the lock pins.
 * `installed` gives, per file, the blob shas the file may match; a file its source doesn't hold
 * with one of them is named in `unlike`, when its name is one to print: those names are whatever
 * was installed. A skill with no file installed isn't verified.
 *
 * It goes one way only: the CLI leaves a few of a folder's files out of an install.
 */
export function verifySkill(lock: SkillsLock, github: GitHub, skill: string, installed: Record<string, string[]>) {
    const entry = Object.hasOwn(lock.skills, skill) ? lock.skills[skill] : undefined;
    const folder = entry && skillFolder(entry);

    if (!entry || !folder || !COMMIT_SHA.test(entry.ref ?? "")) {
        return stop(`${printable(skill)} has no skills-lock.json entry that pins a folder of a GitHub repository to a commit`);
    }

    const ref = entry.ref ?? "";
    const upstream = github.files(entry.source, ref, folder);
    const unlike = Object.entries(installed)
        .filter(([path, shas]) => !Object.hasOwn(upstream, path) || !shas.includes(upstream[path] ?? ""))
        .map(([path]) => (/^[\w./ -]{1,200}$/.test(path) ? path : "a file whose name this file won't print"))
        .toSorted();

    return { skill, source: entry.source, ref, verified: unlike.length === 0 && Object.keys(installed).length > 0, unlike };
}

// Everything under a folder that isn't itself a folder, links included and never followed.
function walk(folder: string): string[] {
    return readdirSync(folder, { withFileTypes: true }).flatMap(entry => (entry.isDirectory() ? walk(join(folder, entry.name)) : [join(folder, entry.name)]));
}

/**
 * What is installed for a skill: per file, by its path inside the skill's folder, its blob sha as
 * it is on disk and as git would store it from a checkout that turned its line endings into CRLF.
 *
 * - Anything that isn't a file, a link included, matches nothing.
 * - The folder itself must be a folder: a link to one would be read from wherever it leads.
 */
export function readInstalled(skill: string, installFolder = INSTALL_FOLDER) {
    if (!/^[\w-][\w.-]*$/.test(skill)) {
        return stop("a skill's name is letters, digits, dots, dashes and underscores");
    }

    const root = join(installFolder, skill);
    const paths =
        (() => {
            try {
                return lstatSync(root).isDirectory() ? walk(root) : undefined;
            } catch {
                return undefined;
            }
        })() ?? stop(`${skill} isn't installed as a folder of files in ${installFolder}`);

    return Object.fromEntries(
        paths.map(path => {
            const content = lstatSync(path).isFile() ? readFileSync(path) : undefined;

            return [relative(root, path).replaceAll("\\", "/"), content ? [blobSha(content), blobSha(Buffer.from(content.toString("latin1").replaceAll("\r\n", "\n"), "latin1"))] : []] as const;
        })
    );
}

const GITHUB: GitHub = {
    repository: source => parseRepository(ghApi(`repos/${source}`, [], "[.id, .full_name, .default_branch] | tojson", `reading what ${source} is`)),
    pushes: listPushes,
    ref: (source, branch) => ghApi(`repos/${source}/git/ref/heads/${branch}`, [], ".object.sha", `resolving the head of ${source}`),
    folderTree,
    folderTrees,
    latestCommit: (source, head, folder) => ghApi(`repos/${source}/commits`, [`sha=${head}`, `path=${folder}`, "per_page=1"], ".[0].sha", `resolving the latest commit of ${source}/${folder}`),
    files: listFiles
};

function readLock(): SkillsLock {
    return JSON.parse(readFileSync("skills-lock.json", "utf8"));
}

function run(args: string[]) {
    const [flag, skill] = args;

    if (flag === undefined) {
        return { cli: readCliVersion(), skills: listSkills(readLock(), GITHUB, new Date()) };
    }

    if (flag !== "--verify" || skill === undefined || args.length !== 2) {
        return stop("usage: listSkillPins.ts [--verify <skill>]");
    }

    const installed = readInstalled(skill);

    return verifySkill(readLock(), GITHUB, skill, installed);
}

if (import.meta.main) {
    try {
        console.log(JSON.stringify(run(process.argv.slice(2)), null, 4));
    } catch (error) {
        if (!(error instanceof Stop)) {
            throw error;
        }

        console.error(error.message);
        process.exitCode = 3;
    }
}
