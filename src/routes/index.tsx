import { createFileRoute } from "@tanstack/react-router";
import { WeatherHero } from "../components/weather-hero";
import { HeroCopy } from "../components/hero-copy";
import { GrainCursor } from "../components/grain-cursor";
import { DayJob } from "../components/day-job";
import { LightboxProvider } from "../components/lightbox";
import { SectionNav } from "../components/section-nav";
import { ProjectCollection } from "../components/project-collection";
import { ShowcaseImage } from "../components/showcase-image";
import { ARCHIVE, SHELF, SUPPORTING } from "../lib/showcase";
import type { ShowcaseLink } from "../lib/showcase";

export const Route = createFileRoute("/")({ component: Home });

const [cookie, nakup] = SUPPORTING;

function Links({ links }: { links: ShowcaseLink[] }) {
    if (!links.length) return null;
    return (
        <ul className="collection-links">
            {links.map((link) => (
                <li key={link.href}>
                    <a href={link.href}>{link.label}</a>
                </li>
            ))}
        </ul>
    );
}

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
                            <article className="further-product" id={cookie.id}>
                                <ShowcaseImage
                                    shots={cookie.shots}
                                    sizes="(min-width: 1136px) 520px, (min-width: 601px) 46vw, calc(100vw - 3rem)"
                                />
                                <h3>{cookie.name}</h3>
                                <p className="further-summary">{cookie.summary}</p>
                                <p className="further-detail">{cookie.detail}</p>
                                <p className="collection-use">{cookie.use}</p>
                                <p className="collection-stack">{cookie.stack}</p>
                                <Links links={cookie.links} />
                            </article>
                            <article className="further-product further-product--nakup" id={nakup.id}>
                                <ShowcaseImage shots={nakup.shots} sizes="(min-width: 601px) 200px, 240px" />
                                <div>
                                    <h3>{nakup.name}</h3>
                                    <p className="further-summary">{nakup.summary}</p>
                                    <p className="further-detail">{nakup.detail}</p>
                                    <p className="collection-use">{nakup.use}</p>
                                    <p className="collection-stack">{nakup.stack}</p>
                                </div>
                            </article>
                        </div>
                        <ul className="further-small">
                            {SHELF.map((item) => (
                                <li id={item.id} key={item.id}>
                                    <h3>{item.href ? <a href={item.href}>{item.name}</a> : item.name}</h3>
                                    <p>
                                        {item.text}
                                        {item.links.map((link) => (
                                            <span key={link.href}>
                                                {" "}
                                                <a href={link.href}>{link.label}</a>.
                                            </span>
                                        ))}
                                    </p>
                                </li>
                            ))}
                        </ul>
                        <details className="collection-archive">
                            <summary>older experiments, still worth a look</summary>
                            <ul>
                                {ARCHIVE.map((item) => (
                                    <li key={item.id}>
                                        {item.href ? <a href={item.href}>{item.name}</a> : item.name}:{" "}
                                        {item.text}
                                        {item.links.map((link) => (
                                            <span key={link.href}>
                                                {" "}
                                                <a href={link.href}>{link.label}</a>.
                                            </span>
                                        ))}
                                    </li>
                                ))}
                            </ul>
                        </details>
                    </div>
                </section>
                <DayJob />
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
