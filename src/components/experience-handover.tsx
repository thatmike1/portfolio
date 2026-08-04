import type { ReactNode } from "react";
import "./experience-handover.css";

/**
 * variant d — "the handover". concept by a subagent, built here as specced.
 *
 * the argument: a job list flattens every entry to "he was there", and leaves
 * the reader to guess how much of it was actually his — the number a skeptic
 * fills in is always lower than the truth. so entries are headlined by custody
 * and sorted by it, descending. that puts the 450-commit mvp above the
 * 900-commit app and the famous-sounding clients last, which is the opposite of
 * the argument a cv makes.
 *
 * the hollow marks are the load-bearing part: naming the fifth of the app that
 * wasn't his is what makes the four fifths credible. the gaps authenticate the
 * numbers, so don't tidy them away.
 *
 * NOTE FOR MIKE: the inventory lines are the one thing here not lifted verbatim
 * from the cv — they're derived from the stack plus "the entire frontend repo is
 * my work". that reasoning is sound but it isn't testimony, and the whole
 * concept is verifiability, so every bullet needs your yes before this ships.
 *
 * this only works because there is exactly one employer — dropping chronology
 * costs nothing when there's one contract. add a second and the axis collapses.
 */

type Line = { text: string; theirs?: boolean };

type Item = {
    claim: string;
    what: string;
    inventory: Array<Line>;
    detail: ReactNode;
    receipt: ReactNode;
    stack: string;
};

const ITEMS: Array<Item> = [
    {
        claim: "the entire frontend repo.",
        what: "staffing marketplace mvp · a czech startup",
        inventory: [
            { text: "every screen, first commit to launch-ready" },
            { text: "routing, the data layer, the caching" },
            { text: "state, styling, the component library" },
            { text: "the api contract, agreed before either of us built against it" },
            { text: "every decision nobody else was in the room to argue with" },
            { text: "the api itself — not mine. an external backend dev owned it.", theirs: true },
        ],
        detail: (
            <>
                sole frontend dev means the good version and the bad version of the same thing. the
                good version is that the whole repo is coherent because one person decided all of
                it. the bad version is that when a choice turned out wrong there was nobody to
                blame, so i just fixed it and kept the commit message honest.
            </>
        ),
        receipt: (
            <>
                <span className="own-num">450+</span> commits · sole frontend dev
            </>
        ),
        stack: "react · typescript · vite · tanstack router + query · zustand · tailwind",
    },
    {
        claim: "roughly four fifths of the app.",
        what: "job marketplace, ios + android · expo / react native monorepo",
        inventory: [
            { text: "onboarding" },
            { text: "profile" },
            { text: "in-app chat, media and all" },
            { text: "offer management" },
            { text: "in-app purchases and push" },
            { text: "the api endpoints sitting behind all of the above" },
            { text: "the map" },
            { text: "rebrand → play signing → store-ready builds" },
            {
                text: "the other fifth — not mine. i'm not going to pretend i know what's in it.",
                theirs: true,
            },
        ],
        detail: (
            <>
                the map is the part i'd show you first. clustered pins, screen-space decluttering so
                markers stop stacking on each other when you zoom, and native marker rendering on
                both platforms.
            </>
        ),
        receipt: (
            <>
                <span className="own-num">900+</span> commits in three months · taken to store-ready
                on both platforms
            </>
        ),
        stack: "react native · expo · typescript · nestjs · drizzle",
    },
    {
        claim: "a real share of two internal apps.",
        what: "two internal tools · one of the largest czech energy groups",
        inventory: [
            { text: "screens across both apps, one of them an energy-management system" },
            { text: "the dense-table work: sorting, filtering, the states nobody demos" },
            { text: "the rest of both codebases — not mine. this one was a team.", theirs: true },
        ],
        detail: (
            <>
                enterprise data density, which is the kind of screen where the table is the product
                and every column has its own opinion about how it wants to be sorted. unglamorous
                and genuinely hard to get right.
            </>
        ),
        receipt: (
            <>
                <span className="own-num">550+</span> commits
            </>
        ),
        stack: "react · typescript · mui · tanstack query · zustand",
    },
    {
        claim: "a few screens each, on three more.",
        what: "a career portal · a manufacturer's platform · a b2b room planner",
        inventory: [
            { text: "a career portal for the largest czech pharmacy chain" },
            { text: "a platform for a measurement-industry manufacturer" },
            { text: "a b2b planner that places equipment in a room in 2d and 3d" },
        ],
        detail: (
            <>
                short engagements, dropped in and out of. worth listing because they happened, not
                worth pretending they were mine.
            </>
        ),
        receipt: <>no commit counts worth quoting on these. that's sort of the point.</>,
        stack: "next.js · nestjs · typeorm",
    },
];

export function ExperienceHandover() {
    return (
        <section className="own" aria-labelledby="own-heading">
            <div className="container">
                <h2 id="own-heading">what was actually mine</h2>
                <p className="section-sub">
                    one contract — atreo digital, apr 2024 to august 2026, fully remote — and
                    several clients at once, none of whom i can name. so here's the only part worth
                    telling you: how much of each thing i was actually holding.
                </p>
                <p className="own-sort">
                    sorted by how much of it was mine. not by how big it was — the biggest one is
                    second.
                </p>

                {/* ordered on purpose: a screen reader announcing "1 of 4" is the claim */}
                <ol className="own-list">
                    {ITEMS.map((item) => (
                        <li className="own-item" key={item.claim}>
                            <h3 className="own-claim">{item.claim}</h3>
                            <p className="own-what">{item.what}</p>

                            <ul className="own-inventory">
                                {item.inventory.map((line) => (
                                    <li
                                        className={`own-line${line.theirs ? " is-theirs" : ""}`}
                                        key={line.text}
                                    >
                                        {line.text}
                                    </li>
                                ))}
                            </ul>

                            <div className="own-evidence">
                                <p className="own-detail">{item.detail}</p>
                                <p className="own-receipt">{item.receipt}</p>
                                <p className="own-stack">{item.stack}</p>
                            </div>
                        </li>
                    ))}
                </ol>

                <p className="own-prior">
                    <span className="own-prior-when">2023 — 2024</span>
                    before atreo: wordpress presentation sites for local clients, self-employed. not
                    a career yet, but it's where the invoices started.
                </p>

                <p className="own-check">
                    <strong>the obvious problem with all of this:</strong> every one of those repos
                    is private and i can't show you a single line. so — get me on a call and pick
                    anything above. the decluttering pass, the chat media pipeline, the api contract
                    argument. you'll know inside five minutes whether i wrote it.
                </p>

                <p className="own-availability">
                    the atreo contract ends in august 2026, so from september i'm looking — contract
                    or full-time, remote, and happy to talk specifics that aren't on this page.{" "}
                    <a href="mailto:misa.psencik@gmail.com">misa.psencik@gmail.com</a>.
                </p>
            </div>
        </section>
    );
}
