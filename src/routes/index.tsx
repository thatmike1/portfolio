import { createFileRoute } from "@tanstack/react-router";
import type { CSSProperties, ReactNode } from "react";
import { SandHero } from "../components/sand-hero";

export const Route = createFileRoute("/")({ component: Home });

type Preview = {
    src: string;
    alt: string;
    /** the asset's real pixel size — declared on the img so nothing shifts or upscales */
    width: number;
    height: number;
    /** theme-swapped variant of the same shot, same dimensions */
    darkSrc?: string;
};

type ProjectPreview = {
    layout: "wide-phones" | "wide-panels" | "single";
    caption?: string;
    /** oklch tint for this project's screenshot shadows; falls back to raspberry in css */
    glow?: string;
    wide: Preview;
    supporting?: Array<Preview>;
};

type Project = {
    name: string;
    tagline: string;
    body: ReactNode;
    stack: string;
    code?: string;
    note?: string;
    preview?: ProjectPreview;
    live?: { href: string; label: string };
};

const PROJECTS: Array<Project> = [
    {
        name: "ssscribe",
        tagline: "speak or paste anywhere, it's text everywhere",
        body: (
            <>
                talk to my phone, paste from my laptop, and it all lands as text in one private feed
                that syncs to every device, copy-ready. then run ai on any capture: tldr it, clean
                up the transcription, pull out the todos, whatever. self-hosted on my own box,
                pocketbase doing realtime and storage, installable as a pwa. the snake from the
                landing pages survives here as a waveform that threads the ai outputs together.
            </>
        ),
        stack: "react 19 · tanstack · pocketbase · pwa · deepgram",
        note: "private during the build · public at launch",
        preview: {
            layout: "wide-phones",
            caption: "design mockups · the app itself is mid-build",
            glow: "oklch(0.62 0.16 60)",
            wide: {
                src: "/ssscribe/desktop.webp",
                alt: "ssscribe desktop — watch the stream",
                width: 1392,
                height: 868,
            },
            supporting: [
                {
                    src: "/ssscribe/stream.webp",
                    alt: "ssscribe stream feed on phone",
                    width: 392,
                    height: 848,
                },
                {
                    src: "/ssscribe/capture.webp",
                    alt: "ssscribe capture screen on phone",
                    width: 392,
                    height: 848,
                },
            ],
        },
    },
    {
        name: "on-task",
        tagline: "a creature that knows when i've drifted",
        body: (
            <>
                i declare what i'm working on and a little ink creature in the corner of my screen
                watches whether i actually do it. regexes over activitywatch handle the obvious
                calls; when it genuinely can't tell, it screenshots the screen and asks sonnet —
                announcing itself first, because a thing that watches you should say when it's
                looking. drift and it gets agitated. ignore it and it deflates rather than nags. the
                landing page runs the same loop on you while you read it — tab away and it'll
                notice.
            </>
        ),
        stack: "python · activitywatch · webgl2 · gtk3 · systemd · claude sonnet",
        note: "private repo · the site is public",
        live: { href: "https://ontask.ssscribe.app/", label: "it'll watch you read it" },
        preview: {
            layout: "wide-panels",
            caption:
                "the live landing page — it runs the real detection loop on you while you read it",
            glow: "oklch(0.6 0.15 230)",
            wide: {
                src: "/on-task/hero.webp",
                alt: "the on-task landing page: it knows what you said you'd do, and the ink creature is asleep next to it",
                width: 1440,
                height: 790,
            },
            supporting: [
                {
                    src: "/on-task/log-nudge.webp",
                    alt: "the session log the daemon writes, with a nudge card saying it won't repeat itself",
                    width: 1440,
                    height: 754,
                },
                {
                    src: "/on-task/ladder.webp",
                    alt: "the precedence ladder of watcher states, from no-task and on-task down to nudge",
                    width: 1440,
                    height: 838,
                },
            ],
        },
    },
    {
        name: "cc-bench",
        tagline: "does your CLAUDE.md actually do anything?",
        body: (
            <>
                everyone writes a CLAUDE.md full of "be concise" and "don't hedge", and nobody knows
                if any of it lands. this swaps the config, runs the same 48 prompts against a
                deliberately broken little repo, and counts what changed — words, hedges, lists,
                tool calls — instead of asking a model whether the answer got better. the first
                version couldn't produce a negative result, so i killed it and wrote down why. the
                landing page runs the real counters on whatever you paste in.
            </>
        ),
        stack: "node 22 · zero deps · bwrap sandbox · paired stats · 160 tests",
        note: "instrument built and tested · no findings yet",
        code: "https://github.com/thatmike1/cc-bench",
        live: { href: "https://thatmike1.github.io/cc-bench/", label: "paste your config in" },
        preview: {
            layout: "single",
            caption:
                "the counters on the page are the benchmark's own code — a guarded build step keeps them from drifting",
            glow: "oklch(0.45 0.13 30)",
            wide: {
                src: "/cc-bench/instrument.webp",
                darkSrc: "/cc-bench/instrument-dark.webp",
                alt: "the cc-bench fingerprint tool comparing a terse answer against a padded one, counter by counter",
                width: 916,
                height: 1097,
            },
        },
    },
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
                stores repo and branch, never file paths. on-task further up this page reads the
                same activitywatch buckets, so the creature knows which repo i've wandered out of.
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

type ShotVariant = "wide" | "single" | "panel" | "phone";

/**
 * one framed screenshot, linked to its own full-size asset so enlarging needs no javascript.
 * a shot with a darkSrc renders both variants and lets css pick — the dimensions match, so
 * the hidden one costs no layout.
 */
function PreviewShot({ shot, variant }: { shot: Preview; variant: ShotVariant }) {
    const frame = (src: string, theme?: "light" | "dark") => (
        <a
            key={src}
            className={`preview-frame preview-frame--${variant}${theme ? ` preview-frame--${theme}` : ""}`}
            href={src}
            target="_blank"
            rel="noopener"
            // never upscale a screenshot past its own pixels; its text stops being readable
            style={{ maxWidth: `min(100%, ${shot.width}px)` }}
        >
            <img
                className={`preview-shot preview-shot--${variant}`}
                src={src}
                alt={shot.alt}
                loading="lazy"
                width={shot.width}
                height={shot.height}
            />
        </a>
    );

    if (!shot.darkSrc) return frame(shot.src);

    return (
        <>
            {frame(shot.src, "light")}
            {frame(shot.darkSrc, "dark")}
        </>
    );
}

function PreviewFigure({ preview }: { preview: ProjectPreview }) {
    const leadVariant = preview.layout === "single" ? "single" : "wide";
    const supportVariant = preview.layout === "wide-panels" ? "panel" : "phone";

    // react's CSSProperties has no index signature for custom properties, so the cast is
    // the only way to hand --preview-glow to the stylesheet. a single layout is capped to
    // its own pixels here rather than on the frame, so the caption centres with the image.
    const figureStyle = {
        ...(preview.glow ? { "--preview-glow": preview.glow } : null),
        ...(preview.layout === "single"
            ? { maxWidth: `min(100%, ${preview.wide.width}px)` }
            : null),
    } as CSSProperties;

    return (
        <figure
            className={`project-preview project-preview--${preview.layout}`}
            style={figureStyle}
        >
            <PreviewShot shot={preview.wide} variant={leadVariant} />
            {preview.supporting?.length ? (
                <div className={`preview-supporting preview-supporting--${supportVariant}s`}>
                    {preview.supporting.map((shot) => (
                        <PreviewShot key={shot.src} shot={shot} variant={supportVariant} />
                    ))}
                </div>
            ) : null}
            {preview.caption ? (
                <figcaption className="preview-caption">{preview.caption}</figcaption>
            ) : null}
        </figure>
    );
}

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
                                    {p.code ? (
                                        <a className="project-name" href={p.code}>
                                            {p.name}
                                            <span className="arrow" aria-hidden="true">
                                                {"↗"}
                                            </span>
                                        </a>
                                    ) : (
                                        <span className="project-name project-name--static">
                                            {p.name}
                                        </span>
                                    )}
                                    <p className="project-tagline">{p.tagline}</p>
                                    <p className="project-stack">{p.stack}</p>
                                    {p.note ? <p className="project-note">{p.note}</p> : null}
                                </div>
                                <div className="project-body">
                                    <p>{p.body}</p>
                                    {p.live ? (
                                        <p className="project-live">
                                            <a href={p.live.href}>{p.live.label}</a>
                                        </p>
                                    ) : null}
                                </div>
                                {p.preview ? <PreviewFigure preview={p.preview} /> : null}
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
