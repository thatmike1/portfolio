import type { Shot } from "./responsive-image";
import { SHOWCASE_IMAGES } from "./showcase-images-generated";

/*
 * every project fact on the site lives here, so the homepage and /hire cannot drift.
 * house rules for the words: all lowercase, names included (other people's products
 * too: t3 code, spotify, stripe; code identifiers like appendChild keep their own
 * case), first person, and each project names one clever
 * thing it does rather than a list of features. claims are checked against the
 * project's own code, see the portfolio-lab inventory.
 */

export type ShowcaseLink = { href: string; label: string };

export type ShowcaseProject = {
    id: string;
    name: string;
    /** a few words under the name in the selector */
    purpose: string;
    /** the hook: why it exists, in one breath */
    summary: string;
    /** what it is, then the one implementation detail worth telling a developer about */
    detail: string;
    /** who uses it and where it lives */
    use: string;
    stack: string;
    /** the first one leads; the rest are a click away in the viewer */
    shots: Shot[];
    links: ShowcaseLink[];
};

/** a smaller thing: a name, a line or two, and somewhere to go */
export type ShelfItem = {
    id: string;
    name: string;
    href?: string;
    text: string;
    links: ShowcaseLink[];
};

/** the six featured projects, in the order the selector shows them */
export const SHOWCASE: ShowcaseProject[] = [
    {
        id: "beadside",
        name: "beadside",
        purpose: "where i talk back to my agents",
        summary: "my agents keep a backlog. this is where i answer them.",
        detail: "a local board over beads, the issue tracker my agent sessions file their work into. find a thing, read what happened, leave a note the next session reads first. the bit i like: the beads event journal is only a doorbell. a ring makes the server re-export the whole store, and the page hears \"changed\" only when a hash of that export actually moved, so it stays live without twitching on every write.",
        use: "i use it every day · open source",
        stack: "react · typescript · hono · tanstack query · sse",
        shots: [
            {
                image: SHOWCASE_IMAGES.beadside,
                alt: "beadside: an invented backlog grouped by lane, beside an open issue with a human note and an agent's reply",
                caption: "the real board, with an invented backlog",
            },
        ],
        links: [{ href: "https://github.com/thatmike1/beadside", label: "get beadside" }],
    },
    {
        id: "tally",
        name: "tally",
        purpose: "what ate my five-hour limit?",
        summary: "the usage meter gives me a number. i wanted to know who spent it.",
        detail: "tally lines the account's usage readings up with my local agent transcripts and shows which sessions moved the meter and how the week is pacing. there is no formula from tokens to meter points (the same dollar of usage bought anywhere from 0.74 to 1.82 points across six blocks i measured), so tally never invents one: it splits each measured jump by the sessions' share of the cost, and where nothing was measured it shows dollars and says so.",
        use: "runs on my machine all day · source on github",
        stack: "react · typescript · hono · node:sqlite · python",
        shots: [
            {
                image: SHOWCASE_IMAGES.tally,
                alt: "tally explains a synthetic usage block and splits it across three invented development sessions",
                caption: "the running app, fed entirely synthetic usage and sessions",
            },
        ],
        links: [{ href: "https://github.com/thatmike1/tally", label: "see the source" }],
    },
    {
        id: "font-tinder",
        name: "font tinder",
        purpose: "find the font you stop noticing",
        summary: "swipe on typefaces until one stops getting in the way.",
        detail: "fonts show up in a chat, a long read or a bit of ui, names hidden, each one sized to the same x-height and as close to the same stroke weight as the family allows, so you judge the shape and not the size. while you are still looking, it has already refit its taste model as if you swiped yes and as if you swiped no, and preloaded the next font for both. so the next card is simply there.",
        use: "public app · passkeys keep your picks across devices",
        stack: "react · typescript · fontkit · umap · passkeys",
        shots: [
            {
                image: SHOWCASE_IMAGES.fonts,
                alt: "font tinder shows an unnamed font in a chat and in a long reading sample, with swipe controls below",
                caption: "judge the font in the places you'll actually read it",
            },
        ],
        links: [{ href: "https://fonts.thatmike1.dev/", label: "find your font" }],
    },
    {
        id: "diskzokej",
        name: "diskzokej",
        purpose: "something good in the background",
        summary: "i made myself a dj. then a radio dial for everyone else.",
        detail: "my version drives my spotify and keeps an editable tape of what plays next. the public one is a dial of about sixty internet stations, from drones to very unquiet things. ask it for a mood and one model call picks the station, but the answer's schema only allows ids of stations on the dial right now, so it can't tune to one it made up.",
        use: "i listen all day · the dial needs no account",
        stack: "react · dependency-free node · spotify · icy stream metadata",
        shots: [
            {
                image: SHOWCASE_IMAGES.diskzokej,
                alt: "diskzokej's public radio dial with stations laid out from drift to loud, and a quiet player",
                caption: "the public dial · it stays quiet until you press play",
            },
        ],
        links: [{ href: "https://diskzokej.thatmike1.dev/", label: "turn the dial" }],
    },
    {
        id: "model-map",
        name: "model map",
        purpose: "which model is worth it, at which effort",
        summary: "price per token is a terrible way to pick a model.",
        detail: "every model at every reasoning effort, plotted by artificial analysis's intelligence score against what one benchmark task costs, reasoning tokens included. filter it, pin a few, follow the frontier. where the source doesn't publish that cost, a python pipeline recomputes it from the index's own task weights, and refuses the weights unless they still add up to one.",
        use: "public · i route my own work with it",
        stack: "python · vanilla js · hand-drawn svg charts",
        shots: [
            {
                image: SHOWCASE_IMAGES.models,
                alt: "model map's sortable table of models and reasoning efforts, with cost per task and benchmark filters",
                caption: "a snapshot; today's ranking has probably moved",
            },
        ],
        links: [{ href: "https://models.thatmike1.dev/", label: "explore the map" }],
    },
    {
        id: "t3-code",
        name: "t3 code, forked",
        purpose: "my daily driver, made more mine",
        summary: "i live in this app, so i started fixing the small things.",
        detail: "a fork of t3 code, the desktop app for agent threads, with ctrl+tab switching, effort shortcuts, sidebar widgets fed by scripts, child threads nested under the thread that started them, and links into beadside. upstream made the app; those are mine. the dull part i'm proudest of: the parent links live in a table of the fork's own, created at startup rather than as a numbered migration, so upstream's migrations can never collide with it.",
        use: "i work in it every day · linux build + an interactive showcase",
        stack: "typescript · react · electron · sqlite",
        shots: [
            {
                image: SHOWCASE_IMAGES.t3,
                alt: "the t3 code fork's showcase site walks through the keyboard, sidebar, widget and issue-link additions in a demo thread",
                caption: "the showcase site: click through the additions before installing anything",
            },
        ],
        links: [
            { href: "https://t3.thatmike1.dev/", label: "try the extras" },
            { href: "https://github.com/thatmike1/t3code", label: "the fork" },
        ],
    },
];

/** products off the main path: one for sale, one for the household */
export const SUPPORTING: ShowcaseProject[] = [
    {
        id: "good-cookie",
        name: "good cookie",
        purpose: "privacy pages and a consent banner, bought once",
        summary: "one payment, your own files.",
        detail: "a short wizard turns a site's answers into privacy pages and a consent banner you host yourself, $29 once. the banner is the part people try to break: tagged scripts sit inert as text/plain, and anything a page injects later gets caught at appendChild and insertBefore, with a mutation observer as the backstop, and swapped for an inert clone until consent.",
        use: "live and for sale · a small business experiment",
        stack: "node · express · stripe · jszip · vanilla js banner",
        shots: [
            {
                image: SHOWCASE_IMAGES["good-cookie"],
                alt: "good cookie's live demo: its consent banner holding back a tracking script on an invented shop",
                caption: "the working banner demo, on a made-up shop",
            },
        ],
        links: [{ href: "https://goodcookie.app/", label: "try the banner" }],
    },
    {
        id: "nakup",
        name: "nákup",
        purpose: "a grocery list for two",
        summary: "a grocery list for two people, one ink each.",
        detail: "it works in the supermarket basement and catches up when signal comes back. the same reducer runs on the phone and on the server; the phone replays its unsent changes on top of the last thing the server said, and every change carries an id minted on the phone, so a retry after a lost reply does nothing instead of adding the milk twice. move an item to another aisle once and it remembers.",
        use: "in real household use · private, shown here with invented groceries",
        stack: "react · typescript · dependency-free node · sse · service worker",
        shots: [
            {
                image: SHOWCASE_IMAGES.nakup,
                alt: "nákup with invented groceries and two anonymous people, in blue and yellow inks",
                caption: "the actual app · invented groceries and people",
            },
        ],
        links: [],
    },
];

/** smaller things, still alive */
export const SHELF: ShelfItem[] = [
    {
        id: "powder-lab",
        name: "powder lab",
        href: "https://powder.ssscribe.app/",
        text: "falling sand with reactive materials and lockstep multiplayer: only inputs cross the wire. the catch is that sleeping chunks are part of the netcode. a skipped chunk draws no random numbers, so which chunks are awake goes into the snapshot and the checksum, or a joiner drifts. the sand up top is its little cousin.",
        links: [{ href: "https://github.com/thatmike1/powder-lab", label: "source" }],
    },
    {
        id: "ssscribe",
        name: "ssscribe",
        text: "speak on my phone, get the text on my laptop. inserting a row is the whole api: the phone uploads a voice capture, a pocketbase hook sends it to deepgram and drops the audio, and every open device watches the text arrive. private and self-hosted.",
        links: [{ href: "/ssscribe/desktop.webp", label: "early design study" }],
    },
    {
        id: "reader",
        name: "reader",
        href: "https://read.thatmike1.dev/",
        text: "a finite edition instead of an endless feed: a few pieces a day, then it's done. your place is a paragraph, not a scroll position. each block's id is a hash of its text, pinned to a saved version of the article, so the marker survives a bigger font and the source editing the piece.",
        links: [],
    },
];

/** retired or cold, kept honest */
export const ARCHIVE: ShelfItem[] = [
    {
        id: "on-task",
        name: "on-task",
        href: "https://ontask.ssscribe.app/",
        text: "a desktop creature that noticed when i drifted. the daemon is retired; the site still runs a port of its loop on you, with the clock sped up.",
        links: [],
    },
    {
        id: "cc-bench",
        name: "cc-bench",
        href: "https://thatmike1.github.io/cc-bench/",
        text: "an instrument for measuring what an agent config actually changes. the tool is built; the one experiment i ran was inconclusive, and the question is still open.",
        links: [{ href: "https://github.com/thatmike1/cc-bench", label: "source" }],
    },
    {
        id: "aw-watcher-git",
        name: "aw-watcher-git",
        href: "https://github.com/thatmike1/aw-watcher-git",
        text: "repo and branch tracking for activitywatch, whichever editor or agent is doing the typing.",
        links: [],
    },
];

/** what /hire leads with: the tools i'm proudest of, the public apps, and the one for sale */
export const HIRE_PICKS: ShowcaseProject[] = [
    "beadside",
    "tally",
    "font-tinder",
    "t3-code",
    "diskzokej",
    "model-map",
    "good-cookie",
].map((id) => {
    const project = [...SHOWCASE, ...SUPPORTING].find((p) => p.id === id);
    if (!project) throw new Error(`no project called ${id}`);
    return project;
});

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
