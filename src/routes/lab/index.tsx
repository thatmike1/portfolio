import { createFileRoute, Link } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { supportsHtmlInCanvas } from "../../components/canvasui/Frost";
import "./lab.css";

const TITLE = "the lab · mike pšenčík";

export const Route = createFileRoute("/lab/")({
    component: Lab,
    head: () => ({
        meta: [{ title: TITLE }, { name: "robots", content: "noindex" }],
    }),
});

type Experiment = {
    slug: "dust" | "frost" | "fragile" | "redline";
    name: string;
    meta: string;
    body: string;
    /** needs the html-in-canvas origin trial / chrome flag for the full effect */
    canvas?: boolean;
};

const EXPERIMENTS: Array<Experiment> = [
    {
        slug: "dust",
        name: "dust",
        meta: "canvas-ui particle reveal · webgl2",
        body: "this site was always made of grains — this page admits it. everything renders as loose dust and only settles into real, selectable ui where your cursor is.",
        canvas: true,
    },
    {
        slug: "frost",
        name: "cold start",
        meta: "canvas-ui frost · webgl2",
        body: "the lights-off theme taken literally: the whole page behind a frozen pane. melt it with the pointer, watch it freeze back over behind you.",
        canvas: true,
    },
    {
        slug: "fragile",
        name: "fragile",
        meta: "canvas-ui shatter · webgl2",
        body: "the front page, but it's glass. tiles lift, tip and refract under the cursor. a portfolio you have to handle with care.",
        canvas: true,
    },
    {
        slug: "redline",
        name: "as built",
        meta: "hand-drawn svg + css · no canvas",
        body: "the portfolio as an as-built engineering drawing. dimension lines, title blocks, revision tables — and custody measured like a tolerance.",
    },
];

function useCanvasSupport(): boolean | null {
    return useSyncExternalStore(
        () => () => {},
        () => supportsHtmlInCanvas(),
        () => null,
    );
}

function Lab() {
    const supported = useCanvasSupport();

    return (
        <main className="lab">
            <header className="lab-head">
                <p className="lab-crumb">
                    <Link to="/">← the real site</Link>
                </p>
                <h1>the lab</h1>
                <p className="lab-lede">
                    design prototypes, not the portfolio. each one pushes the same identity —
                    raspberry, sand, lowercase — somewhere the front page doesn't go. built on{" "}
                    <a href="https://canvasui.dev" target="_blank" rel="noreferrer">
                        canvas ui↗
                    </a>{" "}
                    where marked: real html rendered into canvas, so the text under every effect
                    stays selectable.
                </p>
                {supported !== null && (
                    <p className="lab-support" data-ok={supported}>
                        {supported
                            ? "your browser paints html into canvas — full effects are on"
                            : "your browser can't paint html into canvas yet — the canvas pages fall back to plain html. chrome with the canvas-draw-element flag gets the full thing"}
                    </p>
                )}
            </header>

            <ul className="lab-list">
                {EXPERIMENTS.map((exp) => (
                    <li key={exp.slug} className="lab-row">
                        <div className="lab-row-name">
                            <Link to={`/lab/${exp.slug}`}>{exp.name}</Link>
                            <span className="lab-meta">
                                {exp.meta}
                                {exp.canvas ? " · degrades to html" : ""}
                            </span>
                        </div>
                        <p className="lab-row-body">{exp.body}</p>
                    </li>
                ))}
            </ul>

            <footer className="lab-foot">
                <p>
                    prototypes are sketches. the shipped site lives at{" "}
                    <Link to="/">the front page</Link>.
                </p>
            </footer>
        </main>
    );
}
