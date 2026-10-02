import { lazy } from "react";
import type { ComponentType, LazyExoticComponent, ReactNode } from "react";
import { useArrival } from "../lib/arrival";
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
        minHeight: "36.5rem",
        caption: (
            <>
                <b>try it:</b> drag across the block, or point at a session. the four synthetic
                sessions from the screenshot, the same question tally answers.
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
                <b>try it:</b> the real app is czech; this one speaks english so you can play.
                pick whose phone you're holding, tick what the other one added, add something.
                the people and the groceries are made up.
            </>
        ),
    },
};

const REACH: Record<Reach, string> = {
    live: "open it",
    source: "run the repo",
    private: "stays at home",
};

/**
 * the lit phrase of a sentence headline. it lights up the first time its line
 * scrolls into view (the highlighter stroke sweeps through at noon, the words take
 * the raspberry after dark); a line already on screen when the page lands is lit
 * from the start, and so is every line for a reader who asked for less motion
 */
export function Lit({ children }: { children: ReactNode }) {
    const [ref, arrival] = useArrival<HTMLElement>(0.9);
    return (
        <em ref={ref} data-arrival={arrival}>
            {children}
        </em>
    );
}

export function Marked({ line }: { line: Line }) {
    return (
        <>
            {line.lead}
            <Lit>{line.mark}</Lit>
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
 * full spread runs the board's width; a half tile is half of it on a wide screen and
 * spreads across the board on a laptop. good cookie is a half tile in a row of its
 * own, two of three shares beside the rooms, so it draws at about 61vw from 1840px
 */
const SIZES = {
    wide: "(min-width: 1840px) 70vw, (min-width: 900px) 64vw, calc(100vw - 2.5rem)",
    full: "(min-width: 1840px) 94vw, (min-width: 900px) 64vw, calc(100vw - 2.5rem)",
    half: "(min-width: 1840px) 46vw, (min-width: 900px) 94vw, calc(100vw - 2.5rem)",
    /** a heavyweight without a toy: beside its story from 1840px, spread across a laptop */
    plain: "(min-width: 1840px) 70vw, (min-width: 900px) 94vw, calc(100vw - 2.5rem)",
    cookie: "(min-width: 1840px) 62vw, (min-width: 900px) 94vw, calc(100vw - 2.5rem)",
} as const;

type Variant = "wide" | "full" | "half";

/**
 * one project on the board: its name and its story in a sentence, the real screen as
 * big as the width allows, the toy where there is one, and one true fact with its
 * date. a project's other screens wait in the viewer. the story and the screen are two
 * stacks; board.css places them per width, and on a phone both dissolve into one
 * column ordered so the screen comes right after the line
 */
function Tile({
    project,
    variant,
    priority = false,
    sizes,
}: {
    project: ShowcaseProject;
    variant: Variant;
    priority?: boolean;
    /** the shot's `sizes` when the tile sits somewhere its variant's default does not describe */
    sizes?: string;
}) {
    const chart = CHARTS[project.id];
    const toy = TOYS[project.id];
    return (
        <article
            className={`tile tile--${variant}${toy ? " tile--toy" : variant === "wide" ? " tile--plain" : ""}`}
            id={project.id}
            aria-labelledby={`name-${project.id}`}
        >
            <div className="tile-story">
                <header className="tile-head">
                    <Name project={project} />
                    <p className="tile-line">
                        <Marked line={project.line} />
                    </p>
                </header>
                <p className="tile-detail">{project.detail}</p>
                {/* the notes are one column beside a toy on a wide screen; elsewhere
                    they dissolve and board.css places each one on its own */}
                <div className="tile-notes">
                    <div className="tile-meta">
                        <p className="tile-use">{project.use}</p>
                        <Links project={project} />
                    </div>
                    <div className="tile-fact">
                        {chart}
                        {project.fact ? <p>{project.fact}</p> : null}
                    </div>
                    <div className="tile-spec">
                        <p className="tile-stack">{project.stack}</p>
                        <p className="tile-when">{project.when}</p>
                    </div>
                </div>
            </div>
            <div className="tile-main">
                <ShowcaseImage
                    className="tile-shot"
                    shots={project.shots}
                    sizes={sizes ?? (variant === "wide" && !toy ? SIZES.plain : SIZES[variant])}
                    priority={priority}
                />
                {toy ? (
                    <LazyMini
                        className="tile-toy"
                        toy={toy.toy}
                        label={toy.label}
                        minHeight={toy.minHeight}
                        caption={toy.caption}
                    />
                ) : null}
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
                            hint="enlarge"
                            sizes="(min-width: 1840px) 360px, (min-width: 900px) 300px, 240px"
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
                        three tools for working with a pile of agents, and <Lit>all three are open</Lit>{" "}
                        on my screen every day.
                    </>
                }
                sub="beadside and tally are open source, and the t3 fork has a showcase you can click through before you download it."
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
                        three public things for making a choice: <Lit>a model, a font, a station</Lit>.
                    </>
                }
                sub="all three open in a browser, and none of them asks you to sign up."
            >
                <div className="board-row">
                    <Tile project={byId("model-map")} variant="wide" />
                </div>
                <div className="board-row board-row--two">
                    <Tile project={byId("font-tinder")} variant="half" />
                    <Tile project={byId("diskzokej")} variant="half" />
                </div>
            </Shelf>

            <Shelf
                id="different-itches"
                label="different itches"
                count="5 · plus the archive"
                lede={
                    <>
                        one lives on <Lit>two phones at home</Lit>, one sells for $29, and three are
                        smaller things i keep around.
                    </>
                }
                sub="the older experiments are folded away at the end, still standing."
            >
                <div className="board-row">
                    <NakupTile />
                </div>
                <div className="board-row board-row--cookie">
                    <Tile project={byId("good-cookie")} variant="half" sizes={SIZES.cookie} />
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
