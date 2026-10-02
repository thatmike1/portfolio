export type ShowcaseLink = { href: string; label: string };

/** where a visitor can reach a project: open it, run the repo, or not at all */
export type Reach = "live" | "source" | "private";

/**
 * a project's story as one sentence with one marked phrase, the way a board
 * states a fact and lights the part that matters
 */
export type Line = { lead: string; mark: string; tail?: string };

export type ShowcaseProject = {
    id: string;
    name: string;
    purpose: string;
    summary: string;
    /** the summary as a board headline: one sentence, one marked phrase */
    line: Line;
    detail: string;
    /** one small thing that is true and checkable, said under its chart */
    fact: string;
    use: string;
    stack: string;
    reach: Reach;
    /** a mono date line: when it started, or when the numbers were read */
    when: string;
    image: {
        src: string;
        width: number;
        height: number;
        alt: string;
        caption: string;
    };
    links: ShowcaseLink[];
};

/** the homepage and recruiter shortlist share the same project facts */
export const SHOWCASE: ShowcaseProject[] = [
    {
        id: "beadside",
        name: "beadside",
        purpose: "a place to steer the work",
        summary: "my agents have a backlog. i wanted a way to talk back.",
        line: { lead: "my agents keep a backlog. beadside is where i read it and ", mark: "talk back", tail: "." },
        detail: "a local board over beads, the issue tracker. find the thing, read what happened, leave a note for the next agent. live updates keep it honest; keyboard navigation keeps it quick. the interesting bit is the handoff between a person and a pile of agent sessions.",
        fact: "issue #1 came from a beads maintainer: the tracker had grown a change feed, so the board learned to listen to it.",
        use: "part of my daily workflow · open source",
        stack: "react · typescript · hono · tanstack query · sse",
        reach: "source",
        when: "public since 15 sep 2026, history squashed to publish",
        image: {
            src: "/showcase/beadside.webp",
            width: 1600,
            height: 900,
            alt: "Beadside: a demo backlog beside an issue with a human note and an agent reply",
            caption: "the real board, with an invented backlog",
        },
        links: [{ href: "https://github.com/thatmike1/beadside", label: "get beadside" }],
    },
    {
        id: "font-tinder",
        name: "font tinder",
        purpose: "find the font you stop noticing",
        summary: "a font picker that learns what my eyes like.",
        line: { lead: "a font picker that hides the names, so i choose ", mark: "with my eyes", tail: " instead." },
        detail: "swipe on fonts inside a chat, a long read or a bit of ui. names stay hidden, x-height and stroke darkness stay matched, and the next pick learns from the last one. duel the shortlist, explore the shape map, then take the css home. passkeys keep your picks across devices.",
        fact: "three decks, three shape maps. fonts that sit close on a map look alike, and the swipes walk you across it.",
        use: "public app · i use it to choose type",
        stack: "react · typescript · font analysis · umap · passkeys",
        reach: "live",
        when: "built 18 sep, rebuilt 23 sep 2026",
        image: {
            src: "/showcase/fonts.webp",
            width: 1440,
            height: 900,
            alt: "Font tinder compares an anonymous font in a chat and a long reading sample, with swipe controls below",
            caption: "judge the font in the places you'll actually read it",
        },
        links: [{ href: "https://fonts.thatmike1.dev/", label: "find your font" }],
    },
    {
        id: "diskzokej",
        name: "diskzokej",
        purpose: "something good in the background",
        summary: "i made myself a dj. now there's a radio dial for everyone.",
        line: { lead: "i made myself a dj, then ", mark: "a radio dial", tail: " for everyone else." },
        detail: "tell it what you're doing and it finds music that fits. my own version drives spotify; the public one is a dial of stations from quiet drones to very unquiet things. tuning, favorites, now-playing and the player all belong to the same little instrument.",
        fact: "60 stations on 8 lanes, from \u201cno beats, no words\u201d to \u201cnot for reading\u201d.",
        use: "i listen all day · public radio needs no account",
        stack: "react · node · spotify · streaming audio · ai routing",
        reach: "live",
        when: "since 24 aug, redesigned 1 oct 2026",
        image: {
            src: "/showcase/diskzokej.webp",
            width: 1440,
            height: 900,
            alt: "Diskzokej's public radio dial with stations arranged from drift to loud, and a quiet player",
            caption: "the public dial · it stays quiet until you press play",
        },
        links: [{ href: "https://diskzokej.thatmike1.dev/", label: "turn the dial" }],
    },
    {
        id: "tally",
        name: "tally",
        purpose: "what ate my five-hour limit?",
        summary: "usage meters are a number. i wanted an explanation.",
        line: { lead: "the five-hour meter is a number. tally tells me ", mark: "which session ate it", tail: "." },
        detail: "tally joins account readings to local agent transcripts, then shows which sessions moved the meter, where the time went and how the week is pacing. measured, estimated and missing data get different treatment. the parser, index, sampler and screen are all mine.",
        fact: "55 commits in three weeks, every one of them mine: the parser, the index, the sampler and the screen.",
        use: "runs on my machine · open source",
        stack: "react · typescript · hono · sqlite · python",
        reach: "source",
        when: "11 sep to 1 oct 2026",
        image: {
            src: "/showcase/tally.webp",
            width: 1440,
            height: 900,
            alt: "Tally explains a synthetic usage block and attributes it to three invented development sessions",
            caption: "the running app, fed entirely synthetic usage and sessions",
        },
        links: [{ href: "https://github.com/thatmike1/tally", label: "get tally" }],
    },
    {
        id: "model-map",
        name: "Model map",
        purpose: "compare the cost of getting it done",
        summary: "price per token is a terrible way to choose a model.",
        line: { lead: "price per token is a bad way to pick a model, so i map ", mark: "the cost of a finished task", tail: "." },
        detail: "an interactive map of models at different reasoning efforts, ranked by the cost of a finished task. filter the table, pin a comparison, follow the quality–cost frontier. a python pipeline validates the source data; the page makes the trade-offs something i can actually use when routing work.",
        fact: "177 operating points on the 29 sep refresh, 159 of them priced. the raspberry ones are the frontier: nothing on the map is both cheaper and smarter than those 13.",
        use: "public tool · built for decisions i make myself",
        stack: "python · data validation · javascript · interactive charts",
        reach: "live",
        when: "refreshed 29 sep 2026",
        image: {
            src: "/showcase/models.webp",
            width: 1440,
            height: 900,
            alt: "Model map's sortable model and reasoning-effort table, with cost-per-task and benchmark filters",
            caption: "a snapshot, not a promise that today's ranking stays the same",
        },
        links: [{ href: "https://models.thatmike1.dev/", label: "explore the map" }],
    },
    {
        id: "t3-code",
        name: "T3 Code, with extras",
        purpose: "my daily driver, made more mine",
        summary: "the small things you miss when you live in an app.",
        line: { lead: "i live in t3 code all day, so i gave it ", mark: "nine things", tail: " it was missing." },
        detail: "a fork of T3 Code with thread switching, effort shortcuts, agent-launched child threads, script-fed widgets and links back to beadside. upstream made the app; i made these additions. the showcase lets you try the interactions before downloading the linux build.",
        fact: "33 commits on top of upstream, +7,534 lines and \u2212107. i add to their app; i barely touch it.",
        use: "i work in it every day · public fork + interactive showcase",
        stack: "react · typescript · electron · local integrations",
        reach: "live",
        when: "against upstream main of 21 sep 2026",
        image: {
            src: "/showcase/t3.webp",
            width: 1440,
            height: 900,
            alt: "The T3 Code fork showcase highlights keyboard, sidebar, widget and issue-link additions in a demo thread",
            caption: "the interactive showcase of my additions to T3 Code",
        },
        links: [
            { href: "https://t3.thatmike1.dev/", label: "try the extras" },
            { href: "https://github.com/thatmike1/t3code", label: "the fork" },
        ],
    },
];

/** a fragment names a project only when it belongs to this collection */
export function projectIndex(hash: string): number {
    return SHOWCASE.findIndex((project) => `#${project.id}` === hash);
}

/** roving tabs wrap at the ends, including the up/down aliases */
export function nextProjectIndex(key: string, current: number, length: number): number | null {
    if (key === "Home") return 0;
    if (key === "End") return length - 1;
    if (key === "ArrowRight" || key === "ArrowDown") return (current + 1) % length;
    if (key === "ArrowLeft" || key === "ArrowUp") return (current + length - 1) % length;
    return null;
}
