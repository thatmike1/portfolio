import { lazy } from "react";
import type { ComponentType, LazyExoticComponent, ReactNode } from "react";
import { SHOWCASE } from "../lib/showcase";
import type { ShowcaseProject } from "../lib/showcase";
import { useLightbox } from "./lightbox";
import { LazyMini } from "./minis/lazy-mini";
import "./project-collection.css";

export function ProjectImage({
    image,
    eager,
}: {
    image: ShowcaseProject["image"];
    /** the first shot on the page is worth fetching before it is scrolled to */
    eager?: boolean;
}) {
    const openShot = useLightbox();
    return (
        <figure className="collection-figure">
            <a
                href={image.src}
                className="collection-image"
                target="_blank"
                rel="noopener"
                onClick={(event) => {
                    if (
                        !openShot ||
                        event.metaKey ||
                        event.ctrlKey ||
                        event.shiftKey ||
                        event.altKey
                    )
                        return;
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
                    style={{ aspectRatio: `${image.width} / ${image.height}` }}
                />
                <span className="collection-enlarge">enlarge</span>
            </a>
            <figcaption>{image.caption}</figcaption>
        </figure>
    );
}

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
                <b>try it:</b> answer the agent. the next session reads your note first. invented
                backlog, scripted agent, real flow.
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
                <b>try it:</b> point at a dot and its other efforts light up. real public data,
                frozen on 29 sep 2026.
            </>
        ),
    },
};

function Links({ project }: { project: ShowcaseProject }) {
    return (
        <ul className="spread-links">
            {project.links.map((link) => (
                <li key={link.href}>
                    <a href={link.href}>{link.label}</a>
                </li>
            ))}
        </ul>
    );
}

function Story({ project }: { project: ShowcaseProject }) {
    return (
        <div className="spread-copy">
            <p className="spread-purpose">{project.purpose}</p>
            <h3 id={`title-${project.id}`}>{project.name}</h3>
            <p className="spread-summary">{project.summary}</p>
            <p className="spread-detail">{project.detail}</p>
            <p className="spread-use">{project.use}</p>
            <p className="spread-stack">{project.stack}</p>
            <Links project={project} />
        </div>
    );
}

/** a featured project: the words, the toy when it has one, and the real screenshot */
function Spread({ project, eager }: { project: ShowcaseProject; eager?: boolean }) {
    const toy = TOYS[project.id];
    return (
        <article
            className={`spread${toy ? " spread--toy" : " spread--plain"}`}
            id={project.id}
            aria-labelledby={`title-${project.id}`}
        >
            <Story project={project} />
            {toy ? (
                <LazyMini
                    toy={toy.toy}
                    label={toy.label}
                    minHeight={toy.minHeight}
                    caption={toy.caption}
                    className="spread-toy"
                />
            ) : null}
            <div className="spread-shot">
                <ProjectImage image={project.image} eager={eager} />
            </div>
        </article>
    );
}

/** two projects side by side: shot on top, a compact story under it */
function PairItem({ project }: { project: ShowcaseProject }) {
    return (
        <article className="pair-item" id={project.id} aria-labelledby={`title-${project.id}`}>
            <ProjectImage image={project.image} />
            <div className="pair-copy">
                <div>
                    <p className="spread-purpose">{project.purpose}</p>
                    <h3 id={`title-${project.id}`}>{project.name}</h3>
                    <p className="spread-summary">{project.summary}</p>
                    <Links project={project} />
                </div>
                <div>
                    <p className="spread-detail">{project.detail}</p>
                    <p className="spread-use">{project.use}</p>
                    <p className="spread-stack">{project.stack}</p>
                </div>
            </div>
        </article>
    );
}

const PAIRED = new Set(["font-tinder", "diskzokej"]);

/** every featured project on the page at once, no tabs: the index up top is the way around */
export function ProjectCollection() {
    const spreads = SHOWCASE.filter((p) => !PAIRED.has(p.id));
    const pair = SHOWCASE.filter((p) => PAIRED.has(p.id));

    return (
        <section className="collection" id="things-i-made" aria-labelledby="collection-heading">
            <div className="wide">
                <div className="collection-intro">
                    <div className="collection-letter">
                        <h2 id="collection-heading">
                            things i made
                            <br />
                            <span>and kept using.</span>
                        </h2>
                        <p>
                            some became products, some just made my days better. the ones marked{" "}
                            <span className="toy-mark" aria-hidden="true" />
                            <span className="sr">with a square</span> come with a small working
                            version right here on the page, so you can get the idea by poking it.
                            the real thing is always one link away.
                        </p>
                    </div>
                    <nav className="collection-index" aria-label="projects on this page">
                        <ol>
                            {[...spreads, ...pair].map((project) => (
                                <li key={project.id}>
                                    <a href={`#${project.id}`}>
                                        <span className="index-name">
                                            {project.name}
                                            {TOYS[project.id] ? (
                                                <span className="toy-mark" title="has a working miniature">
                                                    <span className="sr"> (try it here)</span>
                                                </span>
                                            ) : null}
                                        </span>
                                        <span className="index-purpose">{project.purpose}</span>
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </nav>
                </div>

                {spreads.map((project, i) => (
                    <Spread key={project.id} project={project} eager={i === 0} />
                ))}

                <div className="pair">
                    {pair.map((project) => (
                        <PairItem key={project.id} project={project} />
                    ))}
                </div>
            </div>
        </section>
    );
}
