import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
    Shatter,
    supportsHtmlInCanvas,
    type ShatterOptions,
} from "../../components/canvasui/Shatter";
import "./fragile.css";

/**
 * fragile.
 *
 * a condensed replica of the front page — same row grammar, same names, same
 * lowercase — except the sheet it is printed on is glass. the pointer is the
 * only thing that breaks it: shards lift, tip, and refract the paragraph
 * underneath. everything under there is real dom, so it stays selectable and
 * clickable while it is in pieces.
 *
 * the page keeps the global theme tokens rather than redeclaring a palette, so
 * it reads as the real site in both light and dark. the only thing the theme
 * changes is the colour of the void behind a lifted shard.
 *
 * progressive enhancement twice over: html-in-canvas is unsupported in most
 * browsers, and anyone who asked for reduced motion gets the plain page too.
 * both paths render the same <Scene />, so the fallback is the design and not a
 * degraded copy of it.
 */

const TITLE = "fragile · lab · mike pšenčík";

export const Route = createFileRoute("/lab/fragile")({
    component: Page,
    head: () => ({
        meta: [{ title: TITLE }, { name: "robots", content: "noindex" }],
    }),
});

/** white paper: the void behind a lifted shard is the page it was printed on */
const GAP_LIGHT: [number, number, number] = [1, 1, 1];
/**
 * the dark theme's --bg, oklch(0.13 0.01 357), converted to the srgb 0-1 triple
 * the shader wants. it samples the page texture without any colour management,
 * so the gap has to be written in the same encoded space that texture is in.
 */
const GAP_DARK: [number, number, number] = [0.041, 0.023, 0.029];

/**
 * the break. tuned for glass rather than for a grid:
 * shards 0.75 so the cracks run at angles instead of along tile seams, a small
 * corner radius so lifted pieces read as chipped rather than milled, and a soft
 * 0.7 falloff so the fracture fades out instead of ending on a circle.
 *
 * baseStrength 0 is the whole conceit: the page rests intact and perfectly
 * readable, and only the cursor does damage. refraction 0.7 with a little
 * dispersion is what makes a shard read as glass rather than as a photograph of
 * one. anything not listed keeps the component's own default.
 */
function useShatterOptions(dark: boolean): ShatterOptions {
    return useMemo(
        () => ({
            radius: 0.28,
            softness: 0.7,
            tileSize: 88,
            shards: 0.75,
            corner: 2,
            lift: 26,
            tilt: 0.9,
            scatter: 10,
            perspective: 900,
            gapColor: dark ? GAP_DARK : GAP_LIGHT,
            shadow: 0.6,
            shading: 0.5,
            refraction: 0.7,
            dispersion: 0.08,
            floatSpeed: 0.4,
            strength: 1,
            baseStrength: 0,
        }),
        [dark],
    );
}

type Row = {
    name: string;
    tagline: string;
    stack: string;
    /** one sentence, lifted from the project's own paragraph on the front page */
    line: string;
    href?: string;
    note?: string;
};

/** four of the front page's projects, same names, taglines and stack strings */
const ROWS: Array<Row> = [
    {
        name: "ssscribe",
        tagline: "speak or paste anywhere, it's text everywhere",
        stack: "react 19 · tanstack · pocketbase · pwa · deepgram",
        line: "talk to my phone, paste from my laptop, and it all lands as text in one private feed that syncs to every device, copy-ready.",
        note: "private during the build · public at launch",
    },
    {
        name: "on-task",
        tagline: "a creature that knows when i've drifted",
        stack: "python · activitywatch · webgl2 · gtk3 · systemd · claude sonnet",
        line: "i declare what i'm working on and a little ink creature in the corner of my screen watches whether i actually do it.",
        note: "private repo · the site is public",
    },
    {
        name: "cc-bench",
        tagline: "does your CLAUDE.md actually do anything?",
        stack: "node 22 · zero deps · bwrap sandbox · paired stats · 160 tests",
        line: "it swaps the config, runs the same 48 prompts against a deliberately broken little repo, and counts what changed instead of asking a model whether the answer got better.",
        href: "https://github.com/thatmike1/cc-bench",
    },
    {
        name: "powder-lab",
        tagline: "a falling-sand sandbox",
        stack: "react · typescript · canvas · vitest",
        line: "paint with fourteen-ish materials and watch them fall, flow, burn, dissolve and react.",
        href: "https://github.com/thatmike1/powder-lab",
    },
];

const emptySubscribe = () => () => {};

/** null until mounted, so the server never guesses and the hint never lies */
function useCanvasSupport(): boolean | null {
    return useSyncExternalStore(
        emptySubscribe,
        () => supportsHtmlInCanvas(),
        () => null,
    );
}

function useReducedMotion(): boolean | null {
    return useSyncExternalStore(
        (notify) => {
            const query = window.matchMedia("(prefers-reduced-motion: reduce)");
            query.addEventListener("change", notify);
            return () => query.removeEventListener("change", notify);
        },
        () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        () => null,
    );
}

/**
 * read once at mount. a prototype does not need to follow a live theme swap, and
 * the gap colour only shows while something is actively broken anyway.
 */
function useDarkAtMount(): boolean {
    const [dark, setDark] = useState(false);
    useEffect(() => {
        setDark(document.documentElement.dataset.theme === "dark");
    }, []);
    return dark;
}

/** the page itself. identical in both paths: under the glass, or on its own */
function Scene() {
    return (
        <div className="fragile-scene">
            <p className="fragile-kicker">canvas-ui shatter · webgl2 · real dom, in pieces</p>
            <h1>handle with care</h1>
            <p className="fragile-lede">
                this is the front page, printed on glass. it's all still real text under there,
                careful where you point that cursor.
            </p>

            <ul className="fragile-rows">
                {ROWS.map((row) => (
                    <li className="fragile-row" key={row.name}>
                        <div className="fragile-row-head">
                            {row.href ? (
                                <a className="fragile-row-name" href={row.href}>
                                    {row.name}
                                    <span className="fragile-arrow" aria-hidden="true">
                                        {"↗"}
                                    </span>
                                </a>
                            ) : (
                                <span className="fragile-row-name fragile-row-name--static">
                                    {row.name}
                                </span>
                            )}
                            <p className="fragile-row-tagline">{row.tagline}</p>
                            <p className="fragile-row-stack">{row.stack}</p>
                            {row.note ? <p className="fragile-row-note">{row.note}</p> : null}
                        </div>
                        <p className="fragile-row-line">{row.line}</p>
                    </li>
                ))}
            </ul>

            <div className="fragile-foot">
                <p className="fragile-say">
                    say hi · <a href="mailto:misa.psencik@gmail.com">misa.psencik@gmail.com</a>
                </p>
                <p className="fragile-colophon">
                    prototype · not the shipped site ·{" "}
                    <Link to="/">the real one is printed on paper</Link>
                </p>
            </div>
        </div>
    );
}

function Page() {
    const supported = useCanvasSupport();
    const reduced = useReducedMotion();
    const dark = useDarkAtMount();
    const options = useShatterOptions(dark);
    const settled = supported !== null && reduced !== null;
    const live = supported === true && reduced === false;

    return (
        <main className={`fragile-page${live ? " is-live" : ""}`}>
            {/* outside the glass on purpose: the way out is the one thing that cannot break */}
            <p className="fragile-crumb">
                <Link to="/lab">← the lab</Link>
            </p>

            {live ? (
                <Shatter {...options} className="fragile-pane">
                    <Scene />
                </Shatter>
            ) : (
                <div className="fragile-pane fragile-pane--plain">
                    <Scene />
                </div>
            )}

            {settled ? (
                <p className={`fragile-hint${live ? " fragile-hint--pinned" : ""}`}>
                    {live
                        ? "it's glass. it was always going to crack."
                        : supported
                          ? "motion is off, so the glass holds. nothing breaks."
                          : "solid glass in this browser. nothing breaks."}
                </p>
            ) : null}
        </main>
    );
}
