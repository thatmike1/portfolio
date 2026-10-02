import { createFileRoute } from "@tanstack/react-router";
import { WeatherHero } from "../components/weather-hero";
import { HeroCopy } from "../components/hero-copy";
import { GrainCursor } from "../components/grain-cursor";
import { ExperienceCustody } from "../components/experience-custody";
import { LightboxProvider } from "../components/lightbox";
import { ProjectEntry, RoomRail } from "../components/project-collection";
import { ITCHES, SHOWCASE } from "../lib/showcase";

export const Route = createFileRoute("/")({ component: Home });

/**
 * the heavyweights get a spread each, the story on alternating sides of a shot drawn
 * at its own size; the two after them share a row; the itches share the next
 */
const SPREADS = SHOWCASE.slice(0, 4);
const PAIR = SHOWCASE.slice(4);
const [GOOD_COOKIE, NAKUP] = ITCHES;

function Home() {
    return (
        <LightboxProvider>
            <main>
                <GrainCursor />
                <header className="hero" id="top">
                    <WeatherHero>
                        <HeroCopy wide />
                    </WeatherHero>
                </header>

                <div className="room">
                    <RoomRail>
                        <div className="rail-foot">
                            <p>
                                <a href="mailto:misa.psencik@gmail.com">misa.psencik@gmail.com</a>
                            </p>
                            <p className="rail-foot-row">
                                <a href="/hire">hiring? the short version →</a>
                                <a href="#top" className="rail-up">
                                    back to the sand ↑
                                </a>
                            </p>
                        </div>
                    </RoomRail>

                    <div className="field">
                        <section
                            className="chapter chapter--kept"
                            id="things-i-made"
                            aria-labelledby="collection-heading"
                        >
                            {SPREADS.map((project, i) => (
                                <ProjectEntry
                                    key={project.id}
                                    project={project}
                                    number={i + 1}
                                    side={i % 2 ? "right" : "left"}
                                    priority={i === 0}
                                />
                            ))}
                            <div className="pair">
                                {PAIR.map((project, i) => (
                                    <ProjectEntry
                                        key={project.id}
                                        project={project}
                                        number={SPREADS.length + i + 1}
                                    />
                                ))}
                            </div>
                        </section>

                        <section
                            className="chapter chapter--itches"
                            id="different-itches"
                            aria-labelledby="itches-heading"
                        >
                            <header className="chapter-head">
                                <h2 id="itches-heading">different itches.</h2>
                                <p>
                                    not tools for my desk: a small business with a checkout, and a
                                    list that lives on two phones in one household.
                                </p>
                            </header>
                            <div className="itches">
                                <ProjectEntry project={GOOD_COOKIE} number={SHOWCASE.length + 1} />
                                <ProjectEntry
                                    project={NAKUP}
                                    number={SHOWCASE.length + 2}
                                    portrait
                                />
                            </div>
                        </section>

                        <section
                            className="chapter chapter--shelf"
                            id="smaller-things"
                            aria-labelledby="shelf-heading"
                        >
                            <header className="chapter-head">
                                <h2 id="shelf-heading">a little room to play.</h2>
                                <p>smaller things, and the ones that came before them.</p>
                            </header>
                            <ul className="shelf">
                                <li id="powder-lab">
                                    <h3>
                                        <a href="https://powder.ssscribe.app/">powder lab</a>
                                    </h3>
                                    <p>
                                        falling sand, reactive materials and deterministic
                                        multiplayer. react does the buttons; the simulation does the
                                        pixels. the sand up top is its little cousin.{" "}
                                        <a href="https://github.com/thatmike1/powder-lab">source</a>
                                    </p>
                                </li>
                                <li id="ssscribe">
                                    <h3>ssscribe</h3>
                                    <p>
                                        speak on my phone, get copy-ready text on my laptop. a
                                        private, self-hosted transcription pwa with realtime sync
                                        and ai transforms. react, pocketbase and deepgram.{" "}
                                        <a href="/ssscribe/desktop.webp">early design study</a>
                                    </p>
                                </li>
                                <li id="reader">
                                    <h3>
                                        <a href="https://read.thatmike1.dev/">Reader</a>
                                    </h3>
                                    <p>
                                        a finite edition instead of an endless feed. exact reading
                                        markers, guest storage and account sync, so coming back
                                        means continuing rather than starting over.
                                    </p>
                                </li>
                                <li className="shelf-archive">
                                    <details>
                                        <summary>older experiments, still worth a look</summary>
                                        <ul>
                                            <li>
                                                <a href="https://ontask.ssscribe.app/">on-task</a>:
                                                a desktop creature that noticed when i drifted. the
                                                daemon is retired; the interactive site survives.
                                            </li>
                                            <li>
                                                <a href="https://thatmike1.github.io/cc-bench/">
                                                    cc-bench
                                                </a>
                                                : an instrument for measuring what an agent config
                                                changes. the tool is built; the research question is
                                                still open.
                                            </li>
                                            <li>
                                                <a href="https://github.com/thatmike1/aw-watcher-git">
                                                    aw-watcher-git
                                                </a>
                                                : editor-independent repo and branch tracking for
                                                activitywatch.
                                            </li>
                                        </ul>
                                    </details>
                                </li>
                            </ul>
                        </section>

                        <ExperienceCustody />
                    </div>
                </div>

                <footer className="footer footer--room" id="say-hi">
                    <div className="footer-grid">
                        <div className="footer-hello">
                            <h2>say hi</h2>
                            <p className="footer-lede">
                                no contact form, i'm one guy. email me or poke around the github.
                            </p>
                        </div>
                        <ul className="footer-links">
                            <li>
                                <a href="mailto:misa.psencik@gmail.com">misa.psencik@gmail.com</a>
                            </li>
                            <li>
                                <a href="https://github.com/thatmike1">github.com/thatmike1</a>
                            </li>
                            <li className="footer-hire">
                                <a href="/hire">hiring? there's a page for that</a>
                            </li>
                        </ul>
                        <p className="colophon">
                            built with tanstack start, because i lowkey hate next.js. set in sora,
                            which is also my dog's name. no cookies, anonymous pageviews, just sand.
                            <br />© 2026 michal pšenčík · czechia
                        </p>
                    </div>
                </footer>
            </main>
        </LightboxProvider>
    );
}
