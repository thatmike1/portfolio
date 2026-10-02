#!/usr/bin/env node
/**
 * reads the numbers the homepage states off the projects themselves and writes them to
 * src/lib/board-facts.json (plus the model map toy's points). run it by hand when a
 * number should move, look at the diff, commit it:
 *
 *   npm run facts                 # everything it can reach
 *   npm run facts -- tally radio  # only some sources
 *
 * sources: the public endpoints a visitor can open (the model map page, diskzokej's
 * /api/radio, font tinder's catalog, github's api for beadside's first issue) and
 * the local repos for git history (tally, the t3 fork). a source that can't be read
 * keeps its last value and says so, so a run on a machine without the repos still
 * refreshes the rest. every section carries the date it was read.
 */
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const OUT = join(ROOT, "src/lib/board-facts.json");
const MODEL_OUT = join(ROOT, "src/components/minis/model-map-points.json");

const REPOS = {
    tally: process.env.TALLY_REPO ?? join(homedir(), "git/tally"),
    t3: process.env.T3_REPO ?? join(homedir(), "git/t3code"),
};
/** the fork's shipping branch and the upstream it sits on */
const T3_BRANCH = process.env.T3_BRANCH ?? "release-feed";
const T3_UPSTREAM = process.env.T3_UPSTREAM ?? "origin/main";
/** whose commits count as mine in the fork; upstream work cherry-picked into it does not */
const ME = process.env.GIT_AUTHOR_MATCH ?? "michal.psencik";

const today = () => new Date().toISOString().slice(0, 10);
const git = (repo, ...args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" }).trim();

async function json(url) {
    const res = await fetch(url, { headers: { "user-agent": "thatmike1.dev facts script" } });
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    return res.json();
}

/** tally: commits per day from the first to the last, and whether anyone else wrote any */
function tally() {
    const repo = REPOS.tally;
    const lines = git(repo, "log", "--format=%ad|%an", "--date=short").split("\n").filter(Boolean);
    const dates = lines.map((l) => l.split("|")[0]).sort();
    const authors = new Set(lines.map((l) => l.split("|")[1]));
    const from = dates[0];
    const to = dates.at(-1);
    const span = Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;
    const days = Array.from({ length: span }, () => 0);
    for (const d of dates) days[Math.round((Date.parse(d) - Date.parse(from)) / 86_400_000)]++;
    return { readOn: today(), from, to, commits: dates.length, authors: authors.size, days };
}

/** the t3 fork: my commits on the shipping branch since it left upstream, and their lines */
function t3() {
    const repo = REPOS.t3;
    const base = git(repo, "merge-base", T3_BRANCH, T3_UPSTREAM);
    const range = `${base}..${T3_BRANCH}`;
    const mine = git(repo, "log", "--no-merges", `--author=${ME}`, "--format=%H", range)
        .split("\n")
        .filter(Boolean);
    const numstat = git(repo, "log", "--no-merges", `--author=${ME}`, "--numstat", "--format=", range);
    let added = 0;
    let removed = 0;
    const files = new Set();
    for (const row of numstat.split("\n")) {
        const [a, d, file] = row.split("\t");
        if (!file || a === "-") continue;
        added += Number(a);
        removed += Number(d);
        files.add(file);
    }
    const others = git(repo, "log", "--no-merges", "--format=%an", range)
        .split("\n")
        .filter((name) => name && !name.includes(ME)).length;
    return {
        readOn: today(),
        branch: T3_BRANCH,
        upstreamFrom: git(repo, "log", "-1", "--format=%cd", "--date=short", base),
        head: git(repo, "log", "-1", "--format=%cd", "--date=short", T3_BRANCH),
        commits: mine.length,
        added,
        removed,
        files: files.size,
        cherryPicked: others,
    };
}

/** diskzokej's public dial: stations per lane, in the dial's order from quiet to loud */
async function radio() {
    const data = await json("https://diskzokej.thatmike1.dev/api/radio");
    const lanes = data.lanes.map((lane) => ({
        lane: lane.name,
        note: lane.note,
        stations: data.stations.filter((s) => s.lane === lane.id).length,
    }));
    return { readOn: today(), stations: data.stations.length, lanes };
}

/** the model map page's own data: how many points, how many priced, the frontier */
async function models() {
    const res = await fetch("https://models.thatmike1.dev/");
    if (!res.ok) throw new Error(`models.thatmike1.dev: ${res.status}`);
    const html = await res.text();
    const start = html.indexOf("const P = ");
    const end = html.indexOf(";\n", start);
    if (start === -1 || end === -1) throw new Error("model map page: no data block");
    const P = JSON.parse(html.slice(start + "const P = ".length, end));
    const priced = P.rows.filter((r) => typeof r.cost === "number" && typeof r.ii === "number");
    const current = priced.filter((r) => r.tier === "current");
    const frontier = (rows) => {
        let best = -Infinity;
        let n = 0;
        for (const r of [...rows].sort((a, b) => a.cost - b.cost)) {
            if (r.ii > best) {
                best = r.ii;
                n++;
            }
        }
        return n;
    };
    // the page's own short label (the name before its parenthesis) and its effort words,
    // where "none" is shown as "off" and a model without a dial has no effort at all
    const points = current
        .map((r) => [
            r.name.split(" (")[0].trim(),
            r.creator,
            r.effort === "none" ? "off" : (r.effort ?? ""),
            r.ii,
            r.cost,
            Math.round(r.tokens / 100) / 10,
        ])
        .sort((a, b) => a[4] - b[4]);
    await writeFile(
        MODEL_OUT,
        `${JSON.stringify({ refreshed: P.generated, version: P.version, points }, null, 0)}\n`,
    );
    return {
        readOn: today(),
        version: P.version,
        refreshed: P.generated,
        points: P.rows.length,
        priced: priced.length,
        frontier: frontier(priced),
        current: current.length,
        currentFrontier: frontier(current),
    };
}

/** font tinder's catalog: how many families, and each deck's shape map squeezed onto a grid */
async function fonts() {
    const catalog = await json("https://fonts.thatmike1.dev/catalog.json");
    const cols = 47;
    const rows = 31;
    const decks = new Map();
    for (const family of catalog.families) {
        for (const [deck, [x, y]] of Object.entries(family.map ?? {})) {
            if (!decks.has(deck)) decks.set(deck, { fonts: 0, cells: new Map() });
            const entry = decks.get(deck);
            entry.fonts++;
            const key = `${Math.min(cols - 1, Math.floor(x * cols))},${Math.min(rows - 1, Math.floor(y * rows))}`;
            entry.cells.set(key, (entry.cells.get(key) ?? 0) + 1);
        }
    }
    const order = ["reading", "code", "headings"];
    const maps = [...decks.entries()]
        .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
        .map(([deck, { fonts, cells }]) => ({
            deck,
            fonts,
            cells: [...cells.entries()]
                .map(([key, n]) => [...key.split(",").map(Number), n])
                .sort((a, b) => a[0] - b[0] || a[1] - b[1])
                .flat(),
        }));
    return {
        readOn: today(),
        builtAt: catalog.builtAt.slice(0, 10),
        families: catalog.count,
        grid: { cols, rows },
        maps,
    };
}

/** beadside's first outside issue, as github shows it */
async function beadsideIssue() {
    const issue = await json("https://api.github.com/repos/thatmike1/beadside/issues/1");
    return {
        readOn: today(),
        number: issue.number,
        title: issue.title,
        state: issue.state,
        author: issue.user.login,
        opened: issue.created_at.slice(0, 10),
    };
}

const SOURCES = { tally, t3, radio, models, fonts, beadsideIssue };

async function main() {
    const wanted = process.argv.slice(2);
    const names = wanted.length ? wanted : Object.keys(SOURCES);
    const unknown = names.filter((n) => !(n in SOURCES));
    if (unknown.length) throw new Error(`unknown source: ${unknown.join(", ")}`);

    let facts = {};
    try {
        facts = JSON.parse(await readFile(OUT, "utf8"));
    } catch {
        // first run: nothing to keep
    }
    for (const name of names) {
        try {
            facts[name] = await SOURCES[name]();
            console.log(`${name.padEnd(14)} read`);
        } catch (error) {
            console.error(`${name.padEnd(14)} kept the last value (${error.message.split("\n")[0]})`);
        }
    }
    await writeFile(OUT, `${JSON.stringify(facts, null, 2)}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().catch((error) => {
        console.error(error.message);
        process.exit(1);
    });
}
