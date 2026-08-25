import type { ReactNode } from "react";
import "./experience-custody.css";

/**
 * the paid-work half of the site: one contract, several clients, sorted by how
 * much of each build was actually his rather than by size or date.
 *
 * every number below is counted from the repos, not estimated — his commits by
 * author email over all branches, against the repo total. the counts are higher
 * than the cv's because the cv quoted only the two engagements it had room for.
 *
 * the hollow marks are load-bearing. naming the fifth of the app that wasn't his
 * is what makes the four fifths credible, and the pharmacy portal stays at the
 * bottom claiming almost nothing for the same reason. don't tidy the gaps away.
 *
 * clients are never named — atreo's own client ndas flow down. descriptors only,
 * phrased the way the cv phrases them. the employer is named; that's his own
 * contract and the end date is the point.
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
            { text: "the api itself: not mine. an external backend dev owned it.", theirs: true },
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
        claim: "four fifths of an energy-management system.",
        what: "internal ems · one of the largest czech energy groups",
        inventory: [
            {
                text: "the operations calendar: drag to move and resize shifts, live time labels, preview clamped at the grid edges",
            },
            {
                text: "per-location timezone handling, end to end: the api talks utc, the calendar doesn't lie about local time",
            },
            {
                text: "the oidc auth flow, hardened: token sync, 401 logout, the session states nobody specs",
            },
            {
                text: "dashboard widgets and charts, down to the mobile tooltips and sticky table headers",
            },
            { text: "the backend: not mine.", theirs: true },
        ],
        detail: (
            <>
                <span className="own-num">449</span> of the repo's{" "}
                <span className="own-num">552</span> commits are mine, from the first one. the hard
                part was never the calendar looking right. it was a drag interaction that stays
                honest at 00:00 and 24:00, across timezones, without a single off-by-one day.
            </>
        ),
        receipt: (
            <>
                <span className="own-num">449</span> of <span className="own-num">552</span> commits
                · ~81% of the repo
            </>
        ),
        stack: "react · typescript · vite · mui · tanstack query · zustand · daypilot",
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
                text: "the other fifth: not mine. i'm not going to pretend i know what's in it.",
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
        what: "b2b room planner · equipment placed in 2d and 3d",
        inventory: [
            {
                text: "a model-optimization service on the upload endpoint: gltfpack with texture compression, draco decode, everything normalized to glb",
            },
            {
                text: "the gltfpack binary built into the docker images, with a fallback path for when basisu isn't there",
            },
            {
                text: "a batch command that runs the whole existing product catalogue back through it",
            },
            {
                text: "instancing in the room visualizer, and the material work that makes instances safe to share",
            },
            {
                text: "automatic dimension detection from the mesh, so a vendor's model doesn't have to be measured by hand",
            },
            {
                text: "wall, window and door cutouts via csg, and the babylon.js 4 → 8 upgrade underneath all of it",
            },
            { text: "the rest of the platform: not mine. i owned the 3d.", theirs: true },
        ],
        detail: (
            <>
                a room full of the same shelf shouldn't cost a mesh per shelf, and a model a vendor
                uploads shouldn't ship at whatever size it happened to be exported at. the pipeline
                shrinks assets on the way in; the instancing keeps the scene cheap once they're in
                the room.
            </>
        ),
        receipt: (
            <>
                <span className="own-num">620+</span> commits · the largest single contributor to
                the repo
            </>
        ),
        stack: "babylon.js · react · next.js · nestjs · gltf-transform · draco",
    },
    {
        claim: "the b2b side, front to back.",
        what: "platform for a measurement-industry manufacturer",
        inventory: [
            {
                text: "carrier management and tracking numbers: migrations, entities, endpoints, ui, notification emails",
            },
            {
                text: "an erp export: per-side pricing breakdown, code mapping, xml generation, wired into b2b checkout",
            },
            {
                text: "a shared price-calculation service, so the frontend and backend stopped disagreeing about totals",
            },
            { text: "shipping breakdown with carrier detection and per-location allocation" },
            {
                text: "revised through rounds of client feedback: shipped, corrected, shipped again",
            },
            {
                text: "the rest of the platform: not mine. it's older than my contract.",
                theirs: true,
            },
        ],
        detail: (
            <>
                this is the one that made me stop calling myself a frontend dev. owning a section
                properly meant the migration and the nest service and the react form were all the
                same task, and the interesting bugs lived in the seams between them.
            </>
        ),
        receipt: (
            <>
                <span className="own-num">840+</span> commits · the largest single contributor to
                the repo
            </>
        ),
        stack: "next.js · nestjs · typeorm · typescript · styled-components",
    },
    {
        claim: "half of a customer-monitoring portal.",
        what: "internal portal · the same energy group",
        inventory: [
            {
                text: "server-side pagination, search, sorting and filtering across every table in the app",
            },
            { text: "a column-sort and filter popover built once and reused everywhere" },
            {
                text: "overview widgets and charts, plus the fullscreen detail views and csv / xlsx export",
            },
            { text: "the other half: not mine. this one was a team.", theirs: true },
        ],
        detail: (
            <>
                enterprise data density: the kind of screen where the table is the product and every
                column has its own opinion about how it wants to be sorted. unglamorous, and the
                place where "just add sorting" quietly becomes an api negotiation.
            </>
        ),
        receipt: (
            <>
                <span className="own-num">369</span> of <span className="own-num">713</span> commits
                · ~51% of the repo
            </>
        ),
        stack: "react · typescript · vite · mui · tanstack query · zustand · azure msal",
    },
    {
        claim: "the cms wiring.",
        what: "career portal · the largest czech pharmacy chain",
        inventory: [
            { text: "connected the cms and the plumbing around it" },
            { text: "the design, the content, most of the rest: not mine.", theirs: true },
        ],
        detail: (
            <>
                the smallest claim on this page, kept small on purpose. if every entry above claimed
                everything, you'd have no reason to believe any of them.
            </>
        ),
        receipt: <>no commit count worth quoting. that's sort of the point.</>,
        stack: "next.js",
    },
];

export function ExperienceCustody() {
    return (
        <section className="own" id="what-was-mine" aria-labelledby="own-heading">
            <div className="container">
                <h2 id="own-heading">the day job</h2>
                <p className="section-sub">
                    one contract (atreo digital, apr 2024 to august 2026, fully remote) and
                    several clients at once, none of whom i can name. so here's the only part worth
                    telling you: how much of each thing i was actually holding.
                </p>
                <p className="own-sort">
                    sorted by how much of it was mine, not by how big it was. the counts are from
                    the repos, not from memory.
                </p>

                {/* ordered on purpose: a screen reader announcing "1 of 7" is the claim */}
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
                    <span className="own-prior-when">2023–2024</span>
                    before atreo: wordpress presentation sites for local clients, self-employed. not
                    a career yet, but it's where the invoices started.
                </p>

                <p className="own-check">
                    <strong>the obvious problem with all of this:</strong> every one of those repos
                    is private and i can't show you a single line. so: get me on a call and pick
                    anything above. the decluttering pass, the model pipeline, the timezone handling
                    in the calendar. you'll know inside five minutes whether i wrote it.
                </p>

                <p className="own-availability">
                    the atreo contract ends in august 2026, so from september i'm looking: contract
                    or full-time, remote, and happy to talk specifics that aren't on this page.{" "}
                    <a href="mailto:misa.psencik@gmail.com">misa.psencik@gmail.com</a>.
                </p>
            </div>
        </section>
    );
}
