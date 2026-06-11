import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SandHero } from "../components/sand-hero";

export const Route = createFileRoute("/")({ component: Home });

type Project = {
    name: string;
    tagline: string;
    body: ReactNode;
    stack: string;
    code: string;
    live?: { href: string; label: string };
};

const PROJECTS: Array<Project> = [
    {
        name: "powder-lab",
        tagline: "a falling-sand sandbox",
        body: (
            <>
                paint with fourteen-ish materials and watch them fall, flow, burn, dissolve and
                react. react owns the buttons; an imperative core owns the pixels, so the simulation
                never touches a re-render. dirty-chunk scheduling (the noita trick) means settled
                sand costs nothing. the toy at the top of this page is its little cousin.
            </>
        ),
        stack: "react · typescript · canvas · vitest",
        code: "https://github.com/thatmike1/powder-lab",
        live: { href: "https://thatmike1.github.io/powder-lab/", label: "play it" },
    },
    {
        name: "claude-skills",
        tagline: "my claude code, customized",
        body: (
            <>
                a dozen installable skills that run my actual days: a morning briefing parsed
                straight from conversation history, an end-of-day receipt that proves the day
                happened, an adhd thought-structurer for when it didn't. zero-dependency parsers and
                an interactive installer, symlink or copy, your choice.
            </>
        ),
        stack: "node · markdown · zero deps",
        code: "https://github.com/thatmike1/claude-skills",
    },
    {
        name: "aw-watcher-git",
        tagline: "time tracking that knows which repo i’m in",
        body: (
            <>
                an activitywatch watcher that logs which repo and branch i'm actually working in, no
                matter the editor or terminal. three layers of detection (filesystem events, window
                cross-checks, git status polling) so long uncommitted thinking still counts. it
                stores repo and branch, never file paths.
            </>
        ),
        stack: "python · watchdog · activitywatch",
        code: "https://github.com/thatmike1/aw-watcher-git",
    },
    {
        name: "ssscribe-landing-pages",
        tagline: "landing pages with actual personality",
        body: (
            <>
                marketing pages for a voice-note transcription bot. one shared page component themed
                entirely through css variables, so the next product is a class swap, not a fork.
                handcoded chunky look: ink borders, hard shadows, and a dot grid that follows your
                cursor around.
            </>
        ),
        stack: "react 19 · tailwind 4 · gsap",
        code: "https://github.com/thatmike1/ssscribe-landing-pages",
    },
];

function Home() {
    return (
        <main>
            <header className="hero">
                <SandHero />
                <div className="container hero-copy">
                    <h1>i make stuff.</h1>
                    <p className="lede">
                        i'm mike, a frontend dev in czechia. i do stuff, sometimes it works and
                        sometimes it doesn't, but give me enough time and i'll make it work.{" "}
                        <em>probably.</em>
                    </p>
                    <p className="hero-note">
                        the sand up there is real, go make a mess. it's a tiny cousin of{" "}
                        <a href="https://github.com/thatmike1/powder-lab">powder-lab</a>.
                    </p>
                </div>
            </header>

            <section className="projects" aria-labelledby="projects-heading">
                <div className="container">
                    <h2 id="projects-heading">things i made</h2>
                    <p className="section-sub">
                        all public, all on github, all built to scratch an itch.
                    </p>
                    <ul className="project-list">
                        {PROJECTS.map((p) => (
                            <li className="project" key={p.name}>
                                <div className="project-head">
                                    <a className="project-name" href={p.code}>
                                        {p.name}
                                        <span className="arrow" aria-hidden="true">
                                            {"↗"}
                                        </span>
                                    </a>
                                    <p className="project-tagline">{p.tagline}</p>
                                    <p className="project-stack">{p.stack}</p>
                                </div>
                                <div className="project-body">
                                    <p>{p.body}</p>
                                    {p.live ? (
                                        <p className="project-live">
                                            <a href={p.live.href}>{p.live.label}</a>
                                        </p>
                                    ) : null}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <section className="interlude">
                <p className="container">
                    by day i'm the solo frontend dev on a react marketplace mvp for a czech startup.
                    by night, see above.
                </p>
            </section>

            <section className="smaller" aria-labelledby="smaller-heading">
                <div className="container">
                    <h2 id="smaller-heading">smaller things</h2>
                    <ul className="smaller-list">
                        <li>
                            <a href="https://github.com/thatmike1/vite-react-supabase-starter">
                                vite-react-supabase-starter
                            </a>{" "}
                            and{" "}
                            <a href="https://github.com/thatmike1/vite-react-shadcn-starter">
                                vite-react-shadcn-starter
                            </a>
                            : the two starters i clone so future me skips a day of wiring. react 19,
                            tanstack query, auth, the boring parts done.
                        </li>
                        <li>
                            <a href="https://github.com/thatmike1/backlogged">backlogged</a>: a game
                            library with an ai recommender that remembers what it already suggested.
                            probably abandoned. i'm being honest with you.
                        </li>
                    </ul>
                </div>
            </section>

            <footer className="footer">
                <div className="container">
                    <h2>say hi</h2>
                    <p className="footer-lede">
                        no contact form, i'm one guy. email me or poke around the github.
                    </p>
                    <ul className="footer-links">
                        <li>
                            <a href="https://github.com/thatmike1">github.com/thatmike1</a>
                        </li>
                        <li>
                            <a href="mailto:misa.psencik@gmail.com">misa.psencik@gmail.com</a>
                        </li>
                    </ul>
                    <p className="colophon">
                        built with tanstack start, because i lowkey hate next.js. set in sora, which
                        is also my dog's name. no cookies, no analytics, just sand.
                        <br />© 2026 michal pšenčík · czechia
                    </p>
                </div>
            </footer>
        </main>
    );
}
