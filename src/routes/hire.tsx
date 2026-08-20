import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ExperienceCustody } from "../components/experience-custody";
import "./hire.css";

/**
 * the recruiter door.
 *
 * the front page is ordered by what mike wanted to build. this one is ordered by
 * what someone deciding whether to book a call needs: who, what stack, what he
 * actually held, when he's free, how to reach him. everything above the fold is
 * answerable in thirty seconds; the custody section underneath is the evidence
 * for anyone who keeps scrolling.
 *
 * the name is the h1 and the role is the sub, because the question this page
 * answers first is "who is this", and every stack keyword sits in a mono line
 * somewhere a scanner will hit it.
 *
 * deliberately inert. no canvas, no cursor trail, no scroll work. this page gets
 * opened on a phone in a hiring channel and has to be there instantly. theme still
 * follows the saved setting, because the root's pre-paint script sets it for every
 * route, but there is no toggle here to flip it with.
 *
 * clients stay unnamed, same rule as the custody component: descriptors only.
 */

const NAME = "michal pšenčík";
const ROLE = "full-stack product engineer";
const TITLE = `${NAME} · ${ROLE}`;
const DESCRIPTION =
    "full-stack product engineer in czechia. react, typescript and node, two years on contract, api to ui. available from september 2026, remote, english and czech.";

const FACTS = [
    "czechia",
    "remote (cet / emea)",
    "available from september 2026",
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
    { href: "https://linkedin.com/in/michal-psencik", label: "linkedin" },
    { href: "/cv-michal-psencik-en.pdf", label: "cv (pdf)", newTab: true },
    { href: "/", label: "full portfolio" },
];

type Link = { href: string; label: string };

type Shipped = {
    name: string;
    tag: string;
    stack: string;
    body: ReactNode;
    links: Array<Link>;
};

/**
 * three of his own, picked because all three are running rather than because they
 * are the prettiest. the honest state of each one is part of the line: a benchmark
 * with no findings yet and a focus system that's currently switched off are more
 * convincing than three green checkmarks. the stacks are the same strings the
 * front page uses, so the two pages can't drift apart.
 */
const SHIPPED: Array<Shipped> = [
    {
        name: "ssscribe",
        tag: "personal transcription pwa",
        stack: "react 19 · tanstack · pocketbase · pwa · deepgram",
        body: (
            <>
                speak into my phone or paste from my laptop, and it lands as text in one private
                feed that syncs to every device. self-hosted on my own box, installable as a pwa,
                and i've used it every day since the summer, which is the only test i trust.
            </>
        ),
        links: [{ href: "/#things-i-made", label: "screenshots on the main page" }],
    },
    {
        name: "on-task",
        tag: "focus and accountability system",
        stack: "python · activitywatch · webgl2 · gtk3 · systemd · claude sonnet",
        body: (
            <>
                a daemon that watched what was actually on my screen and a desktop mascot that got
                progressively less polite about it. ran on my machine for months. it's switched off
                now and i'd rather say so than pretend it's a product.
            </>
        ),
        links: [{ href: "https://ontask.ssscribe.app/", label: "ontask.ssscribe.app" }],
    },
    {
        name: "cc-bench",
        tag: "public benchmark",
        stack: "node 22 · zero deps · bwrap sandbox · paired stats · 160 tests",
        body: (
            <>
                asks whether a CLAUDE.md file changes anything about what claude code does, since
                everyone writes one and nobody measures it. the harness is built, tested and public,
                and the site runs the real counters on whatever config you paste in. the answer is
                still open.
            </>
        ),
        links: [
            { href: "https://thatmike1.github.io/cc-bench/", label: "paste your config in" },
            { href: "https://github.com/thatmike1/cc-bench", label: "github.com/thatmike1/cc-bench" },
        ],
    },
];

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

            <ExperienceCustody />

            <section className="hire-shipped" id="shipped" aria-labelledby="shipped-heading">
                <div className="container">
                    <h2 id="shipped-heading">shipped on my own time</h2>
                    <p className="section-sub">
                        three of mine that are running, public, or both. the rest are on the main
                        page, sand toy included, and that toy is a small cousin of my{" "}
                        <a href="https://github.com/thatmike1/powder-lab">falling-sand engine</a>.
                    </p>

                    <ul className="hire-shipped-list">
                        {SHIPPED.map((item) => (
                            <li className="hire-row" key={item.name}>
                                <div>
                                    <h3 className="hire-row-name">{item.name}</h3>
                                    <p className="hire-row-tag">{item.tag}</p>
                                    <p className="hire-row-stack">{item.stack}</p>
                                </div>
                                <div>
                                    <p>{item.body}</p>
                                    <ul className="hire-row-links">
                                        {item.links.map((link) => (
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
                            <a href="https://linkedin.com/in/michal-psencik">linkedin</a>
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
                        set in sora, which is also my dog's name. no cookies, no analytics, no
                        contact form.
                        <br />© 2026 michal pšenčík · czechia
                    </p>
                </div>
            </footer>
        </main>
    );
}
