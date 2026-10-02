import type { ReactNode } from "react";
import { SHOWCASE } from "../lib/showcase";
import type { Line, Reach, ShowcaseProject } from "../lib/showcase";
import { useLightbox } from "./lightbox";
import { CommitPiles, DiffGrains, FontMaps, ModelScatter, RadioDial } from "./pixel-charts";
import "./board.css";

const byId = (id: string): ShowcaseProject => {
    const project = SHOWCASE.find((p) => p.id === id);
    if (!project) throw new Error(`no showcase project ${id}`);
    return project;
};

/**
 * beadside's fact is a thing, not a number: the first issue anyone else opened on
 * it, quoted as github shows it
 */
function IssueOne() {
    return (
        <figure className="issue">
            <figcaption className="issue-meta">
                <a href="https://github.com/thatmike1/beadside/issues/1">thatmike1/beadside #1</a>
                <span>closed</span>
            </figcaption>
            <p className="issue-title">
                Beads 1.3.0 adds a change feed (<code>bd events</code>) and an HTTP API (
                <code>bd serve</code>)
            </p>
        </figure>
    );
}

/** the chart that goes with each project's fact; the ones without a number to draw get none */
const CHARTS: Record<string, ReactNode> = {
    beadside: <IssueOne />,
    tally: <CommitPiles repo="tally" />,
    "model-map": <ModelScatter />,
    "t3-code": <DiffGrains />,
    "font-tinder": <FontMaps />,
    diskzokej: <RadioDial />,
};

const REACH: Record<Reach, string> = {
    live: "open it",
    source: "run the repo",
    private: "stays at home",
};

export function Marked({ line }: { line: Line }) {
    return (
        <>
            {line.lead}
            <em>{line.mark}</em>
            {line.tail}
        </>
    );
}

/** a screenshot that opens in the page's viewer, or as the plain file without javascript */
export function Shot({
    image,
    className = "",
    eager = false,
}: {
    image: ShowcaseProject["image"];
    className?: string;
    eager?: boolean;
}) {
    const openShot = useLightbox();
    return (
        <figure className={`shot ${className}`}>
            <a
                href={image.src}
                className="shot-frame"
                onClick={(event) => {
                    if (!openShot || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                    event.preventDefault();
                    openShot(image);
                }}
            >
                <img
                    src={image.src}
                    width={image.width}
                    height={image.height}
                    alt={image.alt}
                    loading={eager ? "eager" : "lazy"}
                    decoding="async"
                />
                <span className="shot-enlarge">enlarge</span>
            </a>
            <figcaption>{image.caption}</figcaption>
        </figure>
    );
}

type Variant = "wide" | "half";

/** one project on the board: a name, its story in a sentence, the real screen, one true fact */
function Tile({
    project,
    variant,
    mirror = false,
    eager = false,
}: {
    project: ShowcaseProject;
    variant: Variant;
    mirror?: boolean;
    eager?: boolean;
}) {
    const chart = CHARTS[project.id];
    return (
        <article
            className={`tile tile--${variant}${mirror ? " tile--mirror" : ""}`}
            id={project.id}
            aria-labelledby={`name-${project.id}`}
        >
            <header className="tile-head">
                <h3 className="tile-name" id={`name-${project.id}`}>
                    <span>{project.name}</span>
                    <span className={`tile-reach tile-reach--${project.reach}`}>{REACH[project.reach]}</span>
                </h3>
                <p className="tile-line">
                    <Marked line={project.line} />
                </p>
            </header>
            <Shot image={project.image} className="tile-shot" eager={eager} />
            <p className="tile-detail">{project.detail}</p>
            <div className="tile-fact">
                {chart}
                <p>{project.fact}</p>
            </div>
            <div className="tile-spec">
                <p className="tile-stack">{project.stack}</p>
                <p className="tile-when">{project.when}</p>
            </div>
            <div className="tile-meta">
                <p className="tile-use">{project.use}</p>
                <ul className="tile-links">
                    {project.links.map((link) => (
                        <li key={link.href}>
                            <a href={link.href}>{link.label}</a>
                        </li>
                    ))}
                </ul>
            </div>
        </article>
    );
}

function Shelf({
    id,
    label,
    count,
    lede,
    sub,
    children,
}: {
    id: string;
    label: string;
    count: string;
    lede: ReactNode;
    sub: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="shelf" id={id} aria-labelledby={`${id}-label`}>
            <header className="shelf-head">
                <h2 className="board-label" id={`${id}-label`}>
                    <span>{label}</span>
                    <span className="board-count">{count}</span>
                </h2>
                <p className="shelf-lede">{lede}</p>
                <p className="shelf-sub">{sub}</p>
            </header>
            {children}
        </section>
    );
}

const GOOD_COOKIE: ShowcaseProject = {
    id: "good-cookie",
    name: "Good Cookie",
    purpose: "privacy pages you own",
    summary: "one payment, your own files.",
    line: { lead: "privacy pages and a consent banner you pay for ", mark: "once", tail: ", then host yourself." },
    detail: "a short wizard turns a site's answers into privacy pages and a self-hosted consent banner. i built the product, the checkout and the zip delivery. a small business experiment, shipped and open for business.",
    fact: "$29, one payment. the pack comes in english and czech, and you see it before you pay.",
    use: "live · a small business",
    stack: "node · express · stripe · file generation",
    reach: "live",
    when: "goodcookie.app",
    image: {
        src: "/showcase/good-cookie.webp",
        width: 1440,
        height: 900,
        alt: "Good Cookie's live demo shows its consent banner blocking a tracking script on an invented shop",
        caption: "a working banner demo on a made-up shop",
    },
    links: [{ href: "https://goodcookie.app/", label: "try the banner" }],
};

const NAKUP_SHOT: ShowcaseProject["image"] = {
    src: "/showcase/nakup.webp",
    width: 440,
    height: 850,
    alt: "Nákup with invented groceries and anonymous people, in blue and yellow inks",
    caption: "the actual app · invented groceries and people",
};

/** the board: three shelves of hairline columns under the sky, then the sign-off */
export function Board() {
    return (
        <div className="board" id="things-i-made">
            <Shelf
                id="the-desk"
                label="the desk"
                count="3 tools · used daily"
                lede={
                    <>
                        three tools for working with a pile of agents, and <em>all three are open</em>{" "}
                        on my screen every day.
                    </>
                }
                sub="beadside and tally are open source. the t3 fork has a showcase you can click through before you download it."
            >
                <div className="board-row board-row--one">
                    <Tile project={byId("beadside")} variant="wide" eager />
                </div>
                <div className="board-row board-row--two">
                    <Tile project={byId("tally")} variant="half" />
                    <Tile project={byId("t3-code")} variant="half" mirror />
                </div>
            </Shelf>

            <Shelf
                id="the-choosers"
                label="the choosers"
                count="3 public · no account"
                lede={
                    <>
                        three public things for making a choice: <em>a model, a font, a station</em>.
                    </>
                }
                sub="all three open in a browser with no account, and i use each one for the choice it is named after."
            >
                <div className="board-row board-row--one">
                    <Tile project={byId("model-map")} variant="wide" />
                </div>
                <div className="board-row board-row--two">
                    <Tile project={byId("font-tinder")} variant="half" />
                    <Tile project={byId("diskzokej")} variant="half" mirror />
                </div>
            </Shelf>

            <Shelf
                id="different-itches"
                label="different itches"
                count="5 · plus the archive"
                lede={
                    <>
                        one of these sells for <em>$29</em>, one lives on two phones at home, and three
                        are smaller things i keep around.
                    </>
                }
                sub="the older experiments are folded away at the bottom of the last column, still standing."
            >
                <div className="board-row board-row--three">
                    <Tile project={GOOD_COOKIE} variant="half" />
                    <article className="tile tile--phone" id="nakup" aria-labelledby="name-nakup">
                        <header className="tile-head">
                            <h3 className="tile-name" id="name-nakup">
                                <span>nákup</span>
                                <span className="tile-reach tile-reach--private">{REACH.private}</span>
                            </h3>
                            <p className="tile-line">
                                a grocery list for two people, <em>one ink each</em>.
                            </p>
                        </header>
                        <Shot image={NAKUP_SHOT} className="tile-shot" />
                        <p className="tile-detail">
                            it works in the supermarket basement, syncs when signal returns, and
                            remembers which aisle a thing belongs in. small on purpose: optimistic
                            operations, retry-safe sync and a list that gets easier the more you use
                            it.
                        </p>
                        <div className="tile-meta">
                            <p className="tile-use">in real household use · private app</p>
                            <p className="tile-stack">react · typescript · node · sse · offline replay</p>
                        </div>
                    </article>
                    <section className="tile tile--list" aria-labelledby="smaller-label">
                        <h3 className="tile-name" id="smaller-label">
                            <span>smaller rooms</span>
                        </h3>
                        <ul className="room-list">
                            <li id="powder-lab">
                                <h4>
                                    <a href="https://powder.ssscribe.app/">powder lab</a>
                                </h4>
                                <p>
                                    falling sand, reactive materials and deterministic multiplayer.
                                    react does the buttons; the simulation does the pixels. the sand
                                    up top is its little cousin.{" "}
                                    <a href="https://github.com/thatmike1/powder-lab">source</a>
                                </p>
                                <p className="tile-when">since 28 may · rooms since 2 sep 2026</p>
                            </li>
                            <li id="reader">
                                <h4>
                                    <a href="https://read.thatmike1.dev/">reader</a>
                                </h4>
                                <p>
                                    a finite edition instead of an endless feed. exact reading
                                    markers, guest storage and account sync, so coming back means
                                    continuing rather than starting over.
                                </p>
                            </li>
                            <li id="ssscribe">
                                <h4>ssscribe</h4>
                                <p>
                                    speak on my phone, get copy-ready text on my laptop. a private,
                                    self-hosted transcription pwa with realtime sync and ai
                                    transforms. <a href="/ssscribe/desktop.webp">early design study</a>
                                </p>
                            </li>
                        </ul>
                        <details className="room-archive">
                            <summary>older experiments, still worth a look</summary>
                            <ul>
                                <li>
                                    <a href="https://ontask.ssscribe.app/">on-task</a>: a desktop
                                    creature that noticed when i drifted. the daemon is retired; the
                                    interactive site survives.
                                </li>
                                <li>
                                    <a href="https://thatmike1.github.io/cc-bench/">cc-bench</a>: an
                                    instrument for measuring what an agent config changes. the tool
                                    is built; the research question is still open.
                                </li>
                                <li>
                                    <a href="https://github.com/thatmike1/aw-watcher-git">aw-watcher-git</a>:
                                    editor-independent repo and branch tracking for activitywatch.
                                </li>
                            </ul>
                        </details>
                    </section>
                </div>
            </Shelf>
        </div>
    );
}

/** every project on the board, with how a visitor can reach it, for the masthead's index */
export const BOARD_INDEX: Array<{ id: string; name: string; reach: Reach }> = [
    ...["beadside", "tally", "t3-code", "model-map", "font-tinder", "diskzokej"].map((id) => {
        const p = byId(id);
        return { id: p.id, name: p.id === "t3-code" ? "t3 code, with extras" : p.name.toLowerCase(), reach: p.reach };
    }),
    { id: "good-cookie", name: "good cookie", reach: "live" },
    { id: "nakup", name: "nákup", reach: "private" },
    { id: "powder-lab", name: "powder lab", reach: "live" },
    { id: "reader", name: "reader", reach: "live" },
    { id: "ssscribe", name: "ssscribe", reach: "private" },
];
