/**
 * the paid-work half of the site, transcribed from the cv and then anonymized.
 *
 * the rule, inherited from PRODUCT.md §32 ("day-job work is NDA-bound, so it's
 * described without names"), applied the way the cv itself applies it:
 *   - the employer is named. it's his own contract, on his own cv, and the end
 *     date is the point right now.
 *   - the clients never are. "one of the largest czech energy groups" is exactly
 *     how the cv phrases it, and that's as specific as this gets.
 *   - no rates, no salary, no tax status, no phone number. those live on the pdf.
 *
 * commit counts are the flex here — PRODUCT.md §31, "specifics are the flex".
 * they came off the cv; if any of them drifted, fix them here and nowhere else.
 */

export type Engagement = {
    /** the build itself, lowercase */
    what: string;
    /** anonymized client, mono */
    client: string;
    /** the number that does the arguing. omit when there isn't an honest one */
    metric?: string;
    body: string;
    stack: string;
};

export type Role = {
    /** mono date range */
    when: string;
    title: string;
    org: string;
    /** mono sub-line: shape of the arrangement */
    note?: string;
    /** the one-paragraph frame; engagements carry the detail */
    summary?: string;
    engagements?: Array<Engagement>;
    /** for roles small enough that a breakdown would be padding */
    body?: string;
};

export const ROLES: Array<Role> = [
    {
        when: "apr 2024 — aug 2026",
        title: "full-stack developer",
        org: "atreo digital",
        note: "contract · software agency · fully remote",
        summary: "one contract, several clients at once, none of whom i can name. what i can tell you is what i owned and how much of it there was.",
        engagements: [
            {
                what: "job marketplace, ios + android",
                client: "expo / react native monorepo",
                metric: "900+ commits in three months",
                body: "roughly eighty percent of the app is mine: onboarding, profile, in-app chat with media, offer management, in-app purchases, push — and the api endpoints sitting behind them. the part i'd show you first is the map, with clustered pins, screen-space decluttering, and native marker rendering on both platforms. took it from rebrand through play signing to store-ready release builds.",
                stack: "react native · expo · typescript · nestjs · drizzle",
            },
            {
                what: "internal tools for an energy group",
                client: "one of the largest czech energy groups",
                metric: "550+ commits",
                body: "two internal applications, one of them an energy-management system. enterprise data density — the kind of screen where the table is the product and every column has an opinion about how it wants to be sorted.",
                stack: "react · typescript · mui · tanstack query · zustand",
            },
            {
                what: "staffing marketplace mvp",
                client: "a czech startup",
                metric: "450+ commits",
                body: "sole frontend dev: the entire frontend repo is my work, first commit to launch-ready. an external backend dev owns the api, so half the job is agreeing the contract before either of us builds against it, and the other half is deciding things alone and living with them.",
                stack: "react · typescript · vite · tanstack router + query · zustand · tailwind",
            },
            {
                what: "and the shorter ones",
                client: "pharmacy retail · manufacturing · b2b",
                body: "a career portal for the largest czech pharmacy chain, a platform for a measurement-industry manufacturer, and a b2b room planner that places equipment in 2d and 3d.",
                stack: "next.js · nestjs · typeorm",
            },
        ],
    },
];

/**
 * the pre-atreo era gets one line, not a row of its own. it was wordpress sites
 * for local clients — worth being honest about, not worth the same visual weight
 * as two years of contract react, which is what a second full row would imply.
 */
export const PRIOR = {
    when: "2023 — 2024",
    body: "before that, wordpress presentation sites for local clients, self-employed. not a career yet, but it's where the invoices started.",
};
