import { createFileRoute } from "@tanstack/react-router";
import { WeatherHero } from "../components/weather-hero";
import { GrainCursor } from "../components/grain-cursor";
import { LightboxProvider } from "../components/lightbox";
import { Board, BOARD_INDEX } from "../components/board";
import { Dateline, SkyColumn, useSky } from "../components/sky-report";
import { HeroTitle } from "../components/hero-copy";
import { DAY_JOB } from "../lib/day-job";
import { PreviewSwitch, usePreview } from "../components/preview-switch";
import "../components/mast-variants.css";

export const Route = createFileRoute("/")({ component: Home });

const REACH_WORD = { live: "open it", source: "repo", private: "private" } as const;

/**
 * the index of everything on the board: how many open in a browser, how many are
 * repos, how many stay home, and a link to each. TEMP: it renders in the masthead
 * or, under the "index" preview layout, as the board's first strip
 */
function BoardIndexNav({ className, headingId }: { className: string; headingId: string }) {
    const live = BOARD_INDEX.filter((p) => p.reach === "live").length;
    const source = BOARD_INDEX.filter((p) => p.reach === "source").length;
    const home = BOARD_INDEX.filter((p) => p.reach === "private").length;
    return (
        <nav className={className} aria-labelledby={headingId}>
            <h2 className="mast-label" id={headingId}>
                <span>on the board</span>
                <span className="mast-count">{BOARD_INDEX.length}</span>
            </h2>
            <p className="mast-take">
                <em>{live} of these open</em>{" "}
                <i className="dot dot--live dot--inline" aria-hidden="true" /> in your browser,{" "}
                {source} are repos you can run{" "}
                <i className="dot dot--source dot--inline" aria-hidden="true" />, and {home} stay at
                home <i className="dot dot--private dot--inline" aria-hidden="true" />.
            </p>
            <ul className="mast-list">
                {BOARD_INDEX.map((p) => (
                    <li key={p.id}>
                        <a href={`#${p.id}`}>
                            <i className={`dot dot--${p.reach}`} aria-hidden="true" />
                            <span>{p.name}</span>
                            <span className="visually-hidden">, {REACH_WORD[p.reach]}</span>
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

/**
 * the front page is one board under one sky. the sand hero is the sky; the row
 * under it is the masthead, three hairline columns that sit between the falls:
 * who i am, what the sky is doing, and everything on the board below. the board
 * then fills the width the way a start page does, a shelf at a time
 */
function Home() {
    const { sky, onWeather } = useSky();
    const preview = usePreview();
    return (
        <LightboxProvider>
            <main className="fusion" data-mast={preview.mast}>
                <PreviewSwitch preview={preview} />
                <GrainCursor />
                <header className="hero" id="top">
                    <WeatherHero onWeather={onWeather}>
                        <div className="hero-copy masthead">
                            <section className="mast-col mast-letter" aria-label="who i am">
                                <Dateline />
                                <HeroTitle />
                                <p className="lede">
                                    i'm mike, a full-stack product engineer in czechia. react and
                                    typescript on top, node underneath, and i'd rather own the whole
                                    slice than half of it. i do stuff, sometimes it works and
                                    sometimes it doesn't, but give me enough time and i'll make it
                                    work. <em>probably.</em>
                                </p>
                                <p className="hero-doors">
                                    <a href="#the-desk">walk the board ↓</a>
                                    <a href="/hire">hiring? the short version →</a>
                                    <a href="#say-hi">say hi ↓</a>
                                </p>
                            </section>
                            <SkyColumn sky={sky} soraSays={preview.sora} />
                            {preview.mast === "index" ? null : (
                                <BoardIndexNav className="mast-col mast-index" headingId="index-heading" />
                            )}
                        </div>
                    </WeatherHero>
                </header>

                <div className="field">
                    {preview.mast === "index" ? (
                        <BoardIndexNav className="board-index" headingId="index-heading" />
                    ) : null}
                    <Board />

                    <footer className="signoff" id="say-hi">
                        <section className="signoff-col signoff-hi" aria-labelledby="hi-heading">
                            <h2 id="hi-heading">say hi</h2>
                            <p className="signoff-lede">
                                no contact form, i'm one guy. email me or poke around the github.
                            </p>
                            <ul className="signoff-links">
                                <li>
                                    <a href="mailto:misa.psencik@gmail.com">misa.psencik@gmail.com</a>
                                </li>
                                <li>
                                    <a href="https://github.com/thatmike1">github.com/thatmike1</a>
                                </li>
                            </ul>
                            <p className="signoff-hire">
                                <a href="/hire">hiring? there's a page for that</a>
                            </p>
                        </section>
                        <section
                            className="signoff-col"
                            id="what-was-mine"
                            aria-labelledby="day-job-heading"
                        >
                            <h2 className="board-label" id="day-job-heading">
                                recent day job
                            </h2>
                            <p className="signoff-take">{DAY_JOB}</p>
                        </section>
                        <section className="signoff-col" aria-labelledby="colophon-heading">
                            <h2 className="board-label" id="colophon-heading">
                                colophon
                            </h2>
                            <p className="colophon">
                                built with tanstack start, because i lowkey hate next.js. set in
                                sora, which is also my dog's name. no cookies, anonymous pageviews,
                                just sand.
                                <br />© 2026 michal pšenčík · czechia
                            </p>
                            <img
                                className="signoff-sora"
                                src="/sora/sora.webp"
                                alt="sora, a curly black and white havanese, seeing you off the end of the page"
                                width={96}
                                height={96}
                                loading="lazy"
                            />
                        </section>
                    </footer>
                </div>
            </main>
        </LightboxProvider>
    );
}
