import { lazy } from "react";
import type { ComponentType, LazyExoticComponent, ReactNode } from "react";
import { FACTS } from "../lib/facts";
import { ARCHIVE, SHELF, SHOWCASE, SUPPORTING } from "../lib/showcase";
import type { Line, Reach, ShelfItem, ShowcaseProject } from "../lib/showcase";
import { LazyMini } from "./minis/lazy-mini";
import { CommitPiles, DiffGrains, FontMaps, RadioDial } from "./pixel-charts";
import { ShowcaseImage } from "./showcase-image";
import "./board.css";

const ALL = [...SHOWCASE, ...SUPPORTING];

const byId = (id: string): ShowcaseProject => {
    const project = ALL.find((p) => p.id === id);
    if (!project) throw new Error(`no showcase project ${id}`);
    return project;
};

/**
 * beadside's fact is a thing, not a number: the first issue anyone else opened on
 * it, quoted as github shows it
 */
function IssueOne() {
    const issue = FACTS.beadsideIssue;
    // github renders the backticks as code; so does this
    const parts = issue.title.split("`");
    return (
        <figure className="issue">
            <figcaption className="issue-meta">
                <a href={`https://github.com/thatmike1/beadside/issues/${issue.number}`}>
                    thatmike1/beadside #{issue.number}
                </a>
                <span>{issue.state}</span>
            </figcaption>
            <p className="issue-title">
                {parts.map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part))}
            </p>
        </figure>
    );
}

/** the small chart that goes with each project's fact; a miniature replaces one where it says more */
const CHARTS: Record<string, ReactNode> = {
    beadside: <IssueOne />,
    tally: <CommitPiles />,
    "t3-code": <DiffGrains />,
    "font-tinder": <FontMaps />,
    diskzokej: <RadioDial />,
};

type Toy = {
    toy: LazyExoticComponent<ComponentType>;
    label: string;
    minHeight: string;
    caption: ReactNode;
};

/** each toy is its own chunk, fetched only when the reader gets near it */
const TOYS: Record<string, Toy> = {
    beadside: {
        toy: lazy(() => import("./minis/beadside-mini")),
        label: "a working miniature of beadside's note handoff",
        minHeight: "30rem",
        caption: (
            <>
                <b>try it:</b> answer the agent, and the next session reads your note first.
                invented backlog, scripted agent, the real flow.
            </>
        ),
    },
    tally: {
        toy: lazy(() => import("./minis/tally-mini")),
        label: "a working miniature of tally's block explanation",
        minHeight: "27rem",
        caption: (
            <>
                <b>try it:</b> drag across the block, or point at a session. three synthetic
                sessions, the same question tally answers.
            </>
        ),
    },
    "model-map": {
        toy: lazy(() => import("./minis/model-map-mini")),
        label: "a working miniature of the model map's frontier chart",
        minHeight: "31rem",
        caption: (
            <>
                <b>try it:</b> point at a dot and the same model's other efforts light up. the
                map's own public data.
            </>
        ),
    },
    nakup: {
        toy: lazy(() => import("./minis/nakup-mini")),
        label: "a working miniature of nákup, with tomáš and bára's invented list",
        minHeight: "40rem",
        caption: (
            <>
                <b>try it:</b> pick whose phone you're holding, tick what the other one added, add
                something. the real list is private, so this one is made up.
            </>
        ),
    },
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

function Name({ project }: { project: { id: string; name: string; reach: Reach } }) {
    return (
        <h3 className="tile-name" id={`name-${project.id}`}>
            <span>{project.name}</span>
            <span className={`tile-reach tile-reach--${project.reach}`}>{REACH[project.reach]}</span>
        </h3>
    );
}

function Links({ project }: { project: ShowcaseProject }) {
    if (!project.links.length) return null;
    return (
        <ul className="tile-links">
            {project.links.map((link) => (
                <li key={link.href}>
                    <a href={link.href}>{link.label}</a>
                </li>
            ))}
        </ul>
    );
}

/**
 * what each tile's screenshot takes on screen, for its srcset. a wide tile's shot is
 * about 2.65 of 3.55 shares of the board from 1840px and 2.15 of 3.15 on a laptop; a
 * full spread runs the board's width; a half tile is half of it
 */
const SIZES = {
    wide: "(min-width: 1840px) 70vw, (min-width: 900px) 64vw, calc(100vw - 2.5rem)",
    full: "(min-width: 1840px) 94vw, (min-width: 900px) 64vw, calc(100vw - 2.5rem)",
    half: "(min-width: 1840px) 46vw, (min-width: 900px) 64vw, calc(100vw - 2.5rem)",
    more: "(min-width: 1840px) 33vw, 1px",
} as const;

type Variant = "wide" | "full" | "half";

/**
 * one project on the board: its name and its story in a sentence, the real screen as
 * big as the width allows, then the toy and a second screen where there is room, and
 * one true fact with its date
 */
function Tile({
    project,
    variant,
    mirror = false,
    priority = false,
    showMore = true,
}: {
    project: ShowcaseProject;
    variant: Variant;
    mirror?: boolean;
    priority?: boolean;
    /** off where the second shot would only repeat what the toy beside it already shows */
    showMore?: boolean;
}) {
    const chart = CHARTS[project.id];
    const toy = TOYS[project.id];
    // a second shot sits beside the toy on a wide screen; otherwise it waits in the viewer
    const more = showMore && variant !== "half" && project.shots.length > 1;
    return (
        <article
            className={`tile tile--${variant}${mirror ? " tile--mirror" : ""}${toy ? " tile--toy" : ""}`}
            id={project.id}
            aria-labelledby={`name-${project.id}`}
        >
            <header className="tile-head">
                <Name project={project} />
                <p className="tile-line">
                    <Marked line={project.line} />
                </p>
            </header>
            <ShowcaseImage
                className="tile-shot"
                shots={project.shots}
                sizes={SIZES[variant]}
                priority={priority}
            />
            <p className="tile-detail">{project.detail}</p>
            {toy || more ? (
                <div className="tile-after">
                    {toy ? (
                        <LazyMini
                            className="tile-toy"
                            toy={toy.toy}
                            label={toy.label}
                            minHeight={toy.minHeight}
                            caption={toy.caption}
                        />
                    ) : null}
                    {more ? (
                        <ShowcaseImage
                            className="tile-more"
                            shots={project.shots}
                            index={1}
                            sizes={SIZES.more}
                        />
                    ) : null}
                </div>
            ) : null}
            <div className="tile-fact">
                {chart}
                {project.fact ? <p>{project.fact}</p> : null}
            </div>
            <div className="tile-spec">
                <p className="tile-stack">{project.stack}</p>
                <p className="tile-when">{project.when}</p>
            </div>
            <div className="tile-meta">
                <p className="tile-use">{project.use}</p>
                <Links project={project} />
            </div>
        </article>
    );
}

/** nákup: the three-phone story from one evening, and a list you can poke at yourself */
function NakupTile() {
    const project = byId("nakup");
    const toy = TOYS.nakup;
    return (
        <article className="tile tile--nakup" id={project.id} aria-labelledby={`name-${project.id}`}>
            <header className="tile-head">
                <Name project={project} />
                <p className="tile-line">
                    <Marked line={project.line} />
                </p>
            </header>
            <ol className="tile-phones" aria-label="one evening on two phones">
                {project.shots.map((shot, index) => (
                    <li key={shot.image.src}>
                        <ShowcaseImage
                            className="tile-phone"
                            shots={project.shots}
                            index={index}
                            sizes="(min-width: 900px) 330px, 240px"
                        />
                    </li>
                ))}
            </ol>
            <p className="tile-detail">{project.detail}</p>
            <LazyMini
                className="tile-toy"
                toy={toy.toy}
                label={toy.label}
                minHeight={toy.minHeight}
                caption={toy.caption}
            />
            <div className="tile-meta">
                <p className="tile-use">{project.use}</p>
            </div>
            <div className="tile-spec">
                <p className="tile-stack">{project.stack}</p>
                <p className="tile-when">{project.when}</p>
            </div>
        </article>
    );
}

function Room({ item }: { item: ShelfItem }) {
    return (
        <>
            {item.href ? <a href={item.href}>{item.name}</a> : item.name}
            {item.links.map((link) => (
                <span key={link.href}>
                    {" · "}
                    <a href={link.href}>{link.label}</a>
                </span>
            ))}
        </>
    );
}

/** the smaller things, then the archive folded away under them */
function Rooms() {
    return (
        <section className="tile tile--list" aria-labelledby="smaller-label">
            <h3 className="tile-name" id="smaller-label">
                <span>smaller rooms</span>
            </h3>
            <ul className="room-list">
                {SHELF.map((item) => (
                    <li id={item.id} key={item.id}>
                        <h4>
                            <Room item={item} />
                        </h4>
                        <p>{item.text}</p>
                    </li>
                ))}
            </ul>
            <details className="room-archive">
                <summary>older experiments, still worth a look</summary>
                <ul>
                    {ARCHIVE.map((item) => (
                        <li key={item.id}>
                            <Room item={item} />: {item.text}
                        </li>
                    ))}
                </ul>
            </details>
        </section>
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

/** the board: three shelves of hairline columns under the sky */
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
                sub="beadside is open source, tally's source is on github, and the t3 fork has a showcase you can click through before you download it."
            >
                <div className="board-row">
                    <Tile project={byId("beadside")} variant="wide" priority />
                </div>
                <div className="board-row">
                    <Tile project={byId("tally")} variant="full" />
                </div>
                <div className="board-row">
                    <Tile project={byId("t3-code")} variant="wide" />
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
                sub="all three open in a browser, and none of them asks you to sign up."
            >
                <div className="board-row">
                    <Tile project={byId("model-map")} variant="wide" showMore={false} />
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
                        one lives on <em>two phones at home</em>, one sells for $29, and three are
                        smaller things i keep around.
                    </>
                }
                sub="the older experiments are folded away at the end, still standing."
            >
                <div className="board-row">
                    <NakupTile />
                </div>
                <div className="board-row board-row--cookie">
                    <Tile project={byId("good-cookie")} variant="half" />
                    <Rooms />
                </div>
            </Shelf>
        </div>
    );
}

/** every project on the board in page order, with how a visitor can reach it, for the masthead */
export const BOARD_INDEX: Array<{ id: string; name: string; reach: Reach }> = [
    ...SHOWCASE,
    byId("nakup"),
    byId("good-cookie"),
    ...SHELF,
].map(({ id, name, reach }) => ({ id, name, reach }));
