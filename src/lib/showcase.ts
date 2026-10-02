import { FACTS, count, day } from "./facts";
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

/** where a visitor can reach a project: open it, run the repo, or not at all */
export type Reach = "live" | "source" | "private";

/**
 * a project's story as one sentence with one marked phrase, the way the board
 * states a fact and lights the part that matters
 */
export type Line = { lead: string; mark: string; tail?: string };

export type ShowcaseProject = {
    id: string;
    name: string;
    /** a few words under the name in the selector */
    purpose: string;
    /** the hook: why it exists, in one breath */
    summary: string;
    /** the summary as a board headline: one sentence, one lit phrase */
    line: Line;
    /** what it is, then the one implementation detail worth telling a developer about */
    detail: string;
    /** one small thing that is true and checkable, said under its chart; numbers come from the facts file */
    fact?: string;
    /** who uses it and where it lives */
    use: string;
    stack: string;
    reach: Reach;
    /** a mono date line: when it started, and how old any number on the tile is */
    when: string;
    /** the first one leads; the rest are a click away in the viewer */
    shots: Shot[];
    links: ShowcaseLink[];
};

/** a smaller thing: a name, a line or two, and somewhere to go */
export type ShelfItem = {
    id: string;
    name: string;
    reach: Reach;
    href?: string;
    text: string;
    links: ShowcaseLink[];
};

/** the six featured projects, in the order the board shows them: the desk, then the choosers */
export const SHOWCASE: ShowcaseProject[] = [
    {
        id: "beadside",
        name: "beadside",
        purpose: "where i talk back to my agents",
        summary: "my agents keep a backlog. this is where i answer them.",
        line: { lead: "my agents keep a backlog. beadside is where i read it and ", mark: "talk back", tail: "." },
        detail: "a local board over beads, the issue tracker my agent sessions file their work into. find a thing, read what happened, leave a note the next session reads first. the bit i like: the beads event journal is only a doorbell. a ring makes the server re-export the whole store, and the page hears \"changed\" only when a hash of that export actually moved, so it stays live without twitching on every write.",
        fact: "issue #1 came from a beads maintainer: the tracker had grown a change feed, so the board learned to listen to it.",
        reach: "source",
        when: "public since 15 sep 2026 · mit licence",
        use: "i use it every day · open source",
        stack: "react · typescript · hono · tanstack query · sse",
        shots: [
            {
                image: SHOWCASE_IMAGES.beadside,
                alt: "beadside in its light look: an invented shop backlog grouped by lane, an agent's either-or question about a vat rounding bug waiting on the human, and a reply typed into the note box",
                caption: "an agent asks, i answer · invented backlog",
            },
            {
                image: SHOWCASE_IMAGES["beadside-note"],
                alt: "beadside in its dark look: a webhook issue carrying the human's unread note above an agent's proposal",
                caption: "the night look: a note the next session reads first",
            },
        ],
        links: [{ href: "https://github.com/thatmike1/beadside", label: "get beadside" }],
    },
    {
        id: "tally",
        name: "tally",
        purpose: "what ate my five-hour limit?",
        summary: "the usage meter gives me a number. i wanted to know who spent it.",
        line: { lead: "the five-hour meter is a number. tally tells me ", mark: "which session ate it", tail: "." },
        detail: "tally lines the account's usage readings up with my local agent transcripts and shows which sessions moved the meter and how the week is pacing. there is no formula from tokens to meter points (the same dollar of usage bought anywhere from 0.74 to 1.82 points across six blocks i measured), so tally never invents one: it splits each measured jump by the sessions' share of the cost, and where nothing was measured it shows dollars and says so.",
        fact: `${FACTS.tally.commits} commits between ${day(FACTS.tally.from, false)} and ${day(FACTS.tally.to, false)}, ${FACTS.tally.authors === 1 ? "every one of them mine" : "most of them mine"}: the parser, the index, the sampler and the screen.`,
        reach: "source",
        when: `since ${day(FACTS.tally.from)} · counted ${day(FACTS.tally.readOn)}`,
        use: "runs on my machine all day · open source",
        stack: "react · typescript · hono · node:sqlite · python",
        shots: [
            {
                image: SHOWCASE_IMAGES.tally,
                alt: "tally's today page on a synthetic week: 59% of the five-hour block used, the sessions that spent it, a when-did-it-happen chart and the weekly meters",
                caption: "the real app, fed an invented week of sessions and meter readings",
            },
            {
                image: SHOWCASE_IMAGES["tally-timeline"],
                alt: "tally's timeline at day zoom: meter lines, block pace, cost by token kind, and which project ate the points",
                caption: "the timeline: where a day's points went",
            },
        ],
        links: [{ href: "https://github.com/thatmike1/tally", label: "see the source" }],
    },
    {
        id: "t3-code",
        name: "t3 code, forked",
        purpose: "my daily driver, made more mine",
        summary: "i live in this app, so i started fixing the small things.",
        line: { lead: "i live in t3 code all day, so i gave it ", mark: "nine things", tail: " it was missing." },
        detail: "a fork of t3 code, the desktop app for agent threads, with ctrl+tab switching, effort shortcuts, sidebar widgets fed by scripts, child threads nested under the thread that started them, and links into beadside. upstream made the app; those are mine. the dull part i'm proudest of: the parent links live in a table of the fork's own, created at startup rather than as a numbered migration, so upstream's migrations can never collide with it.",
        fact: `${FACTS.t3.commits} commits of mine on top of upstream, +${count(FACTS.t3.added)} lines and −${count(FACTS.t3.removed)} across them. the counter in the screenshot is the whole branch on the day the site went up, the ${FACTS.t3.cherryPicked} commits i picked from upstream included. i add to their app; i barely touch it.`,
        reach: "live",
        when: `on upstream of ${day(FACTS.t3.upstreamFrom)} · counted ${day(FACTS.t3.readOn)}`,
        use: "i work in it every day · linux build + an interactive showcase",
        stack: "typescript · react · electron · sqlite",
        shots: [
            {
                image: SHOWCASE_IMAGES.t3,
                alt: "the t3 code fork's showcase site: a big heading beside a live mock of the app with numbered dots on each addition",
                caption: "the showcase site: click through the additions before installing anything",
            },
            {
                image: SHOWCASE_IMAGES["t3-switcher"],
                alt: "the showcase's ctrl+tab demo caught with the recent-threads switcher open",
                caption: "ctrl+tab between threads, the way an editor does it",
            },
        ],
        links: [
            { href: "https://t3.thatmike1.dev/", label: "try the extras" },
            { href: "https://github.com/thatmike1/t3code", label: "the fork" },
        ],
    },
    {
        id: "model-map",
        name: "model map",
        purpose: "which model is worth it, at which effort",
        summary: "price per token is a terrible way to pick a model.",
        line: { lead: "price per token is a bad way to pick a model, so i map ", mark: "what a whole task costs", tail: "." },
        detail: "every model at every reasoning effort, plotted by artificial analysis's intelligence score against what one benchmark task costs, reasoning tokens included. filter it, pin a few, follow the frontier. where the source doesn't publish that cost, a python pipeline recomputes it from the index's own task weights, and refuses the weights unless they still add up to one.",
        fact: `${FACTS.models.points} operating points on the ${day(FACTS.models.refreshed, false)} refresh, ${FACTS.models.priced} of them priced. the frontier is the ${FACTS.models.frontier} that nothing else on the map beats on both cost and score.`,
        reach: "live",
        when: `index v${FACTS.models.version} · refreshed ${day(FACTS.models.refreshed)}`,
        use: "public · i route my own work with it",
        stack: "python · vanilla js · hand-drawn svg charts",
        shots: [
            {
                image: SHOWCASE_IMAGES.models,
                alt: "model map's ranked table of models and reasoning efforts, with filters above and the best value in each column shaded",
                caption: "a snapshot; today's ranking has probably moved",
            },
            {
                image: SHOWCASE_IMAGES["models-frontier"],
                alt: "model map's score-against-cost chart: intelligence index against dollars per task on a log scale, with the frontier stepping through the best points",
                caption: "up and left is better; the line is the frontier",
            },
        ],
        links: [{ href: "https://models.thatmike1.dev/", label: "explore the map" }],
    },
    {
        id: "font-tinder",
        name: "font tinder",
        purpose: "find the font you stop noticing",
        summary: "swipe on typefaces until one stops getting in the way.",
        line: { lead: "a font picker that hides the names, so i choose ", mark: "with my eyes", tail: " instead." },
        detail: "fonts show up in a chat, a long read or a bit of ui, names hidden, each one sized to the same x-height and as close to the same stroke weight as the family allows, so you judge the shape and not the size. while you are still looking, it has already refit its taste model as if you swiped yes and as if you swiped no, and preloaded the next font for both. so the next card is simply there.",
        fact: `${count(FACTS.fonts.families)} google fonts families, measured and sorted into three decks, each with its own shape map. fonts that sit close on a map look alike, and the swipes walk you across it.`,
        reach: "live",
        when: `built 18 sep 2026 · catalog of ${day(FACTS.fonts.builtAt)}`,
        use: "public app · passkeys keep your picks across devices",
        stack: "react · typescript · fontkit · umap · passkeys",
        shots: [
            {
                image: SHOWCASE_IMAGES.fonts,
                alt: "font tinder's swipe screen: one unnamed font set in a chat, a long read, a small settings panel and a letter-detail panel, with nope, skip, love and like below",
                caption: "judge a font in the places you'll actually read it",
            },
        ],
        links: [{ href: "https://fonts.thatmike1.dev/", label: "find your font" }],
    },
    {
        id: "diskzokej",
        name: "diskzokej",
        purpose: "something good in the background",
        summary: "i made myself a dj. then a radio dial for everyone else.",
        line: { lead: "i made myself a dj, then ", mark: "a radio dial", tail: " for everyone else." },
        detail: "my version drives my spotify and keeps an editable tape of what plays next. the public one is a dial of about sixty internet stations, from drones to very unquiet things. ask it for a mood and one model call picks the station, but the answer's schema only allows ids of stations on the dial right now, so it can't tune to one it made up.",
        fact: `${FACTS.radio.stations} stations on ${FACTS.radio.lanes.length} lanes, from “${FACTS.radio.lanes[0].note}” to “${FACTS.radio.lanes.at(-1)?.note}”.`,
        reach: "live",
        when: `since 24 aug, redesigned 1 oct 2026 · counted ${day(FACTS.radio.readOn)}`,
        use: "i listen all day · the dial needs no account",
        stack: "react · dependency-free node · spotify · icy stream metadata",
        shots: [
            {
                image: SHOWCASE_IMAGES.diskzokej,
                alt: "diskzokej's public dial tuned to a synthwave station: the needle on the ruler, now playing, and every lane of stations in its own column",
                caption: "the public dial, on air",
            },
        ],
        links: [{ href: "https://diskzokej.thatmike1.dev/", label: "turn the dial" }],
    },
];

/** products off the main path: one for making noise, one for the household, one for sale */
export const SUPPORTING: ShowcaseProject[] = [
    {
        id: "breakbeat",
        name: "breakbeat loom",
        purpose: "chopped, swung drums to play with",
        summary: "finished breakbeats you can pull apart without losing the groove.",
        line: {
            lead: "a drum loom i built for chopped, swung breaks: swap the hats, the clicks or the kick, and ",
            mark: "the snare stays put",
            tail: ".",
        },
        detail: "a browser instrument for uk garage swing, jungle and the odd idm stutter. pick a feel, swap one written part at a time, cut the end of the loop into 2× and 3× repeats, keep the version you like. the bit i like: nothing is scheduled hit by hit. every change renders the whole two-bar loop to samples and swaps it in at the next loop boundary behind a 4 ms fade, so a busy tab can't make it stumble, and the wav export runs the same renderer the speakers do.",
        fact: `${FACTS.breakbeat.feels.length} feels, each with ${FACTS.breakbeat.partsPerLane} written kick parts, ${FACTS.breakbeat.partsPerLane} hat parts and ${FACTS.breakbeat.partsPerLane} rim-and-ghost parts: ${FACTS.breakbeat.combinations} combinations a feel, played on ${FACTS.breakbeat.recordings} recordings of one acoustic kit, avl drumkits' black pearl.`,
        reach: "live",
        when: `built in a day, 2 oct 2026 · counted ${day(FACTS.breakbeat.readOn)}`,
        use: "public, no account · sound starts only when you press play",
        stack: "vanilla js modules · web audio · no runtime dependencies",
        shots: [
            {
                image: SHOWCASE_IMAGES.breakbeat,
                alt: "breakbeat loom playing its fast jungle feel after a build-up and a cut-up: four feel cards, a five-lane preview of kick, snare, hat, rim and ghost with the playhead mid-loop, and the swap buttons under it",
                caption: "a preset, built up and cut up, caught mid-loop",
            },
            {
                image: SHOWCASE_IMAGES["breakbeat-editor"],
                alt: "breakbeat loom's beat editor: five lanes across two bars of sixteenths, open hats marked o, 2× and 3× cuts on the ghost notes, and the playhead's column lit",
                caption: "the editor: every hit, the open hats and the cuts",
            },
        ],
        links: [{ href: "https://breakbeat.thatmike1.dev/", label: "make a beat" }],
    },
    {
        id: "good-cookie",
        name: "good cookie",
        purpose: "privacy pages and a consent banner, bought once",
        summary: "one payment, your own files.",
        line: { lead: "privacy pages and a consent banner you pay for ", mark: "once", tail: ", then host yourself." },
        detail: "a short wizard turns a site's answers into privacy pages and a consent banner you host yourself, $29 once. the banner is the part people try to break: tagged scripts sit inert as text/plain, and anything a page injects later gets caught at appendChild and insertBefore, with a mutation observer as the backstop, and swapped for an inert clone until consent.",
        fact: "$29, one payment. the pack comes in english and czech, and you read the privacy policy it writes before you pay.",
        reach: "live",
        when: "for sale since 22 sep 2026",
        use: "live and for sale · a small business experiment",
        stack: "node · express · stripe · jszip · vanilla js banner",
        shots: [
            {
                image: SHOWCASE_IMAGES["good-cookie"],
                alt: "good cookie's homepage: the $29 pack pitch beside a live consent banner on a made-up shop, with a tracking-cookie probe and a readout of what got blocked",
                caption: "the real banner, on a made-up shop",
            },
        ],
        links: [{ href: "https://goodcookie.app/", label: "try the banner" }],
    },
    {
        id: "nakup",
        name: "nákup",
        purpose: "a grocery list for two",
        summary: "a grocery list for two people, one ink each.",
        line: { lead: "a grocery list for two people, ", mark: "one ink each", tail: "." },
        detail: "it works in the supermarket basement and catches up when signal comes back. the same reducer runs on the phone and on the server; the phone replays its unsent changes on top of the last thing the server said, and every change carries an id minted on the phone, so a retry after a lost reply does nothing instead of adding the milk twice. move an item to another aisle once and it remembers.",
        reach: "private",
        when: "in use since 20 sep 2026",
        use: "in real household use · private, shown here with invented groceries",
        stack: "react · typescript · dependency-free node · sse · service worker",
        shots: [
            {
                image: SHOWCASE_IMAGES["nakup-list"],
                alt: "nákup on tomáš's phone at home: fourteen things on the list in two inks, and a line saying bára is looking too",
                caption: "1 · at home, both inks on one list · an invented household",
            },
            {
                image: SHOWCASE_IMAGES["nakup-shop"],
                alt: "nákup on tomáš's phone in the shop: five of fifteen in the basket, and bára's late smetana ke šlehání lit in her ink",
                caption: "2 · in the shop, her late addition lights up",
            },
            {
                image: SHOWCASE_IMAGES["nakup-adds"],
                alt: "nákup on bára's phone while tomáš is in the shop: the header says he's shopping, the smetana is on her list too, and she is typing parmazán",
                caption: "3 · and she keeps adding while he shops",
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
        reach: "live",
        href: "https://powder.ssscribe.app/",
        text: "falling sand with reactive materials and lockstep multiplayer: only inputs cross the wire. the catch is that sleeping chunks are part of the netcode. a skipped chunk draws no random numbers, so which chunks are awake goes into the snapshot and the checksum, or a joiner drifts. the sand up top is its little cousin.",
        links: [{ href: "https://github.com/thatmike1/powder-lab", label: "source" }],
    },
    {
        id: "ssscribe",
        name: "ssscribe",
        reach: "private",
        text: "speak on my phone, get the text on my laptop. inserting a row is the whole api: the phone uploads a voice capture, a pocketbase hook sends it to deepgram and drops the audio, and every open device watches the text arrive. private and self-hosted.",
        links: [{ href: "/ssscribe/desktop.webp", label: "early design study" }],
    },
    {
        id: "reader",
        name: "reader",
        reach: "live",
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
        reach: "live",
        href: "https://ontask.ssscribe.app/",
        text: "a desktop creature that noticed when i drifted. the daemon is retired; the site still runs a port of its loop on you, with the clock sped up.",
        links: [],
    },
    {
        id: "cc-bench",
        name: "cc-bench",
        reach: "live",
        href: "https://thatmike1.github.io/cc-bench/",
        text: "an instrument for measuring what an agent config actually changes. the tool is built; the one experiment i ran was inconclusive, and the question is still open.",
        links: [{ href: "https://github.com/thatmike1/cc-bench", label: "source" }],
    },
    {
        id: "aw-watcher-git",
        name: "aw-watcher-git",
        reach: "source",
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
