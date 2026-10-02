import { createFileRoute } from "@tanstack/react-router";
import { DAY_JOB } from "../components/day-job";
import { LightboxProvider } from "../components/lightbox";
import { ShowcaseImage } from "../components/showcase-image";
import { HIRE_PICKS, SHELF, SUPPORTING } from "../lib/showcase";
import "./hire.css";

/** the recruiter route: who, what he built, how to reach him. project facts come from showcase.ts */
const NAME = "michal pšenčík";
const ROLE = "full-stack product engineer";
const TITLE = `${NAME} · ${ROLE}`;
const DESCRIPTION =
    "full-stack product engineer in czechia. react, typescript and node, api to ui. open to remote product-engineering roles, english and czech.";

const EMAIL = "misa.psencik@gmail.com";

const FACTS: Array<[string, string]> = [
    ["based in", "czechia"],
    ["works", "remote, cet / emea hours"],
    ["looking for", "product-engineering roles"],
    ["speaks", "english, czech"],
];

type Action = {
    href: string;
    label: string;
    primary?: boolean;
    /** the pdf opens beside the page: clicking it in place strands the reader in a viewer */
    newTab?: boolean;
};

const ACTIONS: Action[] = [
    { href: `mailto:${EMAIL}`, label: EMAIL, primary: true },
    { href: "/cv-michal-psencik-en.pdf", label: "cv (pdf)", newTab: true },
    { href: "https://github.com/thatmike1", label: "github" },
    { href: "https://www.linkedin.com/in/michal-psencik-304303145/", label: "linkedin" },
];

/** the smaller things, named once at the bottom with a door into the homepage */
const ALSO = [...SUPPORTING.filter((p) => !HIRE_PICKS.includes(p)), ...SHELF];

/** a thumbnail is about a third of the project column, the whole width once stacked */
const THUMB_SIZES = "(min-width: 701px) 360px, calc(100vw - 3rem)";

export const Route = createFileRoute("/hire")({
    component: Hire,
    head: () => ({
        meta: [
            { title: TITLE },
            { name: "description", content: DESCRIPTION },
            { property: "og:title", content: TITLE },
            { property: "og:description", content: DESCRIPTION },
        ],
    }),
});

function Hire() {
    return (
        <LightboxProvider>
            <main className="hire">
                <div className="hire-page">
                    <header className="hire-intro">
                        <h1>{NAME}</h1>
                        <p className="hire-role">{ROLE}</p>
                        <p className="hire-lede">
                            react, typescript, node. i'd rather own the whole slice, from the api
                            to the ui, than half of it, and i ship every day with ai agents doing a
                            lot of the typing. the projects here are mine, built on my own time,
                            and most of them i use every day.
                        </p>

                        <dl className="hire-facts">
                            {FACTS.map(([term, value]) => (
                                <div key={term}>
                                    <dt>{term}</dt>
                                    <dd>{value}</dd>
                                </div>
                            ))}
                            <div>
                                <dt>recent day job</dt>
                                <dd>{DAY_JOB}</dd>
                            </div>
                        </dl>

                        <ul className="hire-actions">
                            {ACTIONS.map((action) => (
                                <li key={action.href}>
                                    <a
                                        className={`hire-action${action.primary ? " hire-action--primary" : ""}`}
                                        href={action.href}
                                        rel={action.newTab ? "noopener noreferrer" : undefined}
                                        target={action.newTab ? "_blank" : undefined}
                                    >
                                        {action.label}
                                    </a>
                                </li>
                            ))}
                        </ul>

                        <p className="hire-elsewhere">
                            <a href="/">the long version, with a sand toy →</a>
                        </p>
                    </header>

                    <section className="hire-work" aria-labelledby="work-heading">
                        <div className="hire-work-head">
                            <h2 id="work-heading">what i've built lately</h2>
                            <p>
                                tools i use every day, public apps, and one small product. click a
                                screenshot to look closer.
                            </p>
                        </div>

                        <ol className="hire-projects">
                            {HIRE_PICKS.map((project) => (
                                <li className="hire-project" id={project.id} key={project.id}>
                                    <ShowcaseImage
                                        className="hire-project-shot"
                                        shots={project.shots}
                                        sizes={THUMB_SIZES}
                                        showCaption={false}
                                    />
                                    <div className="hire-project-text">
                                        <h3>{project.name}</h3>
                                        <p className="hire-project-summary">{project.summary}</p>
                                        <p className="hire-project-detail">{project.detail}</p>
                                        <p className="hire-project-meta">
                                            <span>{project.use}</span>
                                            <span>{project.stack}</span>
                                        </p>
                                        <ul className="hire-project-links">
                                            {project.links.map((link) => (
                                                <li key={link.href}>
                                                    <a href={link.href}>{link.label}</a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </li>
                            ))}
                        </ol>

                        <p className="hire-also">
                            also:{" "}
                            {ALSO.map((item, index) => (
                                <span key={item.id}>
                                    <a href={`/#${item.id}`}>{item.name}</a>
                                    {index < ALSO.length - 1 ? ", " : "."}
                                </span>
                            ))}{" "}
                            the homepage has the rest, and the sand.
                        </p>
                    </section>
                </div>

                <footer className="footer" id="say-hi">
                    <div className="container">
                        <h2>say hi</h2>
                        <p className="footer-lede">
                            email is the fastest way to reach me, and i answer. tell me what you're
                            building and i'll tell you honestly whether i'm the right person for it.
                        </p>
                        <ul className="footer-links">
                            <li>
                                <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
                            </li>
                            <li>
                                <a href="https://github.com/thatmike1">github.com/thatmike1</a>
                            </li>
                        </ul>
                        <p className="colophon">
                            set in sora, which is also my dog's name. no cookies, anonymous
                            pageviews, no contact form.
                            <br />© 2026 michal pšenčík · czechia
                        </p>
                    </div>
                </footer>
            </main>
        </LightboxProvider>
    );
}
