import { createFileRoute, Link } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import {
    ParticleReveal,
    supportsHtmlInCanvas,
    type ParticleRevealOptions,
} from "../../components/canvasui/ParticleReveal";
import "./dust.css";

/**
 * dust — the thesis, taken literally.
 *
 * the front page stamps "mike" in falling sand and then behaves itself: the sand is
 * a toy in a band at the top and the portfolio underneath is ordinary crisp html.
 * this page refuses the split. the whole thing is grains, and it only assembles into
 * readable ui inside the radius of the pointer. you read it by looking at it.
 *
 * the trick is that nothing here is a picture of a page. canvas ui paints the real
 * dom into a canvas, so every name is still a link, every line is still selectable
 * text, and a screen reader never sees the dust at all. the copy leans on that,
 * because it is the only genuinely interesting part.
 *
 * dark regardless of the saved theme: the grains are light, and light needs a dark
 * room. the palette is the dark block from styles.css, scoped to .dust-page.
 */

/**
 * must stay identical to --bg in dust.css. the shader compares every pixel against
 * this colour to decide what is ui and what is empty room, so a mismatch here paints
 * the whole background as dust and the page never settles.
 */
const PAGE_BG = "oklch(0.13 0.01 357)";

/**
 * the dial box. all of it in one place so tweaking is one object, not a hunt.
 *
 * radius/softness — how much of the page is legible at once, and how hard the edge of
 *   that window is. 340 is about a paragraph; softness 0.75 keeps the border a drift
 *   rather than a spotlight.
 * size/scatter/drift — the grain itself: 2px specks, wandering up to 28px from home,
 *   shimmering slowly. drift 0 would freeze the dust into a still texture.
 * aberration/bend — the lensing at the rim. deliberately low: the front page is a
 *   clean white desk, not a vaporwave poster, and this is the same brand at night.
 * fade/threshold — how bright the specks are against the bg, and how much contrast a
 *   pixel needs before it counts as ui at all. 0.08 keeps near-bg areas calm.
 * smoothing — seconds the window takes to catch the cursor. a little lag reads as weight.
 */
const DUST: ParticleRevealOptions = {
    radius: 340,
    softness: 0.75,
    size: 2,
    scatter: 28,
    drift: 0.8,
    aberration: 8,
    bend: 30,
    fade: 0.8,
    threshold: 0.08,
    smoothing: 0.3,
    background: PAGE_BG,
};

type Row = {
    name: string;
    tagline: string;
    stack: string;
    /** the two unreleased ones have no public repo, same as on the front page */
    code?: string;
};

/** names, taglines and stacks are the front page's, word for word. */
const ROWS: Array<Row> = [
    {
        name: "ssscribe",
        tagline: "speak or paste anywhere, it's text everywhere",
        stack: "react 19 · tanstack · pocketbase · pwa · deepgram",
    },
    {
        name: "on-task",
        tagline: "a creature that knows when i've drifted",
        stack: "python · activitywatch · webgl2 · gtk3 · systemd · claude sonnet",
    },
    {
        name: "cc-bench",
        tagline: "does your CLAUDE.md actually do anything?",
        stack: "node 22 · zero deps · bwrap sandbox · paired stats · 160 tests",
        code: "https://github.com/thatmike1/cc-bench",
    },
    {
        name: "powder-lab",
        tagline: "a falling-sand sandbox",
        stack: "react · typescript · canvas · vitest",
        code: "https://github.com/thatmike1/powder-lab",
    },
    {
        name: "claude-skills",
        tagline: "my claude code, customized",
        stack: "node · markdown · zero deps",
        code: "https://github.com/thatmike1/claude-skills",
    },
];

const noopSubscribe = () => () => {};

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeMotion(onChange: () => void) {
    const query = window.matchMedia(REDUCED_MOTION);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
}

/**
 * both checks default to "no effect" on the server and on the first client render, so
 * the html that ships is the settled page and hydration has nothing to argue with. the
 * effect only arrives on the store update after mount.
 *
 * the wrapper falls back on its own when html-in-canvas is missing, but reduced motion
 * is gated here instead: someone who asked for stillness should get the plain dom, not
 * a webgl context quietly holding a still frame of it.
 */
function useEffectLive(): boolean {
    const supported = useSyncExternalStore(noopSubscribe, supportsHtmlInCanvas, () => false);
    const reduced = useSyncExternalStore(
        subscribeMotion,
        () => window.matchMedia(REDUCED_MOTION).matches,
        () => false,
    );
    return supported && !reduced;
}

export const Route = createFileRoute("/lab/dust")({
    component: Page,
    head: () => ({
        meta: [{ title: "dust · lab · mike pšenčík" }, { name: "robots", content: "noindex" }],
    }),
});

/**
 * the page's whole content, written to stand up on its own: with the effect off this is
 * simply a dark one-screen portfolio, which is what most browsers will get.
 */
function DustContent() {
    return (
        <div className="dust-inner">
            <div className="container dust-body">
                <h1 className="dust-title">everything here is dust</h1>
                <p className="dust-lede">
                    this site was always made of grains. the front page just hides it better.
                    move your cursor, things settle.
                </p>
                <p className="dust-meta">
                    particle reveal · webgl2 · every word below is real text, so select it, click
                    it, hand it to a screen reader. only the look is powder.
                </p>

                <ul className="dust-rows">
                    {ROWS.map((row, index) => (
                        <li className="dust-row" key={row.name}>
                            <span className="dust-index" aria-hidden="true">
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            {row.code ? (
                                <a className="dust-name" href={row.code}>
                                    {row.name}
                                </a>
                            ) : (
                                <span className="dust-name dust-name--static">{row.name}</span>
                            )}
                            <p className="dust-tagline">{row.tagline}</p>
                            <p className="dust-stack">{row.stack}</p>
                        </li>
                    ))}
                </ul>

                <p className="dust-contact">
                    <a href="mailto:misa.psencik@gmail.com">misa.psencik@gmail.com</a>
                    <span className="dust-sep" aria-hidden="true">
                        ·
                    </span>
                    <a href="https://github.com/thatmike1">github.com/thatmike1</a>
                </p>
            </div>
        </div>
    );
}

function Page() {
    const live = useEffectLive();
    const content = <DustContent />;

    return (
        <main className="dust-page">
            {/* outside the effect on purpose: the way back is the one thing that never
                dissolves, so it stays crisp and clickable wherever the pointer is */}
            <p className="dust-crumb">
                <Link to="/lab">← the lab</Link>
            </p>

            {live ? (
                <ParticleReveal {...DUST} className="dust-stage dust-stage--live">
                    {content}
                </ParticleReveal>
            ) : (
                <div className="dust-stage">{content}</div>
            )}

            {/* the front page's "touch the sand", one room darker. it only makes a promise
                the page can keep: no effect, no instruction to move */}
            <p className="dust-hint">
                {live
                    ? "move. it settles where you look."
                    : "your browser shows this page already settled."}
            </p>
        </main>
    );
}
