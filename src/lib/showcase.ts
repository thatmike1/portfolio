export type ShowcaseLink = { href: string; label: string };
export type ShowcaseProject = {
    id: string;
    name: string;
    purpose: string;
    summary: string;
    detail: string;
    use: string;
    stack: string;
    image: { src: string; width: number; height: number; alt: string; caption: string };
    links: ShowcaseLink[];
};

/** the homepage and recruiter shortlist share the same project facts, in the order mike ranks them */
export const SHOWCASE: ShowcaseProject[] = [
    {
        id: "beadside",
        name: "beadside",
        purpose: "a place to steer the work",
        summary: "my agents have a backlog. i wanted a way to talk back.",
        detail: "a local board over beads, the issue tracker. find the thing, read what happened, leave a note for the next agent. live updates keep it honest; keyboard navigation keeps it quick. the interesting bit is the handoff between a person and a pile of agent sessions.",
        use: "part of my daily workflow · open source",
        stack: "react · typescript · hono · tanstack query · sse",
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
        id: "tally",
        name: "tally",
        purpose: "what ate my five-hour limit?",
        summary: "usage meters are a number. i wanted an explanation.",
        detail: "tally joins account readings to local agent transcripts, then shows which sessions moved the meter, where the time went and how the week is pacing. measured, estimated and missing data get different treatment. the parser, index, sampler and screen are all mine.",
        use: "runs on my machine · open source",
        stack: "react · typescript · hono · sqlite · python",
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
        detail: "an interactive map of models at different reasoning efforts, ranked by the cost of a finished task. filter the table, pin a comparison, follow the quality–cost frontier. a python pipeline validates the source data; the page makes the trade-offs something i can actually use when routing work.",
        use: "public tool · built for decisions i make myself",
        stack: "python · data validation · javascript · interactive charts",
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
        detail: "a fork of T3 Code with thread switching, effort shortcuts, agent-launched child threads, script-fed widgets and links back to beadside. upstream made the app; i made these additions. the showcase lets you try the interactions before downloading the linux build.",
        use: "i work in it every day · public fork + interactive showcase",
        stack: "react · typescript · electron · local integrations",
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
    {
        id: "font-tinder",
        name: "font tinder",
        purpose: "find the font you stop noticing",
        summary: "a font picker that learns what my eyes like.",
        detail: "swipe on fonts inside a chat, a long read or a bit of ui. names stay hidden, x-height and stroke darkness stay matched, and the next pick learns from the last one. duel the shortlist, explore the shape map, then take the css home. passkeys keep your picks across devices.",
        use: "public app · i use it to choose type",
        stack: "react · typescript · font analysis · umap · passkeys",
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
        detail: "tell it what you're doing and it finds music that fits. my own version drives spotify; the public one is a dial of stations from quiet drones to very unquiet things. tuning, favorites, now-playing and the player all belong to the same little instrument.",
        use: "i listen all day · public radio needs no account",
        stack: "react · node · spotify · streaming audio · ai routing",
        image: {
            src: "/showcase/diskzokej.webp",
            width: 1440,
            height: 900,
            alt: "Diskzokej's public radio dial with stations arranged from drift to loud, and a quiet player",
            caption: "the public dial · it stays quiet until you press play",
        },
        links: [{ href: "https://diskzokej.thatmike1.dev/", label: "turn the dial" }],
    },
];
