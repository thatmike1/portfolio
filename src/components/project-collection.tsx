import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { ITCHES, SHOWCASE } from "../lib/showcase";
import type { ShowcaseProject } from "../lib/showcase";
import { useLightbox } from "./lightbox";
import "./project-collection.css";

/**
 * each project's shot glows in its own light, read off the screenshot's own palette.
 * an oklch hue; the lightness and chroma are the page's, so the three looks still hold
 */
const GLOW: Record<string, number> = {
    beadside: 357,
    tally: 45,
    "model-map": 150,
    "t3-code": 290,
    "font-tinder": 10,
    diskzokej: 75,
    "good-cookie": 80,
    nakup: 230,
};

/** two digits, so the index and the entries line up in the mono column */
const numeral = (n: number) => String(n).padStart(2, "0");

/**
 * a screenshot that never draws past its own pixels; the click opens the viewer. the
 * shots are the proof, so they never wait for the scroll to reach them: all of them
 * load up front, the first one first and the rest behind the page's own work
 */
export function ProjectImage({
    image,
    priority = false,
}: {
    image: ShowcaseProject["image"];
    priority?: boolean;
}) {
    const openShot = useLightbox();
    return (
        <figure className="shot" style={{ "--native": `${image.width}px` } as CSSProperties}>
            <a
                href={image.src}
                className="shot-frame"
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
                    fetchPriority={priority ? "high" : "low"}
                    decoding="async"
                />
                <span className="shot-enlarge">enlarge</span>
            </a>
            <figcaption>{image.caption}</figcaption>
        </figure>
    );
}

/**
 * one project: its story and its proof. the entry is its own size container, so the
 * same markup sets the story beside the shot when it has the room, as a two-column
 * header over the shot when it has less, and as a plain column on a phone
 */
export function ProjectEntry({
    project,
    number,
    side = "left",
    portrait = false,
    priority = false,
}: {
    project: ShowcaseProject;
    number: number;
    side?: "left" | "right";
    portrait?: boolean;
    priority?: boolean;
}) {
    const glow = GLOW[project.id] ?? 357;
    return (
        <article
            className={`entry${portrait ? " entry--portrait" : ""}`}
            id={project.id}
            data-side={side}
            aria-labelledby={`title-${project.id}`}
            style={{ "--glow-h": glow, "--native": `${project.image.width}px` } as CSSProperties}
        >
            <div className="entry-grid">
                <div className="entry-story">
                    <div className="entry-head">
                        <p className="entry-num" aria-hidden="true">
                            <span className="grain" />
                            {numeral(number)}
                        </p>
                        <h3 id={`title-${project.id}`}>{project.name}</h3>
                        <p className="entry-purpose">{project.purpose}</p>
                        <p className="entry-summary">{project.summary}</p>
                    </div>
                    <div className="entry-body">
                        <p className="entry-detail">{project.detail}</p>
                        <p className="entry-use">{project.use}</p>
                        <p className="entry-stack">{project.stack}</p>
                        {project.links.length ? (
                            <ul className="entry-links">
                                {project.links.map((link, i) => (
                                    <li key={link.href}>
                                        <a
                                            href={link.href}
                                            className={i === 0 ? "entry-link--lead" : undefined}
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </div>
                </div>
                <ProjectImage image={project.image} priority={priority} />
            </div>
        </article>
    );
}

type IndexEntry = { id: string; name: string; note?: string; number?: number };
type IndexChapter = { label: string; entries: IndexEntry[] };

/** the rail's table of contents, in page order */
export const INDEX: IndexChapter[] = [
    {
        label: "kept using",
        entries: SHOWCASE.map((p, i) => ({
            id: p.id,
            name: p.name,
            note: p.purpose,
            number: i + 1,
        })),
    },
    {
        label: "different itches",
        entries: ITCHES.map((p, i) => ({
            id: p.id,
            name: p.name,
            note: p.purpose,
            number: SHOWCASE.length + i + 1,
        })),
    },
    {
        label: "and the rest",
        entries: [
            { id: "smaller-things", name: "smaller things", note: "powder lab, ssscribe, reader" },
            { id: "what-was-mine", name: "the day job" },
            { id: "say-hi", name: "say hi" },
        ],
    },
];

const INDEX_IDS = INDEX.flatMap((chapter) => chapter.entries.map((entry) => entry.id));

/**
 * which indexed part of the page is being read: whatever crosses a thin band a third
 * of the way down the viewport. between two entries the last one holds, so the mark
 * never blinks off while a gap scrolls past
 */
function useReading(ids: string[]) {
    const [active, setActive] = useState<string | null>(null);
    const inBand = useRef(new Set<string>());

    useEffect(() => {
        if (typeof IntersectionObserver === "undefined") return;
        const targets = ids
            .map((id) => document.getElementById(id))
            .filter((el): el is HTMLElement => el !== null);
        if (!targets.length) return;
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) inBand.current.add(entry.target.id);
                    else inBand.current.delete(entry.target.id);
                }
                const next = ids.find((id) => inBand.current.has(id));
                if (next) setActive(next);
            },
            { rootMargin: "-32% 0px -62% 0px" },
        );
        for (const target of targets) observer.observe(target);
        return () => observer.disconnect();
    }, [ids]);

    return active;
}

/**
 * the letter on the left: what this part of the page is, everything in it, and a way
 * to reach me, held beside the work for as long as the work scrolls past
 */
export function RoomRail({ children }: { children?: ReactNode }) {
    const active = useReading(INDEX_IDS);
    return (
        <aside className="rail" aria-labelledby="collection-heading">
            <div className="rail-sheet">
                <div className="rail-letter">
                    <h2 id="collection-heading">
                        things i made <span>and kept using.</span>
                    </h2>
                    <p className="rail-lede">
                        some became products. some just made my days better. the pictures are the
                        real apps, fed made-up data.
                    </p>
                </div>
                <nav className="rail-index" aria-label="everything on this page">
                    {INDEX.map((chapter) => (
                        <div className="rail-chapter" key={chapter.label}>
                            <p className="rail-chapter-label">{chapter.label}</p>
                            <ol>
                                {chapter.entries.map((entry) => {
                                    const on = entry.id === active;
                                    return (
                                        <li key={entry.id}>
                                            <a
                                                href={`#${entry.id}`}
                                                className={on ? "is-active" : undefined}
                                                aria-current={on ? "location" : undefined}
                                            >
                                                <span className="rail-num" aria-hidden="true">
                                                    {entry.number ? (
                                                        numeral(entry.number)
                                                    ) : (
                                                        <span className="grain" />
                                                    )}
                                                </span>
                                                <span className="rail-name">{entry.name}</span>
                                                {entry.note ? (
                                                    <span className="rail-note">{entry.note}</span>
                                                ) : null}
                                            </a>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>
                    ))}
                </nav>
                {children}
            </div>
        </aside>
    );
}
