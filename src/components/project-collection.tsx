import { useEffect, useRef, useState } from "react";
import { SHOWCASE, nextProjectIndex, projectIndex } from "../lib/showcase";
import type { ShowcaseProject } from "../lib/showcase";
import { useLightbox } from "./lightbox";
import "./project-collection.css";

export function ProjectImage({ image }: { image: ShowcaseProject["image"] }) {
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
                    loading="lazy"
                />
                <span className="collection-enlarge">
                    enlarge <span aria-hidden="true">↗</span>
                </span>
            </a>
            <figcaption>{image.caption}</figcaption>
        </figure>
    );
}

/** the server renders every project; hydration turns the list into an accessible tab collection */
export function ProjectCollection() {
    const [active, setActive] = useState(0);
    const [enhanced, setEnhanced] = useState(false);
    const tabs = useRef(new Map<number, HTMLButtonElement>());

    useEffect(() => {
        const readLocation = () => {
            const index = projectIndex(window.location.hash);
            if (index !== -1) setActive(index);
        };
        readLocation();
        setEnhanced(true);
        window.addEventListener("hashchange", readLocation);
        window.addEventListener("popstate", readLocation);
        return () => {
            window.removeEventListener("hashchange", readLocation);
            window.removeEventListener("popstate", readLocation);
        };
    }, []);

    const select = (index: number) => {
        setActive(index);
        const fragment = `#${SHOWCASE[index].id}`;
        if (window.location.hash !== fragment) window.history.pushState(null, "", fragment);
    };

    return (
        <section className="collection" id="things-i-made" aria-labelledby="collection-heading">
            <div className="container">
                <div className="collection-intro">
                    <h2 id="collection-heading">
                        things i made
                        <br />
                        <span>and kept using.</span>
                    </h2>
                    <p>
                        some became products. some just made my days better.
                        <br />
                        pick one, have a look around.
                    </p>
                </div>
                {enhanced ? (
                    <div className="collection-tabs" role="tablist" aria-label="projects">
                        {SHOWCASE.map((project, index) => (
                            <button
                                type="button"
                                role="tab"
                                key={project.id}
                                id={`tab-${project.id}`}
                                aria-controls={project.id}
                                aria-selected={index === active}
                                tabIndex={index === active ? 0 : -1}
                                ref={(node) => {
                                    if (node) tabs.current.set(index, node);
                                    else tabs.current.delete(index);
                                }}
                                onClick={() => select(index)}
                                onKeyDown={(event) => {
                                    const next = nextProjectIndex(
                                        event.key,
                                        index,
                                        SHOWCASE.length,
                                    );
                                    if (next === null) return;
                                    event.preventDefault();
                                    select(next);
                                    tabs.current.get(next)?.focus();
                                }}
                            >
                                <span>{project.name}</span>
                                <span className="collection-tab-purpose">{project.purpose}</span>
                            </button>
                        ))}
                    </div>
                ) : null}
                {SHOWCASE.map((project, index) => (
                    <article
                        className="collection-project"
                        key={project.id}
                        id={project.id}
                        role={enhanced ? "tabpanel" : undefined}
                        aria-labelledby={enhanced ? `tab-${project.id}` : `title-${project.id}`}
                        tabIndex={enhanced ? 0 : undefined}
                        hidden={enhanced && index !== active}
                    >
                        <div className="collection-story">
                            <h3 id={`title-${project.id}`}>{project.name}</h3>
                            <p className="collection-summary">{project.summary}</p>
                            <p className="collection-detail">{project.detail}</p>
                            <p className="collection-use">{project.use}</p>
                            <p className="collection-stack">{project.stack}</p>
                            <ul className="collection-links">
                                {project.links.map((link) => (
                                    <li key={link.href}>
                                        <a href={link.href}>
                                            {link.label} <span aria-hidden="true">↗</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <ProjectImage image={project.image} />
                    </article>
                ))}
            </div>
        </section>
    );
}
