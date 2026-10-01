import { createFileRoute } from "@tanstack/react-router";
import { SHOWCASE } from "../lib/showcase";
import "../components/project-collection.css";
import { ExperienceCustody } from "../components/experience-custody";
import "./hire.css";

/** the quiet recruiter route uses the same project facts as the homepage */
const NAME = "michal pšenčík";
const ROLE = "full-stack product engineer";
const TITLE = `${NAME} · ${ROLE}`;
const DESCRIPTION =
    "full-stack product engineer in czechia. react, typescript and node, api to ui. open to remote product-engineering roles, english and czech.";

const FACTS = [
    "czechia",
    "remote (cet / emea)",
    "open to product-engineering roles",
    "english + czech",
];

type Action = {
    href: string;
    label: string;
    primary?: boolean;
    /** the pdf opens beside the page: clicking it in place strands the reader in a viewer */
    newTab?: boolean;
};

const ACTIONS: Array<Action> = [
    { href: "mailto:misa.psencik@gmail.com", label: "misa.psencik@gmail.com", primary: true },
    { href: "https://github.com/thatmike1", label: "github.com/thatmike1" },
    { href: "https://www.linkedin.com/in/michal-psencik-304303145/", label: "linkedin" },
    { href: "/cv-michal-psencik-en.pdf", label: "cv (pdf)", newTab: true },
    { href: "/", label: "full portfolio" },
];

const SHIPPED = SHOWCASE.filter((project) =>
    ["beadside", "font-tinder", "tally", "diskzokej"].includes(project.id),
);

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
        <main className="hire">
            <header className="hire-head">
                <div className="container">
                    <h1>{NAME}</h1>
                    <p className="hire-role">{ROLE}</p>
                    <p className="hire-lede">
                        react, typescript, node. i own the whole vertical slice from the api to the
                        ui, and i ship every day with ai agents doing a lot of the typing.
                    </p>

                    <ul className="hire-facts">
                        {FACTS.map((fact) => (
                            <li key={fact}>{fact}</li>
                        ))}
                    </ul>

                    <div className="hire-actions">
                        {ACTIONS.map((action) => (
                            <a
                                className={`hire-action${action.primary ? " hire-action--primary" : ""}`}
                                href={action.href}
                                key={action.href}
                                rel={action.newTab ? "noopener noreferrer" : undefined}
                                target={action.newTab ? "_blank" : undefined}
                            >
                                {action.label}
                            </a>
                        ))}
                    </div>
                </div>
            </header>

            <section className="hire-shipped" id="shipped" aria-labelledby="shipped-heading">
                <div className="container">
                    <h2 id="shipped-heading">shipped on my own time</h2>
                    <p className="section-sub">
                        tools i use and products you can try. each one is mine from the underlying
                        data and api to the interface.{" "}
                        <a href="/#things-i-made">
                            see the previews and the rest of the collection
                        </a>
                        .
                    </p>

                    <ul className="hire-shipped-list">
                        {SHIPPED.map((item) => (
                            <li className="hire-row" key={item.name}>
                                <div>
                                    <h3 className="hire-row-name">{item.name}</h3>
                                    <p className="hire-row-tag">{item.purpose}</p>
                                    <p className="hire-row-stack">{item.stack}</p>
                                </div>
                                <div>
                                    <p>
                                        {item.summary} {item.detail}
                                    </p>
                                    <ul className="hire-row-links">
                                        {[
                                            { href: `/#${item.id}`, label: "project preview" },
                                            ...item.links,
                                        ].map((link) => (
                                            <li key={link.href}>
                                                <a href={link.href}>{link.label}</a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <ExperienceCustody />

            <footer className="footer" id="say-hi">
                <div className="container">
                    <h2>say hi</h2>
                    <p className="footer-lede">
                        email is the fastest way to get me, and i answer. tell me what you're
                        building and i'll tell you whether i'm the right person for it.
                    </p>
                    <ul className="footer-links">
                        <li>
                            <a href="mailto:misa.psencik@gmail.com">misa.psencik@gmail.com</a>
                        </li>
                        <li>
                            <a href="https://github.com/thatmike1">github.com/thatmike1</a>
                        </li>
                        <li>
                            <a href="https://www.linkedin.com/in/michal-psencik-304303145/">
                                linkedin
                            </a>
                        </li>
                        <li>
                            <a
                                href="/cv-michal-psencik-en.pdf"
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                cv (pdf)
                            </a>
                        </li>
                        <li>
                            <a href="/">the rest of the site</a>
                        </li>
                    </ul>
                    <p className="colophon">
                        set in sora, which is also my dog's name. no cookies, anonymous pageviews,
                        no contact form.
                        <br />© 2026 michal pšenčík · czechia
                    </p>
                </div>
            </footer>
        </main>
    );
}
