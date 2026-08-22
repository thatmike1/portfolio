import { createFileRoute, Link } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { Frost, supportsHtmlInCanvas, type FrostOptions } from "../../components/canvasui/Frost";
import "./frost.css";

/**
 * cold start.
 *
 * the front page has a lights-off theme: near-black, luminous grains, a pixel moon.
 * this prototype takes that one step further and treats the whole page as a window
 * at night that has frozen over. the pointer melts a hole in the ice, the ice creeps
 * back over it while you read, and every word underneath stays real dom.
 *
 * the page is dark regardless of the saved theme — the palette is redeclared on
 * .frost-page rather than on :root, so nothing here leaks into the rest of the site.
 *
 * the effect is progressive enhancement twice over: html-in-canvas is unsupported in
 * most browsers, and anyone who asked for reduced motion gets the plain page too. both
 * paths render the same <Scene />, so the fallback is the design, not a degraded copy.
 */

const TITLE = "cold start · lab · mike pšenčík";

export const Route = createFileRoute("/lab/frost")({
    component: Page,
    head: () => ({
        meta: [{ title: TITLE }, { name: "robots", content: "noindex" }],
    }),
});

/**
 * the pane. tuned for reading rather than for showing off the shader:
 * a thin sheet (frost 0.12, low contrast) that never fully hides the text,
 * a small melt spot so the cursor reads as a fingertip rather than a floodlight,
 * and a very slow refreeze (0.06) so the ice takes its time coming back — a fast
 * refreeze turns a page into a fight. anything not listed keeps the component's
 * own default.
 *
 * the tints are the one place colour is not written in oklch: the shader wants
 * linear [r, g, b] triples. both are near-white cold neutrals with the blue channel
 * lifted a hair — the water hue (H250) whispered at the ice, never raspberry.
 * raspberry stays where it belongs on this page: the glow under the project names.
 */
const FROST: FrostOptions = {
    frost: 0.12,
    strength: 1.1,
    contrast: 1,
    crispness: 1.1,
    highlight: 0.35,
    haze: 0.25,
    tintThin: [0.86, 0.9, 0.99],
    tintThick: [0.94, 0.96, 1.02],
    tintStrength: 0.35,
    saturation: 0.9,
    refraction: 0.8,
    ior: 1.31,
    meltRadius: 0.16,
    meltNoise: 0.5,
    meltStrength: 0.8,
    refreeze: 0.06,
    edgeFade: 0.35,
    meltEdges: false,
    introDuration: 2,
    shimmer: 0.25,
    quality: 0.75,
};

type Row = {
    name: string;
    tagline: string;
    stack: string;
    /** the opening line of the project's own paragraph on the front page */
    line: string;
    href?: string;
    note?: string;
    live?: { href: string; label: string };
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
        live: { href: "https://ontask.ssscribe.app/", label: "it'll watch you read it" },
    },
    {
        name: "cc-bench",
        tagline: "does your CLAUDE.md actually do anything?",
        stack: "node 22 · zero deps · bwrap sandbox · paired stats · 160 tests",
        line: 'everyone writes a CLAUDE.md full of "be concise" and "don\'t hedge", and nobody knows if any of it lands.',
        href: "https://github.com/thatmike1/cc-bench",
        live: { href: "https://thatmike1.github.io/cc-bench/", label: "paste your config in" },
    },
    {
        name: "powder-lab",
        tagline: "a falling-sand sandbox",
        stack: "react · typescript · canvas · vitest",
        line: "paint with fourteen-ish materials and watch them fall, flow, burn, dissolve and react.",
        href: "https://github.com/thatmike1/powder-lab",
        live: { href: "https://thatmike1.github.io/powder-lab/", label: "play it" },
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

/** the page itself. identical in both paths: inside the ice, or on its own */
function Scene() {
    return (
        <div className="frost-scene">
            <p className="frost-kicker">canvas-ui frost · webgl2 · real dom under the ice</p>
            <h1>cold start</h1>
            <p className="frost-lede">
                the front page has a lights-off mode. this is what's outside the window.{" "}
                <em>hover to melt</em>, it freezes back while you read.
            </p>

            <ul className="frost-rows">
                {ROWS.map((row) => (
                    <li className="frost-row" key={row.name}>
                        <div className="frost-row-head">
                            {row.href ? (
                                <a className="frost-row-name" href={row.href}>
                                    {row.name}
                                </a>
                            ) : (
                                <span className="frost-row-name frost-row-name--static">
                                    {row.name}
                                </span>
                            )}
                            <p className="frost-row-tagline">{row.tagline}</p>
                            <p className="frost-row-stack">{row.stack}</p>
                        </div>
                        <div className="frost-row-body">
                            <p className="frost-row-line">{row.line}</p>
                            {row.live ? (
                                <p className="frost-row-live">
                                    <a href={row.live.href}>{row.live.label}</a>
                                </p>
                            ) : null}
                            {row.note ? <p className="frost-row-note">{row.note}</p> : null}
                        </div>
                    </li>
                ))}
            </ul>

            <div className="frost-foot">
                <p className="frost-say">
                    say hi. <a href="mailto:misa.psencik@gmail.com">misa.psencik@gmail.com</a> ·{" "}
                    <a href="https://github.com/thatmike1">github.com/thatmike1</a>
                </p>
                <p className="frost-colophon">
                    cold start, in both senses: the pane takes two seconds to freeze over on load,
                    and so does the engineer on a monday. everything under the ice is real dom, so
                    it stays selectable and clickable while it's frozen.
                    <br />
                    prototype · not the shipped site · <Link to="/">the real one is warmer</Link>
                </p>
            </div>
        </div>
    );
}

function Page() {
    const supported = useCanvasSupport();
    const reduced = useReducedMotion();
    const settled = supported !== null && reduced !== null;
    const live = supported === true && reduced === false;

    return (
        <main className={`frost-page${live ? " is-live" : ""}`}>
            {/* outside the pane on purpose: the way out never freezes over */}
            <p className="frost-crumb">
                <Link to="/lab">← the lab</Link>
            </p>

            {live ? (
                <Frost {...FROST} className="frost-pane">
                    <Scene />
                </Frost>
            ) : (
                <div className="frost-pane frost-pane--plain">
                    <Scene />
                </div>
            )}

            {settled ? (
                <p className={`frost-hint${live ? " frost-hint--pinned" : ""}`}>
                    {live
                        ? "breathe on it. hover melts, cold wins eventually."
                        : supported
                          ? "motion is off, so the frost is too. the window stays clear."
                          : "no frost in this browser. it's warm in here."}
                </p>
            ) : null}
        </main>
    );
}
