import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import "./redline.css";

/**
 * as built — the portfolio drawn as an engineering sheet.
 *
 * the front page has one credibility device: custody. it states how much of each
 * build was actually his, including the parts that weren't. this prototype takes
 * that device and makes it the whole aesthetic. projects become figures on a
 * drawing, custody becomes a dimension measured in commits, and raspberry stops
 * being brand colour and becomes redline ink: the pen an engineer only picks up to
 * mark what's wrong with the drawing.
 *
 * so the rule here is stricter than the rest of the site. every structural line is
 * ink. raspberry appears only where something wasn't his. the amount of raspberry
 * on the sheet is therefore not a design decision, it is a measurement.
 *
 * NUMBERS: every figure below is copied from src/components/experience-custody.tsx
 * and src/routes/index.tsx. nothing is estimated, rounded or derived. where a repo's
 * ratio is stated (449/552, 369/713) the dimension line is split at that ratio, so
 * the geometry cannot disagree with the caption. where only a commit floor is known
 * ("620+"), the line stays whole and the gap is a redline note instead. no figure
 * gets a share it cannot cite.
 *
 * no canvas, no webgl, no javascript past routing. html, css and svg, and it is
 * finished with scripting off.
 */

const TITLE = "as built · lab · mike pšenčík";

export const Route = createFileRoute("/lab/redline")({
    component: Page,
    head: () => ({
        meta: [{ title: TITLE }, { name: "robots", content: "noindex" }],
    }),
});

/** one annotated stack chip: the leader dot lands on `chip`, the note reads at the far end */
type Callout = { chip: string; note: string };

type Figure = {
    name: string;
    tagline: string;
    /** the real stack string from the source page, split on " · " into chips */
    stack: string;
    /** dimension text over the measured span */
    dim: string;
    /**
     * his measured share of the repo, as a percentage. ONLY set where the repo
     * source states a real ratio — it drives the geometry of the dimension line, so
     * an invented value would be a lie drawn to scale.
     */
    share?: number;
    /** the redline: what wasn't his, in his own words from the custody section */
    redline?: string;
    /** honest state of the thing, where the front page states one */
    note?: string;
    callouts: Array<Callout>;
};

/** figures 1 to 4: his own, from src/routes/index.tsx */
const OWN: Array<Figure> = [
    {
        name: "ssscribe",
        tagline: "speak or paste anywhere, it's text everywhere",
        stack: "react 19 · tanstack · pocketbase · pwa · deepgram",
        dim: "custody: 100% ± 0",
        note: "private during the build · public at launch",
        callouts: [
            { chip: "pocketbase", note: "realtime and storage, self-hosted on his own box" },
            { chip: "pwa", note: "installable, and it syncs to every device" },
        ],
    },
    {
        name: "on-task",
        tagline: "a creature that knows when i've drifted",
        stack: "python · activitywatch · webgl2 · gtk3 · systemd · claude sonnet",
        dim: "custody: 100% ± 0",
        note: "private repo · the site is public",
        callouts: [
            { chip: "activitywatch", note: "regexes over the buckets catch the obvious calls" },
            {
                chip: "claude sonnet",
                note: "asked only when the regexes genuinely can't tell, and it announces itself first",
            },
        ],
    },
    {
        name: "cc-bench",
        tagline: "does your CLAUDE.md actually do anything?",
        stack: "node 22 · zero deps · bwrap sandbox · paired stats · 160 tests",
        dim: "custody: 100% ± 0",
        note: "instrument built and tested · no findings yet",
        callouts: [
            { chip: "bwrap sandbox", note: "48 prompts against a deliberately broken little repo" },
            {
                chip: "paired stats",
                note: "counts what changed instead of asking a model whether it got better",
            },
        ],
    },
    {
        name: "powder-lab",
        tagline: "a falling-sand sandbox",
        stack: "react · typescript · canvas · vitest",
        dim: "custody: 100% ± 0",
        callouts: [
            { chip: "canvas", note: "an imperative core owns the pixels, so nothing re-renders" },
            { chip: "react", note: "owns the buttons, and only the buttons" },
        ],
    },
];

/** figures 5 to 8: paid work, from src/components/experience-custody.tsx. clients stay unnamed. */
const CONTRACT: Array<Figure> = [
    {
        name: "energy-management system",
        tagline: "internal ems · one of the largest czech energy groups",
        stack: "react · typescript · vite · mui · tanstack query · zustand · daypilot",
        dim: "custody: 449 of 552 commits · ~81%",
        share: 81,
        redline: "the backend, not mine.",
        callouts: [
            {
                chip: "daypilot",
                note: "the operations calendar: drag to move and resize, preview clamped at the grid edges",
            },
            {
                chip: "mui",
                note: "dashboard widgets and charts, down to the mobile tooltips and sticky table headers",
            },
        ],
    },
    {
        name: "customer-monitoring portal",
        tagline: "internal portal · the same energy group",
        stack: "react · typescript · vite · mui · tanstack query · zustand · azure msal",
        dim: "custody: 369 of 713 commits · ~51%",
        share: 51,
        redline: "the other half, not mine. this one was a team.",
        callouts: [
            {
                chip: "tanstack query",
                note: "server-side pagination, search, sorting and filtering across every table",
            },
            { chip: "mui", note: "one sort-and-filter popover, built once, reused everywhere" },
        ],
    },
    {
        name: "b2b room planner",
        tagline: "equipment placed in 2d and 3d",
        stack: "babylon.js · react · next.js · nestjs · gltf-transform · draco",
        dim: "custody: 620+ commits · largest single contributor",
        redline: "the rest of the platform, not mine. i owned the 3d.",
        callouts: [
            {
                chip: "babylon.js",
                note: "instancing, csg wall and window cutouts, and the 4 to 8 upgrade underneath",
            },
            {
                chip: "gltf-transform",
                note: "models shrunk on the upload endpoint, everything normalised to glb",
            },
        ],
    },
    {
        name: "career portal",
        tagline: "the largest czech pharmacy chain",
        stack: "next.js",
        dim: "custody: no commit count worth quoting",
        redline: "the design, the content, most of the rest, not mine.",
        note: "the smallest claim on the sheet, kept small on purpose",
        callouts: [{ chip: "next.js", note: "the cms wiring, and the plumbing around it" }],
    },
];

const REVISIONS = [
    { rev: "a", note: "first public issue", date: "2026-06" },
    { rev: "b", note: "showcase rework", date: "2026-07" },
    { rev: "c", note: "hire page", date: "2026-08" },
    { rev: "d", note: "the lab", date: "2026-08" },
];

const TITLE_BLOCK: Array<[string, string]> = [
    ["project", "portfolio of mike pšenčík"],
    ["drawn by", "mike"],
    ["checked by", "nobody (solo)"],
    ["scale", "1:1"],
    ["sheet", "1 of 1"],
    ["units", "commits"],
];

/**
 * the dimension line.
 *
 * one inline svg per figure, sized `width="100%" height="48"` with NO viewBox, so one
 * svg user unit is one css pixel at every column width. that is the whole trick:
 * horizontal positions come from percentages (svg resolves them against the viewport)
 * while stroke widths and the mono caption stay exactly the size they were set at. a
 * viewBox would scale the type with the column, which is how technical drawings stop
 * looking like technical drawings.
 *
 * three lines stacked: a faint ghost across the full span so the sheet reads as
 * finished before anyone hovers, the ink span for what was his, and, where a real
 * ratio exists, a dashed redline span for the remainder. the ink span carries
 * pathLength="100", which normalises stroke-dasharray to percent regardless of the
 * rendered width, so one dashoffset transition inks the dimension at any column size.
 */
function Dimension({ dim, share }: { dim: string; share?: number }) {
    const mine = share ?? 100;
    const split = `${mine}%`;

    return (
        <svg
            className="dim"
            width="100%"
            height="48"
            role="img"
            aria-label={share ? `${dim}. the remainder was not his.` : dim}
        >
            {/* the drawing as it stands before anyone inks it */}
            <line className="dim-ghost" x1="0" y1="30" x2="100%" y2="30" />

            {/* witness ticks: start, the split where one exists, and the end */}
            <line className="dim-tick" x1="0.5" y1="22" x2="0.5" y2="40" />
            {share ? <line className="dim-tick" x1={split} y1="22" x2={split} y2="40" /> : null}
            <line className="dim-tick" x1="100%" y1="22" x2="100%" y2="40" />

            <line
                className="dim-ink"
                pathLength="100"
                markerStart="url(#rl-arrow-l)"
                markerEnd="url(#rl-arrow-r)"
                x1="0"
                y1="30"
                x2={split}
                y2="30"
            />
            <text className="dim-text" x={`${mine / 2}%`} y="16" textAnchor="middle">
                {dim}
            </text>

            {share ? (
                <>
                    <line
                        className="dim-red"
                        pathLength="100"
                        markerStart="url(#rl-arrow-l-red)"
                        markerEnd="url(#rl-arrow-r-red)"
                        x1={split}
                        y1="30"
                        x2="100%"
                        y2="30"
                    />
                    <text
                        className="dim-text dim-text--red"
                        x={`${mine + (100 - mine) / 2}%`}
                        y="16"
                        textAnchor="middle"
                    >
                        not mine
                    </text>
                </>
            ) : null}
        </svg>
    );
}

function Fig({ fig, n }: { fig: Figure; n: number }) {
    const chips = fig.stack.split(" · ");
    const called = new Set(fig.callouts.map((c) => c.chip));

    // the redline note hangs under the span it is complaining about. where a real
    // ratio exists it starts at that ratio; css clamps it so a narrow column can't
    // shove it off the right edge.
    const redlineStyle = {
        "--redline-start": fig.share ? `${fig.share}%` : "100%",
    } as CSSProperties;

    return (
        <article className="fig">
            <h3 className="fig-title">
                <span className="fig-num">fig. {String(n).padStart(2, "0")} ·</span>{" "}
                <span className="fig-name">{fig.name}</span>
            </h3>
            <p className="fig-tagline">{fig.tagline}</p>

            <div className="fig-measure">
                <Dimension dim={fig.dim} share={fig.share} />
                {fig.redline ? (
                    <p className="fig-redline" style={redlineStyle}>
                        <svg className="leader leader--red" width="54" height="26" aria-hidden>
                            <circle className="leader-dot" cx="3.5" cy="3.5" r="2.5" />
                            <path className="leader-line" d="M3.5 3.5 L21 21 H53" />
                        </svg>
                        <span>{fig.redline}</span>
                    </p>
                ) : null}
            </div>

            <div className="fig-spec">
                <ul className="chips">
                    {chips.map((chip) => (
                        <li className={`chip${called.has(chip) ? " chip--called" : ""}`} key={chip}>
                            {chip}
                        </li>
                    ))}
                </ul>

                <ul className="callouts">
                    {fig.callouts.map((c) => (
                        <li className="callout" key={c.chip}>
                            <svg className="leader" width="34" height="18" aria-hidden>
                                <circle className="leader-dot" cx="2.5" cy="2.5" r="2.25" />
                                <path className="leader-line" d="M2.5 2.5 L13 14 H33" />
                            </svg>
                            <span className="callout-text">
                                <span className="callout-chip">{c.chip}</span> {c.note}
                            </span>
                        </li>
                    ))}
                </ul>

                {fig.note ? <p className="fig-note">{fig.note}</p> : null}
            </div>
        </article>
    );
}

function Page() {
    return (
        <main className="rl">
            {/* the paper. a nested pattern: hairlines at 24px, every fifth one heavier.
                inline svg rather than a data-uri because only inline svg can read the
                theme tokens, and the grid has to survive lights-off. */}
            <svg className="rl-grid" aria-hidden>
                <defs>
                    <pattern id="rl-fine" width="24" height="24" patternUnits="userSpaceOnUse">
                        <path className="grid-fine" d="M24 0 V24 M0 24 H24" />
                    </pattern>
                    <pattern id="rl-coarse" width="120" height="120" patternUnits="userSpaceOnUse">
                        <rect width="120" height="120" fill="url(#rl-fine)" />
                        <path className="grid-coarse" d="M120 0 V120 M0 120 H120" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#rl-coarse)" />
            </svg>

            {/* arrowheads are defined once and referenced by every dimension line. fills
                come from css so they follow the theme; markerUnits is user space, so they
                never scale with stroke-width. */}
            <svg className="rl-defs" aria-hidden>
                <defs>
                    <marker
                        id="rl-arrow-l"
                        markerUnits="userSpaceOnUse"
                        markerWidth="10"
                        markerHeight="8"
                        refX="0"
                        refY="4"
                    >
                        <path className="arrow" d="M0 4 L10 0.6 L10 7.4 z" />
                    </marker>
                    <marker
                        id="rl-arrow-r"
                        markerUnits="userSpaceOnUse"
                        markerWidth="10"
                        markerHeight="8"
                        refX="10"
                        refY="4"
                    >
                        <path className="arrow" d="M10 4 L0 0.6 L0 7.4 z" />
                    </marker>
                    <marker
                        id="rl-arrow-l-red"
                        markerUnits="userSpaceOnUse"
                        markerWidth="10"
                        markerHeight="8"
                        refX="0"
                        refY="4"
                    >
                        <path className="arrow arrow--red" d="M0 4 L10 0.6 L10 7.4 z" />
                    </marker>
                    <marker
                        id="rl-arrow-r-red"
                        markerUnits="userSpaceOnUse"
                        markerWidth="10"
                        markerHeight="8"
                        refX="10"
                        refY="4"
                    >
                        <path className="arrow arrow--red" d="M10 4 L0 0.6 L0 7.4 z" />
                    </marker>
                </defs>
            </svg>

            <div className="rl-sheet">
                <p className="rl-crumb">
                    <Link to="/lab">← the lab</Link>
                </p>

                <header className="sheet-head">
                    <div className="sheet-intro">
                        <h1>as built</h1>
                        <p className="sheet-lede">
                            the front page tells you what got built. this sheet measures it. every
                            figure is dimensioned in commits, the ink is the part i was holding, and
                            where the line turns raspberry somebody else was holding the rest.
                        </p>
                        <p className="sheet-legend">
                            ink · measured, and mine. redline · the correction, marking what wasn't.
                            hover a figure to ink its dimension.
                        </p>
                    </div>

                    <div className="sheet-blocks">
                        <table className="title-block">
                            <caption>title block</caption>
                            <tbody>
                                {TITLE_BLOCK.map(([key, value]) => (
                                    <tr key={key}>
                                        <th scope="row">{key}</th>
                                        <td>{value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <table className="rev-block">
                            <caption>revisions</caption>
                            <tbody>
                                {REVISIONS.map((r) => (
                                    <tr key={r.rev}>
                                        <th scope="row">rev {r.rev}</th>
                                        <td>{r.note}</td>
                                        <td className="rev-date">{r.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </header>

                <section className="sheet-section" aria-labelledby="rl-sec-a">
                    <h2 className="section-rule" id="rl-sec-a">
                        section a · figures 01 to 04 · nobody asked for these
                    </h2>
                    {OWN.map((fig, i) => (
                        <Fig key={fig.name} fig={fig} n={i + 1} />
                    ))}
                </section>

                <section className="sheet-section" aria-labelledby="rl-sec-b">
                    <h2 className="section-rule" id="rl-sec-b">
                        section b · figures 05 to 08 · drawn under contract, apr 2024 to aug 2026
                    </h2>
                    {CONTRACT.map((fig, i) => (
                        <Fig key={fig.name} fig={fig} n={i + 5} />
                    ))}
                </section>

                <footer className="notes">
                    <p className="notes-title">general notes</p>
                    <ol className="notes-list">
                        <li>all dimensions in commits unless noted.</li>
                        <li>lowercase throughout, per spec.</li>
                        <li>
                            say hi:{" "}
                            <a href="mailto:misa.psencik@gmail.com">misa.psencik@gmail.com</a>
                        </li>
                        <li>
                            this sheet is not to scale. commits are not a length. clients are not
                            named, that part is the contract's doing.
                        </li>
                    </ol>
                </footer>
            </div>
        </main>
    );
}
