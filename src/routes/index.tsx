import { createFileRoute } from "@tanstack/react-router";
import { WeatherHero } from "../components/weather-hero";
import { HeroCopy } from "../components/hero-copy";
import { GrainCursor } from "../components/grain-cursor";
import { ExperienceCustody } from "../components/experience-custody";
import { LightboxProvider } from "../components/lightbox";
import { SectionNav } from "../components/section-nav";
import { ProjectCollection, ProjectImage } from "../components/project-collection";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
    return (
        <LightboxProvider>
            <main>
                <GrainCursor />
                <SectionNav />
                <header className="hero" id="top">
                    <WeatherHero>
                        <HeroCopy />
                    </WeatherHero>
                </header>
                <ProjectCollection />
                <section className="further" id="smaller-things" aria-labelledby="further-heading">
                    <div className="container">
                        <h2 id="further-heading">different itches.</h2>
                        <p className="further-lede">
                            a small business, a shared list, a little room to play.
                        </p>
                        <div className="further-pair">
                            <article className="further-product" id="good-cookie">
                                <ProjectImage
                                    image={{
                                        src: "/showcase/good-cookie.webp",
                                        width: 1440,
                                        height: 900,
                                        alt: "Good Cookie's live demo shows its consent banner blocking a tracking script on an invented shop",
                                        caption: "a working banner demo on a made-up shop",
                                    }}
                                />
                                <h3>Good Cookie</h3>
                                <p>
                                    one payment, your own files. a short wizard turns a site's
                                    answers into privacy pages and a self-hosted consent banner. i
                                    built the product, checkout and zip delivery. a small business
                                    experiment, shipped and open for business.
                                </p>
                                <p className="collection-stack">
                                    node · express · stripe · file generation
                                </p>
                                <p>
                                    <a href="https://goodcookie.app/">
                                        try the banner
                                    </a>
                                </p>
                            </article>
                            <article className="further-product further-product--nakup" id="nakup">
                                <ProjectImage
                                    image={{
                                        src: "/showcase/nakup.webp",
                                        width: 440,
                                        height: 850,
                                        alt: "Nákup with invented groceries and anonymous people, in blue and yellow inks",
                                        caption: "the actual app · invented groceries and people",
                                    }}
                                />
                                <div>
                                    <h3>nákup</h3>
                                    <p>
                                        a grocery list for two people, one ink each. it works in the
                                        supermarket basement, syncs when signal returns, and
                                        remembers which aisle a thing belongs in.
                                    </p>
                                    <p>
                                        small on purpose. optimistic operations, retry-safe sync and
                                        a list that gets easier to use the more you use it.
                                    </p>
                                    <p className="collection-stack">
                                        react · typescript · node · sse · offline replay
                                    </p>
                                    <p className="collection-use">
                                        in real household use · private app
                                    </p>
                                </div>
                            </article>
                        </div>
                        <ul className="further-small">
                            <li id="powder-lab">
                                <h3>
                                    <a href="https://powder.ssscribe.app/">powder lab</a>
                                </h3>
                                <p>
                                    falling sand, reactive materials and deterministic multiplayer.
                                    react does the buttons; the simulation does the pixels. the sand
                                    above is its little cousin.{" "}
                                    <a href="https://github.com/thatmike1/powder-lab">source</a>.
                                </p>
                            </li>
                            <li id="ssscribe">
                                <h3>ssscribe</h3>
                                <p>
                                    speak on my phone, get copy-ready text on my laptop. a private,
                                    self-hosted transcription pwa with realtime sync and ai
                                    transforms. react, pocketbase and deepgram.{" "}
                                    <a href="/ssscribe/desktop.webp">early design study</a>.
                                </p>
                            </li>
                            <li id="reader">
                                <h3>
                                    <a href="https://read.thatmike1.dev/">Reader</a>
                                </h3>
                                <p>
                                    a finite edition instead of an endless feed. exact reading
                                    markers, guest storage and account sync, so coming back means
                                    continuing rather than starting over.
                                </p>
                            </li>
                        </ul>
                        <details className="collection-archive">
                            <summary>older experiments, still worth a look</summary>
                            <ul>
                                <li>
                                    <a href="https://ontask.ssscribe.app/">on-task</a>: a desktop
                                    creature that noticed when i drifted. the daemon is retired; the
                                    interactive site survives.
                                </li>
                                <li>
                                    <a href="https://thatmike1.github.io/cc-bench/">cc-bench</a>: an
                                    instrument for measuring what an agent config changes. the tool
                                    is built; the research question is still open.{" "}
                                    <a href="https://github.com/thatmike1/cc-bench">source</a>.
                                </li>
                                <li>
                                    <a href="https://github.com/thatmike1/aw-watcher-git">
                                        aw-watcher-git
                                    </a>
                                    : editor-independent repo and branch tracking for ActivityWatch.
                                </li>
                            </ul>
                        </details>
                    </div>
                </section>
                <ExperienceCustody />
                <footer className="footer" id="say-hi">
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
                        <p className="footer-hire">
                            <a href="/hire">hiring? there's a page for that</a>
                        </p>
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
