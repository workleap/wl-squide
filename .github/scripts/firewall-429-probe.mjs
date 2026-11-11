// One-off diagnostic, never merge. Replays the requests of a cold "pnpm install" against the GitHub
// package firewall, without retries, and reports every non-200 answer: which headers and body the 429s
// carry, how they differ from a 200, and how long the throttling lasts.

import { appendFileSync, readFileSync } from "node:fs";

const Registry = "https://package-firewall.githubapp.com/npm/enterprises/gsoft";
const Token = process.env.FIREWALL_TOKEN;
const Concurrency = Number(process.env.PROBE_CONCURRENCY ?? 64);
const Label = process.env.PROBE_LABEL ?? "probe";
const StartAt = Number(process.env.PROBE_START_AT ?? 0);

// Larger tarballs are acknowledged but not downloaded, the request count is what matters.
const MaxDownloadedBytes = 5 * 1024 * 1024;
const MaxSamples = 3;

const InterestingHeaders = [
    "server",
    "retry-after",
    "content-type",
    "content-length",
    "cache-control",
    "cf-cache-status",
    "cf-mitigated",
    "via",
    "x-github-backend",
    "x-github-edge-region",
    "x-ratelimit-limit",
    "x-ratelimit-remaining",
    "x-ratelimit-reset",
    "x-ratelimit-resource",
    "x-ratelimit-used"
];

const lines = [];

function log(line = "") {
    lines.push(line);
    console.log(line);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function readLockfileEntries() {
    const entries = [];
    let inPackages = false;

    for (const line of readFileSync("pnpm-lock.yaml", "utf8").split(/\r?\n/)) {
        if (/^\S/.test(line)) {
            inPackages = line.startsWith("packages:");
        } else if (inPackages) {
            const match = /^ {2}'?((?:@[^/']+\/)?[^@']+)@(\d+\.\d+\.\d+[^':]*)'?:\s*$/.exec(line);

            if (match) {
                entries.push({ name: match[1], version: match[2] });
            }
        }
    }

    return entries;
}

function createRequests(entries) {
    const tarballs = entries.map(({ name, version }) => ({
        kind: "tarball",
        url: `${Registry}/${name}/-/${name.split("/").pop()}-${version}.tgz`
    }));

    const metadata = [...new Set(entries.map(x => x.name))].map(name => ({
        kind: "metadata",
        url: `${Registry}/${name.replace("/", "%2f")}`
    }));

    // pnpm verifies the lockfile metadata while it downloads the tarballs, so both kinds are interleaved.
    const requests = [];

    for (let index = 0; index < tarballs.length; index += 1) {
        requests.push(tarballs[index]);

        if (index < metadata.length) {
            requests.push(metadata[index]);
        }
    }

    return requests;
}

async function send({ kind, url }) {
    const startedAt = Date.now();

    try {
        const response = await fetch(url, {
            headers: {
                authorization: `Bearer ${Token}`,
                accept: kind === "metadata" ? "application/vnd.npm.install-v1+json" : "*/*"
            }
        });

        const headers = Object.fromEntries([...response.headers].filter(([name]) => name !== "set-cookie"));
        let body = "";

        if (response.status !== 200) {
            body = (await response.text()).slice(0, 2000);
        } else if (Number(headers["content-length"] ?? 0) > MaxDownloadedBytes) {
            await response.body.cancel();
        } else {
            await response.arrayBuffer();
        }

        return { kind, url, status: String(response.status), startedAt, endedAt: Date.now(), headers, body };
    } catch (error) {
        const reason = error.cause?.code ?? error.cause?.message ?? error.message;

        return { kind, url, status: `error (${reason})`, startedAt, endedAt: Date.now(), headers: {}, body: "" };
    }
}

async function burst(requests) {
    const results = [];
    let next = 0;

    await Promise.all(
        Array.from({ length: Concurrency }, async () => {
            while (next < requests.length) {
                const request = requests[next];
                next += 1;

                results.push(await send(request));
            }
        })
    );

    return results;
}

function countBy(items, getKey) {
    const counts = new Map();

    for (const item of items) {
        const key = getKey(item);

        counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return [...counts].sort(([a], [b]) => String(a).localeCompare(String(b)));
}

function formatCounts(counts) {
    return counts.map(([key, count]) => `${key}: ${count}`).join(", ");
}

function time(timestamp) {
    return new Date(timestamp).toISOString().slice(11, 23);
}

function logSample(title, result) {
    log(`--- ${title}`);
    log(`${result.status} ${result.kind} ${result.url}`);
    log(`started ${time(result.startedAt)}, answered after ${result.endedAt - result.startedAt} ms`);

    for (const [name, value] of Object.entries(result.headers)) {
        log(`  ${name}: ${value}`);
    }

    if (result.body) {
        log("  body:");
        log(result.body.replace(/^/gm, "    "));
    }

    log();
}

function report(results, burstStartedAt) {
    const ok = results.filter(x => x.status === "200");
    const throttled = results.filter(x => x.status === "429");
    const duration = Math.max(...results.map(x => x.endedAt)) - burstStartedAt;

    log(`## Totals (${results.length} requests in ${(duration / 1000).toFixed(1)} s)`);

    for (const kind of ["tarball", "metadata"]) {
        log(
            `${kind}: ${formatCounts(
                countBy(
                    results.filter(x => x.kind === kind),
                    x => x.status
                )
            )}`
        );
    }

    log();
    log("## Answers per second");

    for (const [second, group] of Map.groupBy(results, x => Math.floor((x.endedAt - burstStartedAt) / 1000))) {
        log(`+${String(second).padStart(3, " ")} s (${time(burstStartedAt + second * 1000).slice(0, 8)})  ${formatCounts(countBy(group, x => x.status))}`);
    }

    log();

    const firstFailureIndex = results.findIndex(x => x.status !== "200");

    if (firstFailureIndex === -1) {
        log("## Every request was answered with a 200");
        log();

        return;
    }

    const firstFailure = results[firstFailureIndex];

    log("## First answer that is not a 200");
    log(`${firstFailure.status} at ${time(firstFailure.endedAt)}, +${firstFailure.endedAt - burstStartedAt} ms, after ${firstFailureIndex} answered requests`);
    log();

    for (const [status, group] of Map.groupBy(
        results.filter(x => x.status !== "200"),
        x => x.status
    )) {
        log(`## Header values on the ${status} answers (${group.length})`);

        for (const name of InterestingHeaders) {
            const values = countBy(
                group.filter(x => name in x.headers),
                x => x.headers[name]
            );

            if (values.length > 0) {
                log(`${name}: ${formatCounts(values.slice(0, 8))}${values.length > 8 ? `, ... (${values.length} distinct values)` : ""}`);
            }
        }

        log(`bodies: ${formatCounts(countBy(group, x => JSON.stringify(x.body.slice(0, 200))).slice(0, 5))}`);
        log();
    }

    if (throttled.length > 0 && ok.length > 0) {
        const okNames = new Set(ok.flatMap(x => Object.keys(x.headers)));
        const throttledNames = new Set(throttled.flatMap(x => Object.keys(x.headers)));

        log("## Header names, 429 against 200");
        log(`only on a 429: ${[...throttledNames.difference(okNames)].join(", ") || "(none)"}`);
        log(`only on a 200: ${[...okNames.difference(throttledNames)].join(", ") || "(none)"}`);
        log(`on both: ${[...okNames.intersection(throttledNames)].join(", ") || "(none)"}`);
        log();

        log("## Request ids of the first 429 answers");

        for (const result of throttled.slice(0, 10)) {
            log(`${time(result.endedAt)}  ${result.headers["x-github-request-id"] ?? "(no x-github-request-id)"}  ${result.url}`);
        }

        log();
    }

    log("## Samples");

    for (const kind of ["tarball", "metadata"]) {
        const sample = ok.find(x => x.kind === kind);

        if (sample) {
            logSample(`200 ${kind}`, sample);
        }
    }

    for (const [status, group] of Map.groupBy(
        results.filter(x => x.status !== "200"),
        x => x.status
    )) {
        group.slice(0, MaxSamples).forEach((x, index) => logSample(`${status} sample ${index + 1}`, x));
    }
}

// Tells how long the throttling lasts once the burst is over.
async function coolDown(request) {
    log("## Cool-down, the same tarball every 5 s");

    let consecutiveOk = 0;

    for (let attempt = 0; attempt < 36 && consecutiveOk < 3; attempt += 1) {
        const result = await send(request);
        const retryAfter = result.headers["retry-after"];

        consecutiveOk = result.status === "200" ? consecutiveOk + 1 : 0;

        log(`${time(result.endedAt)}  ${result.status}${retryAfter ? `  retry-after: ${retryAfter}` : ""}`);

        await sleep(5000);
    }

    log();
}

if (!Token) {
    throw new Error("FIREWALL_TOKEN is not set.");
}

const requests = createRequests(readLockfileEntries()).slice(0, Number(process.env.PROBE_LIMIT ?? Infinity));

if (StartAt > Date.now()) {
    console.log(`Waiting until ${new Date(StartAt).toISOString()} so every probe starts together.`);

    await sleep(StartAt - Date.now());
}

const burstStartedAt = Date.now();

log(`# Firewall 429 probe: ${Label}`);
log(`started ${new Date(burstStartedAt).toISOString()}, ${requests.length} requests, ${Concurrency} at a time, no retries, Node.js ${process.version}`);
log();

const results = await burst(requests);

report(results, burstStartedAt);

const throttledTarball = results.find(x => x.status === "429" && x.kind === "tarball") ?? results.find(x => x.status === "429");

if (throttledTarball) {
    await coolDown(throttledTarball);
}

if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\`\`\`text\n${lines.join("\n")}\n\`\`\`\n`);
}
