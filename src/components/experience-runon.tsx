import type { ReactNode } from "react";
import "./experience-runon.css";

/**
 * variant c — "the run-on". concept by a subagent, built here as specced.
 *
 * the argument: a vertical list reads as *sequence*, and sequence is the single
 * most misleading thing you can say about this job. all four builds were live at
 * once and none of the clients knew about the others. so the section is one
 * unbroken sentence — no full stop anywhere until the availability line — with
 * the specifics hanging off it as numbered footnotes. the form does the work the
 * copy would otherwise have to claim.
 *
 * footnotes are also the typographic form of "i can't say that inline", which is
 * exactly the nda constraint. no javascript: the refs are in-page anchors, the
 * notes are always visible, and the cross-highlight is :has() — purely additive,
 * so nothing is lost where it isn't supported.
 */

type Note = {
    n: number;
    meta: string;
    body: ReactNode;
};

const NOTES: Array<Note> = [
    {
        n: 1,
        meta: "900+ commits in three months · react native · expo · typescript · nestjs · drizzle",
        body: (
            <>
                onboarding, profile, in-app chat with media, offer management, in-app purchases,
                push — and the api endpoints behind them. the map is the part i'd show you first:
                pins cluster, then declutter in screen space so two markers never end up sitting on
                each other, drawn as native markers on both platforms. i took it from rebrand
                through play signing to store-ready builds.
            </>
        ),
    },
    {
        n: 2,
        meta: "550+ commits · react · typescript · mui · tanstack query · zustand",
        body: (
            <>
                two internal applications, one of them an energy-management system. enterprise data
                density — the kind of screen where the table is the product and every column has an
                opinion about how it wants to be sorted.
            </>
        ),
    },
    {
        n: 3,
        meta: "450+ commits · react · vite · tanstack router + query · zustand · tailwind",
        body: (
            <>
                sole frontend dev, first commit to launch-ready. an external backend dev owned the
                api, so half the job was agreeing the contract before either of us built against it,
                and the other half was deciding things alone and living with them.
            </>
        ),
    },
    {
        n: 4,
        meta: "next.js · nestjs · typeorm",
        body: (
            <>
                a career portal for the largest czech pharmacy chain, a platform for a
                measurement-industry manufacturer, and a b2b room planner that places equipment in
                2d and 3d. short enough to be a list, long enough that they shipped.
            </>
        ),
    },
];

/** a phrase in the sentence that owns a footnote. plain ink plus a small numeral */
function Ref({ n, children }: { n: number; children: ReactNode }) {
    return (
        <a className="ref" id={`r${n}`} href={`#n${n}`}>
            {children}
            <sup className="ref-mark" aria-hidden="true">
                {n}
            </sup>
            <span className="sr-only"> (note {n})</span>
        </a>
    );
}

export function ExperienceRunon() {
    return (
        <section className="paid" aria-labelledby="paid-heading">
            <div className="container">
                <h2 id="paid-heading">meanwhile, for money</h2>
                <p className="paid-meta">
                    apr 2024 — aug 2026 · atreo digital · contract, software agency, fully remote ·
                    the clients are under nda, the work isn't
                </p>

                <div className="paid-spread">
                    {/* one sentence. it does not end — the availability line below resolves it */}
                    <p className="paid-runon">
                        for two years the honest answer to "what are you working on" was all of it
                        at once: a <Ref n={1}>job marketplace for ios and android</Ref>, where about
                        eighty percent of the app is mine and the map won't lie to you about where
                        its pins are, and{" "}
                        <Ref n={2}>two internal apps for one of the largest czech energy groups</Ref>
                        , and a <Ref n={3}>staffing mvp</Ref> where the entire frontend repo is my
                        work, and <Ref n={4}>three shorter builds</Ref> that went out in the gaps,
                        and none of them ever knew about the others
                    </p>

                    <ol className="paid-notes">
                        {NOTES.map((note) => (
                            <li className="note" id={`n${note.n}`} key={note.n}>
                                <a className="note-num" href={`#r${note.n}`}>
                                    {note.n}
                                </a>
                                <div className="note-text">
                                    <p className="note-meta">{note.meta}</p>
                                    <p className="note-body">{note.body}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>

                <p className="paid-prior">
                    before all this, 2023 to 2024: wordpress presentation sites for local clients,
                    self-employed. not a career yet, but it's where the invoices started
                </p>

                <p className="paid-open">
                    the atreo contract ends in august 2026, so from september i'm around. contract
                    or full-time, remote, and happy to talk about the parts that aren't on this
                    page. <a href="mailto:misa.psencik@gmail.com">misa.psencik@gmail.com</a>
                </p>
            </div>
        </section>
    );
}
