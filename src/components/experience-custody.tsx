import type { ReactNode } from "react";
import "./experience-handover.css";

/**
 * variant e — "the handover", expanded. same concept and layout as variant d
 * (it reuses d's stylesheet wholesale), with the content corrected from mike's
 * own account of the work:
 *
 *   - the b2b room planner and the manufacturer platform were buried in a
 *     "few screens each" line that grossly undersold them. the planner alone
 *     carried babylon.js 3d work and an asset-optimization pipeline he built;
 *     the manufacturer platform's whole b2b section was his. both get real
 *     entries now.
 *   - the energy-group entry read like a cameo. 550+ commits isn't one.
 *   - the pharmacy portal genuinely was cms wiring, so it keeps the smallest
 *     claim on the page — which is what makes the big ones credible.
 *
 * still sorted by custody, descending, not by size. still one employer, which
 * is the only reason dropping chronology costs nothing.
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
        claim: "the 3d, and the pipeline that feeds it.",
        what: "b2b room planner · equipment placement in 2d and 3d",
        inventory: [
            {
                text: "an asset pipeline i built: models optimized on upload — textures compressed, everything converted to glb",
            },
            {
                text: "instancing in the room visualizer, plus the rest of the render-performance work",
            },
            { text: "planner features across 2d and 3d, in babylon.js" },
            { text: "the rest of the platform — not mine.", theirs: true },
        ],
        detail: (
            <>
                a room full of the same shelf shouldn't cost a mesh per shelf, and a vendor-uploaded
                model shouldn't ship at whatever size it was exported. the pipeline shrinks assets
                on the way in; the instancing keeps the scene cheap on the way out.
            </>
        ),
        receipt: <>no commit count to quote — the receipt here is the frame rate.</>,
        stack: "babylon.js · react · typescript",
    },
    {
        claim: "the whole b2b section.",
        what: "platform for a measurement-industry manufacturer",
        inventory: [
            { text: "the b2b section of the platform, end to end" },
            {
                text: "revised against rounds of client feedback — shipped, corrected, shipped again",
            },
            { text: "the rest of the platform — not mine.", theirs: true },
        ],
        detail: (
            <>
                owning a section through the feedback loop is its own skill: the client tells you
                what feels wrong, and you're the one who decides what that means in the code.
            </>
        ),
        receipt: <>a whole section of a live product, held through revisions</>,
        stack: "next.js · nestjs · typeorm",
    },
    {
        claim: "a sustained share of two internal apps.",
        what: "two internal tools · one of the largest czech energy groups",
        inventory: [
            {
                text: "screens and features across both apps, one of them an energy-management system",
            },
            { text: "the dense-table work: sorting, filtering, the states nobody demos" },
            { text: "the rest of both codebases — not mine. this one was a team.", theirs: true },
        ],
        detail: (
            <>
                550+ commits across two enterprise codebases is presence, not a cameo. the work is
                data density — the kind of screen where the table is the product and every column
                has its own opinion about how it wants to be sorted. unglamorous and genuinely hard
                to get right.
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
        claim: "the cms wiring.",
        what: "career portal · the largest czech pharmacy chain",
        inventory: [
            { text: "connected the cms and the plumbing around it" },
            { text: "the design, the content, most of the rest — not mine.", theirs: true },
        ],
        detail: (
            <>
                the smallest claim on this page, kept small on purpose. if every entry above claimed
                everything, you'd trust none of them.
            </>
        ),
        receipt: <>no commit count worth quoting. that's sort of the point.</>,
        stack: "next.js",
    },
];

export function ExperienceCustody() {
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

                {/* ordered on purpose: a screen reader announcing "1 of 6" is the claim */}
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
                    anything above. the decluttering pass, the asset pipeline, the api contract
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
