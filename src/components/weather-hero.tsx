import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
    AMBER,
    EMPTY,
    GLASS,
    ICE,
    INK,
    MATERIAL,
    MOSS,
    PACKED,
    PALETTES,
    RASP,
    SandEngine,
    SEED,
    SNOW,
    stampWord,
    WALL,
    WATER,
} from "../lib/sand-engine";
import { createFixedStep } from "../lib/fixed-step";
import { birdCells, Flock, PERCH } from "../lib/flock";
import { Fireflies, glow as flyGlow, nearest as nearestFly } from "../lib/fireflies";
import { drift as driftFlakes, freeze, thaw } from "../lib/frost";
import type { Flake } from "../lib/frost";
import { dampen, decay, germinate, grow, isSand } from "../lib/moss";
import type { MossWorld } from "../lib/moss";
import { crawl, snailCells, spawn as spawnSnail } from "../lib/snail";
import type { Snail } from "../lib/snail";
import { fishCells, spawn as spawnFish, swim } from "../lib/fish";
import type { Fish } from "../lib/fish";
import { LICK, REACH as TONGUE, frogCells, hop, spawn as spawnFrog } from "../lib/frog";
import type { Frog } from "../lib/frog";
import { applyTheme, readTheme, THEMES } from "../lib/theme";
import type { Theme } from "../lib/theme";

/**
 * the hero: a closed water cycle drawn at grain resolution, with the page's
 * theme as its time of day.
 *
 * the anthropic fable 5.1 launch hero is a three.js scene: a procedural cumulus
 * deck under three time-of-day looks, with depth of field, chromatic aberration
 * and a rigged bird. this keeps the one idea worth keeping (a cloud deck you
 * generate rather than draw, lit three ways) and throws the rest away, because a
 * photoreal sky has nothing to say on a site made of grains.
 *
 * so the clouds here are the same fractal noise, quantised to three tones and
 * snapped to the sand grid. that quantisation is the whole point: it makes the
 * sky a material this site already owns instead of a photograph pasted over it.
 *
 * and once the sky is made of cells, it can talk to the simulation underneath it.
 * dense cloud cells drop water. water falls, fills the lake the name stands in,
 * runs off both ends of the island and falls past the intro copy, off the bottom
 * of the page and back into the air. sun evaporates standing water into humidity,
 * and humidity is what decides cloud cover on the next frame. nobody is animating
 * the weather, it is a loop that runs itself.
 *
 * the three looks are the site's three themes. noon is the light theme, night is
 * the dark one, and dusk is the step between them that a two-way toggle never had:
 * the sky still lit, the ground already dark. picking one flips the page's tokens
 * and eases the sky over, so the theme switch reads as time passing.
 *
 * the canvas covers the sky band and the copy block under it, one grid behind
 * both. that is what lets the falls be page-height without a page-height hero.
 *
 * one canvas, one Uint32Array, no webgl and no dependencies past the sand engine.
 */

/** how long a strike lights the deck, in frames */
const FLASH_FRAMES = 12;
/** chance a drop that has just landed on the word washes the grain under it off */
const HIT = 0.08;
/** chance per tick that a drop pooled on the word does the same. slow: it is weather */
const SOAK = 0.0004;
/**
 * per tick, the chance a cell of water pooled over sand sinks into it, see
 * drink(). packed sand is watertight to the automaton, so without this a
 * shower fills the crook of the k and never leaves
 */
const SEEP = 0.006;
/** css pixels per cell. bigger than the hero's 5 so the cloud tones read as pixels */
const CELL = 6;
/** the cloud deck lives in this fraction of the hero band */
const SKY_FRACTION = 0.64;
/** the island's crest, as a fraction of the hero band's height */
const CREST = 0.76;
/** width of open sky on each side of the island, as a fraction of the grid's width */
const SHAFT = 0.11;
/** the crest steps down this many rows from the lake's edge to the drop */
const CREST_DROP = 3;
/** the crest zone and the bank inside it, as fractions of the island's half width */
const LIP_U = 0.1;
const BANK_U = 0.06;
/**
 * how far a landed drop travels along its row per tick. one pass, so every drop
 * on the sheet moves at the same speed: two passes gave some drops twice the
 * distance of others and the surface read as pixels shooting about. two cells,
 * not four: the walk only has to feed the lip when the lake is flush, the weir
 * takes anything standing above the crest, so far water no longer has to race
 */
const REACH = 2;
const FLOW_PASSES = 1;
/**
 * the weir's rate. a column standing `head` rows above the crest spills its top
 * cell with chance (SPILL_BASE + head) / SPILL_TICKS per tick. the base term is
 * what a long lip does: anything standing above the crest at all runs off at a
 * steady rate, so a shower that lifts the lake by a row does not leave it
 * standing at three. the head term is the surge: a whole crumbled word (fifteen
 * rows) is back within two rows of the crest in about 2 s
 */
const SPILL_TICKS = 120;
const SPILL_BASE = 6;
/** scales the per-column rain rate: the falls can only carry so much */
const RAIN = 0.3;
const FONT_STACK = "'Sora Variable', system-ui, sans-serif";

type RGB = [number, number, number];

type Look = {
    id: Theme;
    label: string;
    swatch: string;
    /** sky colour at the top of the frame and down at the horizon */
    skyTop: RGB;
    skyLow: RGB;
    /** the three cloud tones: lit crown, body, underside */
    cloudLit: RGB;
    cloudMid: RGB;
    cloudLow: RGB;
    /** the celestial body and its detail cells */
    bodyLit: RGB;
    bodyDim: RGB;
    /** 0 = sun disc, 1 = crescent moon */
    crescent: number;
    /** where the body sits, in fractions of the hero band */
    bodyX: number;
    bodyY: number;
    starAlpha: number;
    /** drives evaporation, so noon runs the cycle hot and night lets it rain out */
    sun: number;
    /** multiplied into every sand grain so the ground sits in the same light */
    ambient: RGB;
    /**
     * how far the island's rock is pulled toward the page colour. slate on a
     * white page is a hard edge and its dithered seam into the page a loud
     * checkerboard, so noon bleaches the stone; the dark grounds leave it alone
     */
    rockLift: number;
};

/** in THEMES order, so an index into one is an index into the other */
const LOOKS: Array<Look> = [
    {
        id: "light",
        label: "noon",
        swatch: "#7ea6de",
        skyTop: [96, 142, 209],
        skyLow: [186, 214, 240],
        cloudLit: [255, 253, 248],
        cloudMid: [226, 232, 243],
        cloudLow: [183, 196, 218],
        bodyLit: [255, 214, 92],
        bodyDim: [255, 232, 150],
        crescent: 0,
        bodyX: 0.82,
        bodyY: 0.2,
        starAlpha: 0,
        sun: 1,
        ambient: [1, 1, 1],
        rockLift: 0.45,
    },
    {
        id: "dusk",
        label: "dusk",
        swatch: "#d99b7a",
        skyTop: [64, 76, 132],
        skyLow: [230, 158, 126],
        cloudLit: [255, 214, 186],
        cloudMid: [216, 158, 152],
        cloudLow: [136, 106, 128],
        bodyLit: [255, 186, 122],
        bodyDim: [255, 214, 168],
        crescent: 0,
        bodyX: 0.86,
        bodyY: 0.5,
        starAlpha: 0.28,
        sun: 0.34,
        ambient: [1.02, 0.86, 0.78],
        rockLift: 0,
    },
    {
        id: "dark",
        label: "night",
        swatch: "#1b2645",
        skyTop: [18, 26, 50],
        skyLow: [44, 58, 98],
        cloudLit: [126, 138, 173],
        cloudMid: [78, 92, 128],
        cloudLow: [46, 58, 90],
        bodyLit: [236, 238, 233],
        bodyDim: [186, 192, 196],
        crescent: 1,
        bodyX: 0.8,
        bodyY: 0.18,
        starAlpha: 1,
        sun: 0.26,
        ambient: [0.52, 0.56, 0.78],
        rockLift: 0,
    },
];

const LOOK_BY: Record<Theme, Look> = {
    light: LOOKS[0],
    dusk: LOOKS[1],
    dark: LOOKS[2],
};

/**
 * what each look pours out of its button when picked: sun dust, the raspberry
 * hour, and rain. ink would vanish against a night sky, so night gets weather
 */
const DUST: Record<Theme, number> = { light: AMBER, dusk: RASP, dark: WATER };

/**
 * the page under the island does not come from the look, it comes from the
 * theme's own tokens: whatever `--bg` is, that is the ground the falls run into.
 * read from css once per theme change so the canvas and the page never disagree.
 * the ground gets two tones (bg and a half step toward the surface) so the keel
 * under the copy reads as bedded strata instead of a flat slab.
 */
type Page = { abyss: RGB; ground: [RGB, RGB] };

/** not a material: the brush writes into the cloud deck instead of the sand */
const CLOUD = 32;
/** not a material either: a press calls a bolt down on that column */
const LIGHTNING = 33;
/** the cloud brush's cold twin: the deck it paints snows instead of raining */
const SNOWCLOUD = 34;

const TOOLS: Array<{ id: number; label: string }> = [
    { id: RASP, label: "raspberry" },
    { id: AMBER, label: "amber" },
    { id: WATER, label: "water" },
    { id: WALL, label: "rock" },
    { id: SEED, label: "moss" },
    { id: CLOUD, label: "cloud" },
    { id: SNOWCLOUD, label: "snow" },
    { id: LIGHTNING, label: "lightning" },
    { id: EMPTY, label: "erase" },
];
/** how much deck a cloud stroke adds at its centre, and the most it can pile up */
const CLOUD_STROKE = 0.16;
/**
 * moss: the share of the word it may cover, how often the living rules run
 * (frames), and the odds per moss cell per run of claiming a soaked neighbour
 */
const MOSS_SHARE = 0.3;
const MOSS_EVERY = 6;
const MOSS_RATE = 0.08;
/** ice creeps at this chance per ice cell per frame while it snows; the sun melts at this per open cell */
const FREEZE = 0.02;
const MELT = 0.006;
/** a perched bird now and then leaves a seed behind, per frame */
const BIRD_SEED = 0.0015;
/** moss cells per firefly at night, and the most of them */
const MOSS_PER_FLY = 10;
const FLIES_MAX = 9;
/** moss it takes to bring a snail, how likely per frame once it is there, and how long it stays after the last mouthful */
const SNAIL_MOSS = 15;
const SNAIL_ODDS = 0.003;
const SNAIL_PATIENCE = 1800;
/** lake cells with water above and below per fish, the most fish, and how likely one arrives per frame */
const FISH_LAKE = 60;
const FISH_MAX = 3;
const FISH_ODDS = 0.004;
/** fireflies it takes to bring the frog, how likely per frame once they are out, and how long it stays after they go */
const FROG_FLIES = 3;
const FROG_ODDS = 0.002;
const FROG_PATIENCE = 600;
/** how far from where the tongue was aimed a firefly can have drifted and still be caught */
const FROG_SNAP = 1.5;
const CLOUD_CAP = 0.6;
/** the deck's noise scrolls at this many deck units per screen cell, see stepClouds */
const DECK_SCALE = 0.045;

/* ------------------------------------------------------------------ noise */

/** integer hash, ~0..1. cheaper than the sin-fract trick and it tiles no worse */
function hash2(x: number, y: number): number {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function vnoise(x: number, y: number): number {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx0 = x - xi;
    const fy0 = y - yi;
    const fx = fx0 * fx0 * (3 - 2 * fx0);
    const fy = fy0 * fy0 * (3 - 2 * fy0);
    const a = hash2(xi, yi);
    const b = hash2(xi + 1, yi);
    const c = hash2(xi, yi + 1);
    const d = hash2(xi + 1, yi + 1);
    const top = a + (b - a) * fx;
    const bot = c + (d - c) * fx;
    return top + (bot - top) * fy;
}

/** rotated-lattice fbm, the standard stack. octaves stay low, this runs on the cpu */
function fbm(x: number, y: number, octaves: number): number {
    let v = 0;
    let amp = 0.5;
    let px = x;
    let py = y;
    for (let i = 0; i < octaves; i++) {
        v += amp * vnoise(px, py);
        const nx = 0.8 * px + 0.6 * py;
        const ny = -0.6 * px + 0.8 * py;
        px = nx * 2.07 + 1.7;
        py = ny * 2.07 + 9.2;
        amp *= 0.5;
    }
    return v;
}

/** 4x4 ordered dither. band edges in the sky get stippled instead of stepping hard */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** rows over which the keel dissolves into the page at the bottom of the band */
const SEAM = 12;

/* ------------------------------------------------------------- colour util */

const pack = (r: number, g: number, b: number): number =>
    (((255 << 24) | (b << 16) | (g << 8) | r) >>> 0) as number;

const clamp255 = (n: number): number => (n < 0 ? 0 : n > 255 ? 255 : n | 0);

const packRGB = (c: RGB, lift = 0): number =>
    pack(clamp255(c[0] + 255 * lift), clamp255(c[1] + 255 * lift), clamp255(c[2] + 255 * lift));

const mix3 = (a: RGB, b: RGB, t: number): RGB => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
];

const smooth = (t: number): number => {
    const c = t < 0 ? 0 : t > 1 ? 1 : t;
    return c * c * (3 - 2 * c);
};

/** resolve an oklch string to rgb once, letting the browser do the conversion */
function resolve(scratch: CanvasRenderingContext2D, css: string): RGB {
    scratch.clearRect(0, 0, 1, 1);
    scratch.fillStyle = css;
    scratch.fillRect(0, 0, 1, 1);
    const d = scratch.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
}


/* -------------------------------------------------------------- component */

type Hud = { humidity: number; cover: number; drops: number };

type Props = {
    /** the copy block. it sits on the canvas, under the sky band */
    children: ReactNode;
    /** anything the lab wants floated over the sky: its crumb, title and lede */
    overlay?: ReactNode;
    /** the lab's extra chrome: the soak button and the drop count */
    lab?: boolean;
};

export function WeatherHero({ children, overlay, lab = false }: Props) {
    const stageRef = useRef<HTMLDivElement>(null);
    const bandRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const themeRef = useRef<Theme>("light");
    const toolRef = useRef<number>(RASP);
    const [theme, setTheme] = useState<Theme>("light");
    const [tool, setTool] = useState<number>(RASP);
    const [awake, setAwake] = useState(false);
    const [hud, setHud] = useState<Hud>({ humidity: 0.55, cover: 0, drops: 0 });
    const resetRef = useRef<() => void>(() => {});
    const soakRef = useRef<() => void>(() => {});
    /** the effect's hooks for the chrome: retarget the look, pour from a point */
    const retargetRef = useRef<() => void>(() => {});
    const pourRef = useRef<(clientX: number, clientY: number, material: number) => void>(
        () => {},
    );

    useEffect(() => {
        toolRef.current = tool;
    }, [tool]);

    useEffect(() => {
        const stage = stageRef.current;
        const band = bandRef.current;
        const canvas = canvasRef.current;
        if (!stage || !band || !canvas) return;
        const view = canvas.getContext("2d");
        if (!view) return;

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const grain = Math.max(2, Math.round(CELL * dpr));

        // the small backing store everything is drawn into; the visible canvas is
        // this one upscaled with smoothing off, so a cell is a hard square
        const src = document.createElement("canvas");
        const srcCtx = src.getContext("2d");
        const swatch = document.createElement("canvas");
        swatch.width = 1;
        swatch.height = 1;
        const swatchCtx = swatch.getContext("2d", { willReadFrequently: true });
        if (!srcCtx || !swatchCtx) return;

        let cols = 0;
        let rows = 0;
        /** rows in the hero band; everything below is the copy block */
        let heroRows = 0;
        let skyRows = 0;
        /** the crest row at the lake's edge, and the flat floor the name stands on */
        let crestRow = 0;
        let floorRow = 0;
        let shaft0 = 0;
        let image = new ImageData(1, 1);
        let buf = new Uint32Array(image.data.buffer);
        let engine = new SandEngine(1, 1);
        /** cloud density per sky cell, recomputed every other frame */
        let cloud = new Float32Array(1);
        /** how much the sun or moon is burning through, per sky cell */
        let glow = new Float32Array(1);
        /**
         * cloud the brush painted, stored in deck coordinates so it rides along
         * with the noise as the deck drifts. it rains itself away, see rain()
         */
        let stain = new Float32Array(1);
        /** the painted deck's cold, same layout as stain; where it is set the deck snows */
        let chill = new Float32Array(1);
        const flakes: Flake[] = [];
        /** lowest raining row per column, -1 for clear sky */
        let base = new Int16Array(1);
        /** per screen column, the deck cell holding the most cold this frame, or -1 */
        let coldAt = new Int32Array(1);
        /** per cell: is this water resting on ground, or still on its way down */
        let rest = new Uint8Array(1);
        /** per row scratch for the flow pass: nearest hole either side, and who moved */
        let holeL = new Int16Array(1);
        let holeR = new Int16Array(1);
        let moved = new Uint8Array(1);
        /** per cell: resting water with no way out along its row, this frame */
        let sealed = new Uint8Array(1);
        /** connected-water labels and a scratch stack for the pressure pass */
        let comp = new Int32Array(1);
        let stack = new Int32Array(1);
        let stars: Array<{ x: number; y: number; base: number; phase: number }> = [];

        const sandRGB: Record<number, Array<RGB>> = {};
        for (const m of [WALL, RASP, AMBER, INK, WATER, GLASS, SEED, MOSS, SNOW, ICE]) {
            sandRGB[m] = PALETTES.light[m].map((css) => resolve(swatchCtx, css));
        }
        sandRGB[WATER] = [
            "oklch(0.6 0.13 250)",
            "oklch(0.625 0.125 251)",
            "oklch(0.585 0.135 249)",
            "oklch(0.61 0.128 250)",
        ].map((css) => resolve(swatchCtx, css));
        /** the lit top of the water: one row of it turns a blue mass into a surface */
        const waterTop = resolve(swatchCtx, "oklch(0.73 0.11 252)");
        // bedrock is the engine's wall material, but the front page's near-black ink
        // reads as a solid ui bar across a frame this size, so it gets slate instead
        sandRGB[WALL] = [
            "oklch(0.425 0.022 357)",
            "oklch(0.395 0.02 357)",
            "oklch(0.45 0.024 357)",
            "oklch(0.37 0.019 357)",
        ].map((css) => resolve(swatchCtx, css));
        /** packed per frame once the ambient tint is known */
        const sandPacked: Record<number, Array<number>> = {
            [WALL]: [0, 0, 0, 0],
            [RASP]: [0, 0, 0, 0],
            [AMBER]: [0, 0, 0, 0],
            [INK]: [0, 0, 0, 0],
            [WATER]: [0, 0, 0, 0],
            [GLASS]: [0, 0, 0, 0],
            [SEED]: [0, 0, 0, 0],
            [MOSS]: [0, 0, 0, 0],
            [SNOW]: [0, 0, 0, 0],
            [ICE]: [0, 0, 0, 0],
        };

        // the inline head script set this before first paint
        const initial = readTheme();
        themeRef.current = initial;
        setTheme(initial);

        /** the page's own colours, straight from the theme tokens */
        const readPage = (): Page => {
            const style = getComputedStyle(document.documentElement);
            const bg = resolve(swatchCtx, style.getPropertyValue("--bg").trim() || "#fff");
            const surface = resolve(swatchCtx, style.getPropertyValue("--surface").trim() || "#eee");
            return { abyss: bg, ground: [bg, mix3(bg, surface, 0.3)] };
        };
        let pageTarget = readPage();

        // water is conserved: every cell of standing water is water the air does not
        // have. humidity is therefore not a free dial, it is what is left of a fixed
        // budget, which is what makes the cycle self-limiting instead of hand-tuned
        let waterCount = 0;
        let capacity = 1;
        /** the honest reading: what fraction of the water budget is not on the ground */
        let airRaw = 1;
        /**
         * and the lagged one, which is what everything actually uses. rain and
         * evaporation move the raw value by a few cells every frame, and feeding that
         * jitter straight into the cloud threshold makes every cell sitting near the
         * threshold flip tone on alternate frames: a sky full of dancing pixels.
         * air moves slowly, so the deck's shape changes at the speed weather does.
         */
        let air = 1;
        let frame = 0;
        let drift = 0;
        let wind = 0.12;
        let flash = 0;
        let bolt: Array<number> = [];
        let raf = 0;
        let running = true;
        /**
         * the word is kinetic sand: stamped packed, so it holds its shape and the
         * automaton treats it as solid. it only goes to powder where something
         * loosens it, the brush or the rain, and a packed grain that loses the
         * grain it was standing on lets go too. `sandAwake` is only whether the
         * powder step runs at all: there is nothing to step until something is loose
         */
        let sandAwake = false;
        /** 1 where a packed grain had something under it when stamped, see settle() */
        let bed = new Uint8Array(0);
        /** the living layer's view of the grid, see moss.ts; damp is per cell */
        let moss: MossWorld = { cols, rows, cells: engine.cells, tint: engine.tint, damp: new Uint8Array(0) };
        /** the most moss cells the word may carry, set from its size at build */
        let mossBudget = 0;
        let mossCount = 0;
        // rebuilt with the grid in build(): a flock sized to a zero grid pins every bug to (0, 0)
        let fireflies = new Fireflies(cols, rows);
        let snail: Snail | null = null;
        /** frames since the snail's last mouthful */
        let snailHunger = 0;
        let fishes: Fish[] = [];
        let frog: Frog | null = null;
        /** frames since the frog last saw a firefly */
        let frogBored = 0;
        /** frames the frog has spent afloat; the fireflies are up on the letters, so it swims off */
        let frogWet = 0;
        /** how many fish the lake will hold right now, refreshed now and then */
        let fishWant = 0;
        /** the stamped word's box, so settle() does not walk the whole grid */
        let wordBox = { x0: 0, y0: 0, x1: 0, y1: 0 };
        /**
         * erosion scale, 1 at desktop size. rain per column is the same at any
         * width but a phone's word is a quarter the height, so the same odds
         * would wash it away four times as fast
         */
        let wear = 1;

        /** cloud cover as of the last hud refresh, 0..1; the birds read the sky by it */
        let cover = 0;
        /** where and when the brush last touched, so a nearby perched bird takes off */
        let touchedAt = { x: -100, y: -100, frame: -1000 };
        let flock = new Flock(1, 1);

        let cur: Look = { ...LOOK_BY[initial] };
        let page: Page = { abyss: [...pageTarget.abyss], ground: [[...pageTarget.ground[0]], [...pageTarget.ground[1]]] };

        /**
         * the sky takes its time; the ground does not. the page's own background
         * moves in 250ms, and the canvas is the page under the island, so it keeps
         * pace with the body rather than with the sunset
         */
        const easeLook = (target: Look, t: number) => {
            const tp = Math.min(1, t * 7);
            page.abyss = mix3(page.abyss, pageTarget.abyss, tp);
            page.ground[0] = mix3(page.ground[0], pageTarget.ground[0], tp);
            page.ground[1] = mix3(page.ground[1], pageTarget.ground[1], tp);
            cur.skyTop = mix3(cur.skyTop, target.skyTop, t);
            cur.skyLow = mix3(cur.skyLow, target.skyLow, t);
            cur.cloudLit = mix3(cur.cloudLit, target.cloudLit, t);
            cur.cloudMid = mix3(cur.cloudMid, target.cloudMid, t);
            cur.cloudLow = mix3(cur.cloudLow, target.cloudLow, t);
            cur.bodyLit = mix3(cur.bodyLit, target.bodyLit, t);
            cur.bodyDim = mix3(cur.bodyDim, target.bodyDim, t);
            cur.ambient = mix3(cur.ambient, target.ambient, t);
            cur.crescent += (target.crescent - cur.crescent) * t;
            cur.bodyX += (target.bodyX - cur.bodyX) * t;
            cur.bodyY += (target.bodyY - cur.bodyY) * t;
            cur.starAlpha += (target.starAlpha - cur.starAlpha) * t;
            cur.sun += (target.sun - cur.sun) * t;
            cur.rockLift += (target.rockLift - cur.rockLift) * t;
        };

        /** the theme changed: re-read the page's tokens and let the sky ease over */
        const retarget = () => {
            pageTarget = readPage();
            if (reduced) {
                easeLook(LOOK_BY[themeRef.current], 1);
                stepClouds();
                render();
            }
        };
        retargetRef.current = retarget;

        /* ---------------------------------------------------------- terrain */

        /**
         * the island is anchored to the page's edges, not its centre. a lake dished
         * into a plateau, the name standing in the lake, and the plateau's crest
         * stepping down to a drop at each end. everything under the crest is the
         * page: the copy block sits on the island's keel, and the two shafts of open
         * sky either side are where the falls run past it.
         *
         * the crest is the spillway. it descends outward from the lake's edge, so
         * once the lake reaches the crest every drop that lands on it has somewhere
         * lower to go, and the surplus leaves as two sheets instead of a dome.
         */
        const topAt = (x: number): number => {
            const dEdge = Math.min(x, cols - 1 - x);
            const half = Math.max(1, cols / 2 - shaft0);
            const u = (dEdge - shaft0) / half;
            if (u < 0) return crestRow + CREST_DROP;
            if (u < LIP_U) return crestRow + Math.round((1 - u / LIP_U) * CREST_DROP);
            if (u < LIP_U + BANK_U) {
                return Math.round(crestRow + (floorRow - crestRow) * smooth((u - LIP_U) / BANK_U));
            }
            return floorRow;
        };

        /**
         * the width of open sky at one row: a plain vertical face. the face used to
         * recede under the lip and hang fbm ledges into the shaft, and a ledge under
         * an overhang is a cave: the sheet fills it and the falls run around it.
         * the crest's own step down is the only relief the edge has. beside the
         * copy the shaft is one cell wider so the falls run clear of the page.
         */
        const shaftAt = (y: number): number => (y < heroRows ? shaft0 : shaft0 + 1);

        const terrain = () => {
            const cells = engine.cells;
            cells.fill(EMPTY);
            for (let x = 0; x < cols; x++) {
                const top = topAt(x);
                const dEdge = Math.min(x, cols - 1 - x);
                for (let y = Math.max(0, top); y < rows; y++) {
                    if (dEdge >= shaftAt(y)) engine.set(x, y, WALL);
                }
            }
            // the lake starts full. an empty basin is a hole waiting for weather, and
            // the reduced-motion frame has no weather to wait for
            const half = cols / 2 - shaft0;
            for (let x = 0; x < cols; x++) {
                // not over the crest zone: that would be a sheet already on its way out
                if ((Math.min(x, cols - 1 - x) - shaft0) / half < LIP_U) continue;
                const top = topAt(x);
                for (let y = crestRow; y < top; y++) {
                    if (cells[y * cols + x] === EMPTY) engine.set(x, y, WATER);
                }
            }
            // the letters stand two rows off the floor, in the water: that is what
            // connects the gaps between them to the lake, see pressure()
            stampWord(
                engine,
                "mike",
                FONT_STACK,
                {
                    cx: cols / 2,
                    baseline: floorRow - 2,
                    size: heroRows * 0.46,
                    maxWidth: (half - (LIP_U + BANK_U) * half) * 2 * 0.72,
                },
                { packed: true },
            );
            // remember what stood on something: an arch of the m has air under it
            // by design and holds by cohesion; a grain that had support and lost it
            // is the one that falls
            bed = new Uint8Array(cols * rows);
            moss = { cols, rows, cells, tint: engine.tint, damp: new Uint8Array(cols * rows) };
            mossCount = 0;
            fireflies = new Fireflies(cols, rows);
            snail = null;
            fishes = [];
            fishWant = 0;
            frog = null;
            wordBox = { x0: cols, y0: rows, x1: 0, y1: 0 };
            for (let y = 0; y < rows - 1; y++) {
                for (let x = 0; x < cols; x++) {
                    const i = y * cols + x;
                    if (!(cells[i] & PACKED)) continue;
                    // solid support only: the feet stand in the lake, and water that
                    // wanders off from under them must not bring the letter down
                    const under = cells[i + cols];
                    if (under === WALL || under & PACKED) bed[i] = 1;
                    if (x < wordBox.x0) wordBox.x0 = x;
                    if (x > wordBox.x1) wordBox.x1 = x;
                    if (y < wordBox.y0) wordBox.y0 = y;
                    if (y > wordBox.y1) wordBox.y1 = y;
                }
            }
            wear = Math.max(0.15, Math.min(1, (wordBox.y1 - wordBox.y0 + 1) / 28));
            let stamped = 0;
            for (let i = 0; i < cells.length; i++) if (cells[i] & PACKED) stamped++;
            mossBudget = Math.round(stamped * MOSS_SHARE);
            sandAwake = false;
            setAwake(false);
            recount();
            air = airRaw;
        };

        const recount = () => {
            let n = 0;
            const cells = engine.cells;
            for (let i = 0; i < cells.length; i++) {
                const m = cells[i];
                if (m === WATER || m === SNOW || m === ICE) n++;
            }
            waterCount = n + flakes.length;
            airRaw = Math.max(0, Math.min(1, (capacity - waterCount) / capacity));
        };

        const build = () => {
            const rect = stage.getBoundingClientRect();
            const bandRect = band.getBoundingClientRect();
            cols = Math.max(60, Math.floor((rect.width * dpr) / grain));
            rows = Math.max(50, Math.floor((rect.height * dpr) / grain));
            heroRows = Math.max(40, Math.min(rows, Math.floor((bandRect.height * dpr) / grain)));
            skyRows = Math.floor(heroRows * SKY_FRACTION);
            flock = new Flock(cols, Math.max(6, skyRows - 2));
            crestRow = Math.floor(heroRows * CREST);
            floorRow = crestRow + Math.max(3, Math.round(heroRows * 0.045));
            shaft0 = Math.max(7, Math.round(cols * SHAFT));
            canvas.width = cols * grain;
            canvas.height = rows * grain;
            src.width = cols;
            src.height = rows;
            image = new ImageData(cols, rows);
            buf = new Uint32Array(image.data.buffer);
            engine = new SandEngine(cols, rows);
            cloud = new Float32Array(cols * skyRows);
            glow = new Float32Array(cols * skyRows);
            stain = new Float32Array(cols * skyRows);
            chill = new Float32Array(cols * skyRows);
            coldAt = new Int32Array(cols);
            flakes.length = 0;
            base = new Int16Array(cols);
            rest = new Uint8Array(cols * rows);
            holeL = new Int16Array(cols);
            holeR = new Int16Array(cols);
            moved = new Uint8Array(cols);
            sealed = new Uint8Array(cols * rows);
            comp = new Int32Array(cols * rows);
            stack = new Int32Array(cols * rows);
            capacity = Math.max(600, Math.floor(cols * heroRows * 0.22));
            stars = Array.from({ length: Math.min(110, Math.floor((cols * skyRows) / 420)) }, () => ({
                x: Math.floor(Math.random() * cols),
                y: Math.floor(Math.random() * skyRows),
                // cubed so most stars are faint and only a handful carry
                base: Math.pow(Math.random(), 3) * 0.85 + 0.12,
                phase: Math.random() * Math.PI * 2,
            }));
            terrain();
        };

        /* ------------------------------------------------------------ sky */

        /** the sun or moon in cells, and how wide a zone it burns through */
        const body = () => ({
            bx: Math.floor(cols * cur.bodyX),
            by: Math.floor(heroRows * cur.bodyY),
            R: Math.max(5, Math.floor(cols * 0.028)),
            clear: cols * 0.11,
        });

        /**
         * the cloud deck. fbm over a slowly advected lattice, masked to a band so
         * clouds sit in the sky rather than smearing to the horizon, then biased by
         * humidity: the wetter the ground has made the air, the more of the field
         * clears the threshold and becomes cloud.
         *
         * around the sun or moon the deck thins with a wide soft falloff on the
         * threshold, so it breaks into smaller lumps toward the body instead of
         * stopping at a boundary. what survives in that zone is drawn backlit (see
         * render), which is what keeps the clearing from reading as a hole.
         */
        /** the deck column under screen column x, wrapped: where a stain lives */
        const deckX = (x: number) => {
            const shift = Math.round(drift / DECK_SCALE);
            return (((x + shift) % cols) + cols) % cols;
        };

        /**
         * paint cloud: a soft disc of deck density around (cx, cy), only in the
         * sky rows. stored in deck coordinates so it drifts with the weather
         */
        const seed = (cx: number, cy: number, radius: number, cold = false) => {
            for (let dy = -radius; dy <= radius; dy++) {
                const y = cy + dy;
                if (y < 1 || y >= skyRows - 1) continue;
                for (let dx = -radius; dx <= radius; dx++) {
                    const x = cx + dx;
                    const dd = dx * dx + dy * dy;
                    if (x < 0 || x >= cols || dd > radius * radius) continue;
                    const i = y * cols + deckX(x);
                    const add = CLOUD_STROKE * (1 - Math.sqrt(dd) / (radius + 1));
                    stain[i] = Math.min(CLOUD_CAP, stain[i] + add);
                    if (cold) chill[i] = Math.min(CLOUD_CAP, chill[i] + add);
                }
            }
        };

        const stepClouds = () => {
            const bias = -0.54 + air * 0.36;
            const { bx, by, clear } = body();
            const clear2 = clear * clear;
            for (let x = 0; x < cols; x++) {
                base[x] = -1;
                coldAt[x] = -1;
            }
            for (let y = 0; y < skyRows; y++) {
                // clouds live in a band: thin at the very top, gone near the horizon
                const t = y / skyRows;
                const band =
                    Math.max(0, Math.min(1, (t - 0.04) * 5)) * Math.max(0, Math.min(1, (0.82 - t) * 3.4));
                const row = y * cols;
                const dy = y - by;
                if (band <= 0) {
                    for (let x = 0; x < cols; x++) {
                        cloud[row + x] = -1;
                        glow[row + x] = 0;
                    }
                    continue;
                }
                for (let x = 0; x < cols; x++) {
                    const dx = x - bx;
                    const dd = dx * dx + dy * dy;
                    let g = 0;
                    if (dd < clear2) {
                        const u = 1 - Math.sqrt(dd) / clear;
                        g = u * u;
                    }
                    glow[row + x] = g;
                    const n = fbm(x * DECK_SCALE + drift, y * 0.1 + 3.3, 3);
                    let d = n * band + bias - g * 0.22;
                    const si = row + deckX(x);
                    if (stain[si] > 0) {
                        // a painted patch thins on its own, slowly; the rain it makes
                        // takes the rest
                        stain[si] *= 0.9992;
                        d += stain[si];
                    }
                    if (chill[si] > 0) {
                        chill[si] *= 0.9992;
                        // the cold sits wherever it was painted; the column under it snows
                        if (coldAt[x] < 0 || chill[si] > chill[coldAt[x]]) coldAt[x] = si;
                    }
                    cloud[row + x] = d;
                    if (d > 0.055) base[x] = y;
                }
            }
        };

        /**
         * rain falls in shafts, not evenly. a slow noise gate in x decides which
         * columns are currently under a shower, and those columns rain almost every
         * frame, so the drops read as falling streaks rather than scattered dots.
         * the gate travels with the deck, so showers move across the frame.
         */
        const rain = () => {
            if (air <= 0.08) return;
            for (let x = 0; x < cols; x++) {
                const y = base[x];
                if (y < 0) continue;
                const d = cloud[y * cols + x];
                if (d < 0.075) continue;
                const si = y * cols + deckX(x);
                const painted = stain[si];
                const gate = vnoise(x * 0.022 + drift * 2.4, frame * 0.0007);
                // a painted cloud is its own shower: it ignores the gate, and every
                // drop it lets go is deck it no longer has
                if (gate < 0.54 && painted <= 0) continue;
                // squared, not linear: a damp sky barely drizzles while a saturated one
                // dumps. a linear throttle finds its equilibrium with the ground holding
                // nearly all the water, which leaves nothing in the sky to look at
                const odds = painted > 0 ? (0.7 + d * 1.9) * Math.max(air, 0.45) * RAIN : (0.7 + d * 1.9) * air * air * RAIN;
                if (Math.random() > odds) continue;
                if (painted > 0) stain[si] = Math.max(0, painted - 0.004);
                const ty = y + 1;
                if (ty >= rows) continue;
                if (engine.cells[ty * cols + x] !== EMPTY) continue;
                const ci = coldAt[x];
                if (ci >= 0 && chill[ci] > 0) {
                    // a cold deck lets go a flake, and fewer of them: each one is
                    // slower and larger on the eye than a drop
                    if (Math.random() < 0.5) continue;
                    chill[ci] = Math.max(0, chill[ci] - 0.004);
                    flakes.push({ x: x + Math.random(), y: ty, phase: Math.random() * Math.PI * 2 });
                    waterCount++;
                    continue;
                }
                engine.set(x, ty, WATER);
                waterCount++;
            }
        };

        /**
         * evaporation is a surface effect, so it is measured at the surface: walk
         * each column down to the first thing that is not air and take it only if it
         * is water. sampling the whole grid instead would spend almost every sample
         * inside the lake, where nothing can leave, and the cycle would stall.
         */
        const evaporate = () => {
            const strength = cur.sun;
            if (strength <= 0.02) return;
            const cells = engine.cells;
            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    const i = y * cols + x;
                    const m = cells[i];
                    if (m === EMPTY) continue;
                    if (m === WATER) {
                        // only standing water leaves. without this the column scan finds
                        // the top of a falling stream and eats the waterfall in mid-air
                        const resting = y + 1 >= rows || cells[i + cols] !== EMPTY;
                        // slow: the falls already return most of the water to the air by
                        // leaving the frame, and a lake that evaporates faster than the
                        // showers can refill it dies from the dry end inward
                        if (resting && Math.random() < 0.0015 * strength) {
                            cells[i] = EMPTY;
                            waterCount--;
                        }
                    }
                    break;
                }
            }
        };

        /* ---------------------------------------------------------- water */

        /**
         * gravity for water. the shared engine's water takes one sideways step at
         * random whenever it cannot fall, which is fine for a splash on the front
         * page and is exactly the jiggle a standing lake must not have. so water here
         * only ever moves down: straight or diagonally into a gap beside its footing.
         * every move ends lower than it started, so a settled surface has nothing to
         * do. rain falls one cell a tick, which is what makes it read as rain; below
         * the crest a drop falls two, so the falls run sparse enough that water
         * leaving the crest can always find a cell to leave into. a dense column
         * beside the crest is a wall, and the lake stacks up behind it as a slab.
         */
        /** packed grain to powder, tint and place kept; the powder step now has work */
        const loosen = (i: number) => {
            engine.cells[i] &= MATERIAL;
            sandAwake = true;
        };

        /**
         * water carries what it loosens. the grain goes to the nearest air beside
         * or under the cell, so rain takes the word from its edges inward and a pool
         * with packed sand on every side digs nothing: a puddle on the m is a puddle,
         * the corner of the m is where the m gets rounder
         */
        const erode = (i: number) => {
            const { cells, tint } = engine;
            const y = (i / cols) | 0;
            const x = i - y * cols;
            const d = Math.random() < 0.5 ? -1 : 1;
            const outs = [i + d, i - d, i + cols + d, i + cols - d];
            for (let k = 0; k < outs.length; k++) {
                const to = outs[k];
                const tx = x + (k === 0 || k === 2 ? d : -d);
                if (tx < 0 || tx >= cols || to >= cells.length) continue;
                if (cells[to] !== EMPTY) continue;
                cells[to] = cells[i] & MATERIAL;
                tint[to] = tint[i];
                cells[i] = EMPTY;
                bed[i] = 0;
                sandAwake = true;
                return;
            }
            loosen(i);
        };

        /**
         * a packed grain that was standing on something and now has air under it
         * lets go. it runs a row per tick, so a hole dug under a letter collapses
         * upward the way sand does instead of leaving a floating slab
         */
        const settle = () => {
            const { cells } = engine;
            for (let y = wordBox.y1; y >= wordBox.y0; y--) {
                const row = y * cols;
                for (let x = wordBox.x0; x <= wordBox.x1; x++) {
                    const i = row + x;
                    if (!bed[i] || !(cells[i] & PACKED)) continue;
                    if (cells[i + cols] === EMPTY) loosen(i);
                }
            }
        };

        const fall = () => {
            const { cells, tint } = engine;
            for (let y = rows - 2; y >= 0; y--) {
                const row = y * cols;
                const ltr = (frame & 1) === 0;
                for (let xi = 0; xi < cols; xi++) {
                    const x = ltr ? xi : cols - 1 - xi;
                    const i = row + x;
                    if (cells[i] !== WATER) continue;
                    const b = i + cols;
                    if (cells[b] === EMPTY) {
                        let to = b;
                        if (y > crestRow && y + 2 < rows && cells[b + cols] === EMPTY) to = b + cols;
                        // a little scatter in free fall, so a stream is a spray rather
                        // than a line: this is where the falls get their width
                        if (Math.random() < 0.08) {
                            const sx = Math.random() < 0.5 ? -1 : 1;
                            const nx = x + sx;
                            if (nx >= 0 && nx < cols && cells[to + sx] === EMPTY) to += sx;
                        }
                        cells[to] = WATER;
                        tint[to] = tint[i] & 3; // a fall forgets its heading
                        cells[i] = EMPTY;
                        continue;
                    }
                    // rain on the word. a drop that was falling last tick has just hit;
                    // one that was resting is a pool soaking in. either can wash the
                    // grain under it off the edge, see erode()
                    if (cells[b] & PACKED && Math.random() < (rest[i] ? SOAK : HIT) * wear) erode(b);
                    const dir = Math.random() < 0.5 ? -1 : 1;
                    for (const d of [dir, -dir]) {
                        const nx = x + d;
                        if (nx < 0 || nx >= cols) continue;
                        if (cells[i + d] !== EMPTY || cells[b + d] !== EMPTY) continue;
                        cells[b + d] = WATER;
                        tint[b + d] = tint[i] & 3;
                        cells[i] = EMPTY;
                        break;
                    }
                }
            }
        };

        /**
         * mark which water is standing on something and which is still falling.
         *
         * "is the cell below me solid" is not the test: in a waterfall every drop but
         * the last has another drop under it, so the whole stream would count as
         * standing water, get treated as a pool and be spread sideways. walking each
         * column from the bottom instead carries support up through a resting stack and
         * loses it at the first gap, which is what actually separates a lake from a fall.
         */
        /**
         * sand drinks. standing water whose column bottoms out on sand, packed or
         * the loose grains the rain washed into a crook, soaks away through the
         * whole depth of the pool, so a downpour leaves a wet crook and not a lake
         * in the k. water over the rock floor is the lake and keeps
         */
        const drink = () => {
            const cells = engine.cells;
            for (let x = 0; x < cols; x++) {
                let onSand = false;
                for (let y = rows - 1; y >= 0; y--) {
                    const i = y * cols + x;
                    const m = cells[i] & MATERIAL;
                    if (m === WATER) {
                        if (onSand && rest[i] && Math.random() < SEEP) {
                            cells[i] = EMPTY;
                            waterCount--;
                        }
                    } else onSand = m === RASP || m === AMBER || m === MOSS;
                }
            }
        };

        const markResting = () => {
            const cells = engine.cells;
            for (let x = 0; x < cols; x++) {
                let sup = false;
                for (let y = rows - 1; y >= 0; y--) {
                    const i = y * cols + x;
                    const m = cells[i];
                    if (m === EMPTY) {
                        sup = false;
                    } else if (m === WATER) {
                        rest[i] = sup ? 1 : 0;
                    } else {
                        sup = true;
                    }
                }
            }
        };

        /**
         * lateral flow for water that has landed, and the reason the lake neither
         * domes nor sloshes.
         *
         * the old version let a landed drop wander sideways at random looking for a
         * way down, which made the surface a random walk: eight coin flips a frame,
         * an amplitude that grew with depth, and a dump whenever a path to the notch
         * happened to open. this one never moves water for its own sake. each row is
         * split into runs between solid cells, and a run either has a hole in it (an
         * empty cell with nothing under it) or it does not. water in a run with no
         * hole stays where it is: a level surface is a row with no holes, so it is
         * static by construction. water in a run with a hole walks toward the nearest
         * one, up to REACH cells a pass, and drops in. that is drainage, and it is the
         * only lateral motion there is.
         *
         * which hole: the nearest, and a drop keeps the heading it picked until it
         * falls, so a hole opening behind it does not turn it around mid-walk. the
         * heading lives in the two spare bits of the grain's tint, which travel with
         * it. this means a shower feeds the crest under it and the far fall waits for
         * the shower to move, which is what rain does.
         *
         * the walk is directional, so a queue of drops all heading for the same edge
         * advances together when the sweep runs against the flow. right-movers are
         * swept from the right and left-movers from the left for that reason.
         */
        const HEAD = 4;
        const HEAD_RIGHT = 8;
        const flow = (passes: number) => {
            const { cells, tint } = engine;
            /** +1 or -1 toward a hole, 0 to stay. picks and remembers a heading */
            const heading = (i: number, x: number): number => {
                const dl = holeL[x] < 0 ? Infinity : x - holeL[x];
                const dr = holeR[x] < 0 ? Infinity : holeR[x] - x;
                if (dl === Infinity && dr === Infinity) return 0;
                const t = tint[i];
                if (t & HEAD) {
                    const dir = t & HEAD_RIGHT ? 1 : -1;
                    if ((dir > 0 ? dr : dl) !== Infinity) return dir;
                }
                let dir: number;
                if (dl === Infinity) dir = 1;
                else if (dr === Infinity) dir = -1;
                else if (dl === dr) dir = Math.random() < 0.5 ? 1 : -1;
                else dir = dr < dl ? 1 : -1;
                tint[i] = (t & 3) | HEAD | (dir > 0 ? HEAD_RIGHT : 0);
                return dir;
            };
            const walk = (x: number, y: number, dir: number) => {
                const row = y * cols;
                const i = row + x;
                let n = i;
                let nx = x;
                let hole = false;
                let at = i;
                let atX = x;
                for (let k = 0; k < REACH; k++) {
                    const tx = atX + dir;
                    if (tx < 0 || tx >= cols) break;
                    const t = at + dir;
                    // other water is not a wall. a drop on a ledge beside its own
                    // stream would otherwise be walled in by it and the ledge would
                    // fill into a pocket; two drops on the lake heading opposite ways
                    // would meet and sit there forever, flickering as others piled on.
                    // it passes over and lands on the first empty cell beyond
                    if (cells[t] === WATER) {
                        at = t;
                        atX = tx;
                        continue;
                    }
                    if (cells[t] !== EMPTY) break;
                    at = t;
                    atX = tx;
                    n = t;
                    nx = tx;
                    if (cells[t + cols] !== EMPTY) continue;
                    // this is a hole. water leaving an edge carries on a little before
                    // it drops, so the sheet leaves the crest as a jet and not a thread
                    hole = true;
                    if (Math.random() < 0.6) break;
                }
                if (n === i) return;
                cells[i] = EMPTY;
                rest[i] = 0;
                // and it drops straight in, which frees the hole for the walker behind
                if (hole && n + cols < cells.length && cells[n + cols] === EMPTY) n += cols;
                cells[n] = WATER;
                tint[n] = tint[i];
                rest[n] = n + cols < cells.length && cells[n + cols] === EMPTY ? 0 : 1;
                moved[nx] = 1;
            };
            sealed.fill(0);
            for (let p = 0; p < passes; p++) {
                for (let y = rows - 2; y >= 0; y--) {
                    const row = y * cols;
                    let last = -1;
                    let any = false;
                    for (let x = 0; x < cols; x++) {
                        const m = cells[row + x];
                        if (m !== EMPTY && m !== WATER) {
                            last = -1;
                        } else if (m === EMPTY && cells[row + x + cols] === EMPTY) {
                            last = x;
                            any = true;
                        }
                        holeL[x] = last;
                    }
                    if (!any) {
                        if (p === 0) {
                            for (let x = 0; x < cols; x++) {
                                const i = row + x;
                                if (cells[i] === WATER && rest[i]) sealed[i] = 1;
                            }
                        }
                        continue;
                    }
                    last = -1;
                    for (let x = cols - 1; x >= 0; x--) {
                        const m = cells[row + x];
                        if (m !== EMPTY && m !== WATER) {
                            last = -1;
                        } else if (m === EMPTY && cells[row + x + cols] === EMPTY) {
                            last = x;
                        }
                        holeR[x] = last;
                    }
                    moved.fill(0);
                    if (p === 0) {
                        for (let x = 0; x < cols; x++) {
                            const i = row + x;
                            if (cells[i] === WATER && rest[i] && holeL[x] < 0 && holeR[x] < 0) sealed[i] = 1;
                        }
                    }
                    for (let x = cols - 1; x >= 0; x--) {
                        const i = row + x;
                        if (cells[i] !== WATER || !rest[i] || moved[x]) continue;
                        if (heading(i, x) > 0) walk(x, y, 1);
                    }
                    for (let x = 0; x < cols; x++) {
                        const i = row + x;
                        if (cells[i] !== WATER || !rest[i] || moved[x]) continue;
                        if (heading(i, x) < 0) walk(x, y, -1);
                    }
                }
            }
        };

        /**
         * the weir. everything standing above the crest over the island is head over
         * a spillway, and a spillway passes water in proportion to its head. the row
         * walk cannot: a drop leaving the lake has to land in an empty cell beside
         * the face, the fall column beside the face packs solid and advances one
         * cell a tick, so only the top row of a stacked lake ever finds an exit and
         * a crumbled word takes half a minute to drain as a slab with vertical
         * sides. so each tick every column standing above the crest spills its
         * surface cell with a chance that grows with its head, and the cell
         * reappears just under the crest in the nearer shaft as falling water. a
         * slab drops evenly, a well between two letters drains like the lake
         * beside it, and the sheet is as thick as the surplus, which is what a
         * surge over a lip looks like. water at the crest itself still leaves by
         * walking over the lip.
         */
        const spill = () => {
            const { cells, tint } = engine;
            const half = cols / 2 - shaft0;
            // where the spilled water lands: the rows just under the crest, from the
            // island's face outward. the lip's own sheet already runs in the columns
            // nearest the face, so a cell walks out from the face until it finds air;
            // the sheet is as wide as the surplus needs it to be
            const top = crestRow + 1;
            const depth = CREST_DROP + 2;
            const span = Math.max(2, shaft0 - 2);
            for (let x = 0; x < cols; x++) {
                if ((Math.min(x, cols - 1 - x) - shaft0) / half < LIP_U) continue;
                let y = crestRow - 1;
                if (cells[y * cols + x] !== WATER) continue;
                while (y > 0 && cells[(y - 1) * cols + x] === WATER) y--;
                const i = y * cols + x;
                if (!rest[i]) continue;
                if (Math.random() * SPILL_TICKS >= SPILL_BASE + crestRow - y) continue;
                const left = x < cols / 2;
                let to = -1;
                const ty = top + Math.floor(Math.random() * depth);
                for (let dx = 0; dx < span && to < 0; dx++) {
                    const tx = left ? shaft0 - 1 - dx : cols - shaft0 + dx;
                    const t = ty * cols + tx;
                    if (cells[t] === EMPTY) to = t;
                }
                // the row is full this tick; the cell keeps its place and its head
                if (to < 0) continue;
                cells[to] = WATER;
                tint[to] = tint[i] & 3;
                rest[to] = 0;
                cells[i] = EMPTY;
                rest[i] = 0;
                sealed[i] = 0;
            }
        };

        /**
         * communicating vessels. the letters stand in the lake, and the gaps between
         * them are wells: rain that lands in a gap has solid sand either side, so no
         * row it could walk along ever reaches a hole, and the gap fills to the top
         * of the letters while the lake outside sits at the crest. water under
         * pressure does not do that, it pushes out underneath. so: label every body
         * of connected water, and where a body's highest sealed surface sits two or
         * more rows above its lowest resting surface, move a cell from the one to
         * the other. the well drains, the lake gets the bump, the bump walks out.
         * one move per body per pass, which is plenty for gaps a few cells wide.
         */
        const pressure = (passes: number) => {
            const { cells, tint } = engine;
            for (let p = 0; p < passes; p++) {
                comp.fill(0);
                let id = 0;
                let movedAny = false;
                for (let seed = 0; seed < cells.length; seed++) {
                    if (cells[seed] !== WATER || comp[seed]) continue;
                    id++;
                    let sp = 0;
                    stack[sp++] = seed;
                    comp[seed] = id;
                    let src = -1;
                    let srcY = rows;
                    let dst = -1;
                    let dstY = -1;
                    while (sp > 0) {
                        const i = stack[--sp];
                        const y = (i / cols) | 0;
                        const x = i - y * cols;
                        const open = y > 0 && cells[i - cols] === EMPTY;
                        if (open && rest[i]) {
                            if (sealed[i] && y < srcY) {
                                srcY = y;
                                src = i;
                            }
                            // the sink must be sealed too, or the lake siphons itself
                            // over the crest every time a bump bridges the dam
                            if (sealed[i] && y > dstY) {
                                dstY = y;
                                dst = i;
                            }
                        }
                        if (x > 0 && cells[i - 1] === WATER && !comp[i - 1]) {
                            comp[i - 1] = id;
                            stack[sp++] = i - 1;
                        }
                        if (x < cols - 1 && cells[i + 1] === WATER && !comp[i + 1]) {
                            comp[i + 1] = id;
                            stack[sp++] = i + 1;
                        }
                        if (y > 0 && cells[i - cols] === WATER && !comp[i - cols]) {
                            comp[i - cols] = id;
                            stack[sp++] = i - cols;
                        }
                        if (y < rows - 1 && cells[i + cols] === WATER && !comp[i + cols]) {
                            comp[i + cols] = id;
                            stack[sp++] = i + cols;
                        }
                    }
                    if (src < 0 || dst < 0 || srcY >= dstY - 1) continue;
                    const to = dst - cols;
                    cells[to] = WATER;
                    tint[to] = tint[src] & 3;
                    cells[src] = EMPTY;
                    rest[to] = 1;
                    rest[src] = 0;
                    sealed[src] = 0;
                    movedAny = true;
                }
                if (!movedAny) return;
            }
        };

        /** wind only nudges drops that are still falling, so pools stay level */
        const blow = () => {
            const p = Math.abs(wind);
            if (p < 0.01) return;
            const dir = wind > 0 ? 1 : -1;
            for (let y = rows - 2; y >= 0; y--) {
                const row = y * cols;
                for (let x = 0; x < cols; x++) {
                    const i = row + x;
                    if (engine.cells[i] !== WATER) continue;
                    if (engine.cells[i + cols] !== EMPTY) continue; // landed, leave it
                    if (Math.random() > p) continue;
                    const nx = x + dir;
                    if (nx < 0 || nx >= cols) continue;
                    if (engine.cells[row + nx] !== EMPTY) continue;
                    engine.cells[row + nx] = WATER;
                    engine.tint[row + nx] = engine.tint[i];
                    engine.cells[i] = EMPTY;
                }
            }
        };

        /** sand, packed or loose: something a bird can stand on. water is not */
        const standable = (m: number) => m !== EMPTY && m !== WATER && m !== WALL;
        /**
         * a free cell on top of the word with sand under it, or -1. tries a few
         * columns; the word is mostly top surface, so it rarely comes up empty
         */
        const perchSite = (): number => {
            const { cells } = engine;
            if (wordBox.x1 <= wordBox.x0) return -1;
            // two on the word is company, the whole flock is a roost
            let sitting = 0;
            for (const b of flock.birds) if (b.state === PERCH) sitting++;
            if (sitting >= 2) return -1;
            for (let tries = 0; tries < 6; tries++) {
                const x = wordBox.x0 + ((Math.random() * (wordBox.x1 - wordBox.x0 + 1)) | 0);
                for (let y = Math.max(2, wordBox.y0 - 2); y <= wordBox.y1; y++) {
                    const i = y * cols + x;
                    if (cells[i] === EMPTY) continue;
                    if (standable(cells[i]) && cells[i - cols] === EMPTY && cells[i - 2 * cols] === EMPTY) return i - cols;
                    break;
                }
            }
            return -1;
        };
        /** a drop passing through the cell is not a reason to abort a landing */
        const perchHolds = (i: number): boolean =>
            i >= cols &&
            i + cols < engine.cells.length &&
            (engine.cells[i] === EMPTY || engine.cells[i] === WATER) &&
            standable(engine.cells[i + cols]);
        /** a drop about to land on it, a bolt, or the brush close by: reasons to leave */
        const scaredAt = (x: number, y: number): boolean => {
            if (flash > 0) return true;
            const xi = Math.round(x);
            const yi = Math.round(y);
            if (xi >= 0 && xi < cols) {
                for (let k = 1; k <= 3; k++) {
                    const yy = yi - k;
                    if (yy < 0) break;
                    if (engine.cells[yy * cols + xi] === WATER) return true;
                }
            }
            const dx = touchedAt.x - x;
            const dy = touchedAt.y - y;
            return frame - touchedAt.frame < 30 && dx * dx + dy * dy < 12 * 12;
        };
        /**
         * how many birds the sky holds: none at night, a few at dusk heading home,
         * a small flock at noon, fewer as the deck closes in. they come and go by
         * flying, so the count can change as often as it likes
         */
        const birds = () => {
            const look = themeRef.current;
            const want = look === "dark" ? 0 : Math.round((look === "dusk" ? 3 : 6) * (1 - cover * 0.8));
            flock.tick({ wind, want, perch: perchSite, holds: perchHolds, scared: scaredAt });
            // a sitting bird leaves a seed where it sits; the letter under it is
            // where it lands, and rain decides whether it takes
            for (const b of flock.birds) {
                if (b.state !== PERCH || Math.random() > BIRD_SEED) continue;
                const i = (b.y | 0) * cols + (b.x | 0);
                if (engine.cells[i] === EMPTY) {
                    engine.set(b.x | 0, b.y | 0, SEED);
                    sandAwake = true;
                }
            }
        };

        /**
         * the living layer, a few times a second: rain soaks the sand it touches,
         * the soak fades, seeds that have landed take on wet ground, moss spreads
         * over it up to its share of the word
         */
        const live = () => {
            if (frame % MOSS_EVERY !== 0) return;
            dampen(moss);
            decay(moss, 1);
            germinate(moss);
            mossCount = grow(moss, mossBudget, MOSS_RATE);
        };

        /**
         * winter, when the snow chip has painted some: flakes drift down and cap
         * what they land on, ice creeps over the lake while they fall, and the
         * sun (noon, not the moon) takes it all back to water from the open
         * face in, which wets the word for the moss
         */
        const frost = () => {
            const world = { cols, rows, cells: engine.cells, tint: engine.tint, resting: (i: number) => rest[i] === 1 };
            if (flakes.length) {
                waterCount -= driftFlakes(flakes, world, wind);
                if ((frame & 3) === 0) freeze(world, FREEZE * 4);
            }
            const sun = Math.max(0, cur.sun - 0.35) * (1 - cover);
            if (sun > 0 && (frame & 3) === 0) thaw(world, MELT * 4 * sun);
        };

        /** a moss cell picked at random, for a firefly to hang around */
        const mossHome = (): readonly [number, number] | null => {
            if (mossCount === 0) return null;
            const cells = engine.cells;
            let pick = -1;
            let seen = 0;
            for (let i = 0; i < cells.length; i++) {
                if (cells[i] !== MOSS) continue;
                seen++;
                if (Math.random() * seen < 1) pick = i;
            }
            if (pick < 0) return null;
            return [pick % cols, (pick / cols) | 0];
        };

        /** the top of the sand in column x, or -1 when there is none over the water */
        const surfaceAt = (x: number): number => {
            const cells = engine.cells;
            for (let y = 0; y < rows; y++) {
                const m = cells[y * cols + x];
                if (m === WATER || m === WALL) return -1;
                if (m !== EMPTY) return y;
            }
            return -1;
        };

        /** a snail on the surface over a patch of moss, or null when there is no surface there */
        const callSnail = (): Snail | null => {
            const home = mossHome();
            if (!home) return null;
            const x = Math.max(0, Math.min(cols - 1, home[0] + ((Math.random() * 7) | 0) - 3));
            const y = surfaceAt(x);
            return y > 0 ? spawnSnail(x, y - 1, x < cols / 2 ? 1 : -1) : null;
        };

        const snailEnv = {
            solid: (x: number, y: number) => {
                if (x < 0 || x >= cols || y < 0 || y >= rows) return false;
                const m = engine.cells[y * cols + x];
                return m !== EMPTY && m !== WATER;
            },
            moss: (x: number, y: number) =>
                x >= 0 && x < cols && y >= 0 && y < rows && engine.cells[y * cols + x] === MOSS,
            water: (x: number, y: number) =>
                x >= 0 && x < cols && y >= 0 && y < rows && engine.cells[y * cols + x] === WATER,
            eat: (x: number, y: number) => {
                // grazed back to the sand it grew on, and bound like the rest of the word
                engine.set(x, y, RASP | PACKED);
                mossCount--;
                snailHunger = 0;
            },
        };

        /**
         * the lake proper, cells with water over and under them so a fish is hidden:
         * how many there are, and one of them picked at random
         */
        const lakeRoom = (): { deep: number; spot: [number, number] | null } => {
            const cells = engine.cells;
            let deep = 0;
            let spot: [number, number] | null = null;
            const half = cols / 2 - shaft0;
            for (let x = 2; x < cols - 2; x++) {
                if ((Math.min(x, cols - 1 - x) - shaft0) / half < LIP_U + BANK_U) continue;
                for (let y = crestRow - 2; y < floorRow - 1; y++) {
                    if (y < 1) continue;
                    const i = y * cols + x;
                    if (cells[i] !== WATER || cells[i - cols] !== WATER || cells[i + cols] !== WATER) continue;
                    deep++;
                    if (Math.random() * deep < 1) spot = [x, y];
                }
            }
            return { deep, spot };
        };

        const fishEnv = {
            water: (x: number, y: number) =>
                x >= 0 && x < cols && y >= 0 && y < rows && engine.cells[y * cols + x] === WATER,
            open: (x: number, y: number) =>
                x >= 0 && x < cols && y >= 0 && y < rows && engine.cells[y * cols + x] === EMPTY,
        };

        /**
         * fish for the lake: one per sixty hidden cells up to three, arriving one at
         * a time as the water comes, fading out as it goes. they cruise the basin
         * and now and then one leaps; a frozen-over lake keeps them under the ice
         */
        const school = () => {
            if (frame % 30 === 0) {
                const room = lakeRoom();
                fishWant = Math.min(FISH_MAX, Math.floor(room.deep / FISH_LAKE));
                if (fishes.length < fishWant && room.spot && Math.random() < FISH_ODDS * 30) {
                    fishes.push(spawnFish(room.spot[0], room.spot[1], Math.random() < 0.5 ? -1 : 1));
                } else if (fishes.length > Math.floor(room.deep / (FISH_LAKE * 0.6))) {
                    // a lake at the edge of holding one more should not flicker it in and
                    // out, so a fish only goes once the water has really gone down
                    const f = fishes.find((f) => !f.leaving);
                    if (f) f.leaving = true;
                }
            }
            for (let k = fishes.length - 1; k >= 0; k--) {
                if (!swim(fishes[k], fishEnv, cols, rows)) fishes.splice(k, 1);
            }
        };

        const frogEnv = {
            stand: (x: number, y: number) =>
                x >= 0 && x < cols && y >= 0 && y < rows && engine.cells[y * cols + x] !== EMPTY,
            prey: (x: number, y: number): readonly [number, number] | null => {
                // the nearest lit firefly within reach, in front or above, never below its feet
                let best: readonly [number, number] | null = null;
                let bd = TONGUE * TONGUE + 1;
                for (const b of fireflies.bugs) {
                    if (b.leaving || b.fade < 0.5) continue;
                    const dx = b.x - x;
                    const dy = b.y - (y - 1);
                    if (dy > 1) continue;
                    const d = dx * dx + dy * dy;
                    if (d < bd) {
                        bd = d;
                        best = [Math.round(b.x), Math.round(b.y)];
                    }
                }
                return best;
            },
            eat: (t: readonly [number, number]) => {
                // the aim was taken half a lick ago and the bug has drifted since, about
                // a fifth of a cell typically and most of one at the tail, so an exact
                // cell match misses it roughly one lick in four
                const k = nearestFly(fireflies.bugs, t[0], t[1], FROG_SNAP);
                if (k >= 0) fireflies.bugs.splice(k, 1);
            },
            lure: (x: number): number | null => {
                // the nearest firefly's column, so it works its way over to them
                let best: number | null = null;
                for (const b of fireflies.bugs) {
                    if (b.leaving) continue;
                    if (best === null || Math.abs(b.x - x) < Math.abs(best - x)) best = b.x;
                }
                return best === null ? null : Math.round(best);
            },
        };

        /** a frog on the surface near the moss the fireflies hang around, or null when there is nowhere to sit */
        const callFrog = (): Frog | null => {
            const home = mossHome();
            if (!home) return null;
            const x = Math.max(1, Math.min(cols - 2, home[0] + ((Math.random() * 9) | 0) - 4));
            const y = surfaceAt(x);
            return y > 1 ? spawnFrog(x, y - 1, x < cols / 2 ? 1 : -1) : null;
        };

        /**
         * the moss brings company. fireflies come out over it at night, once the
         * birds have gone, a handful per patch. a snail turns up when there is
         * enough to eat, crawls the letters grazing it back to sand, and wanders
         * off an edge when it has gone half a minute without a mouthful
         */
        const critters = () => {
            school();
            const night = cur.starAlpha > 0.35;
            const want = night ? Math.min(FLIES_MAX, Math.ceil(mossCount / MOSS_PER_FLY)) : 0;
            fireflies.tick({ want, home: mossHome });

            // the frog comes for the fireflies and hops off once they have been gone a while
            const lit = fireflies.bugs.length;
            if (!frog) {
                if (lit >= FROG_FLIES && Math.random() < FROG_ODDS) {
                    frog = callFrog();
                    frogBored = 0;
                    frogWet = 0;
                }
            } else {
                frogBored = lit ? 0 : frogBored + 1;
                const fi = Math.round(frog.y) * cols + Math.round(frog.x);
                frogWet = fi >= 0 && fi < engine.cells.length && engine.cells[fi] === WATER ? frogWet + 1 : 0;
                if (frogBored > FROG_PATIENCE || frogWet > FROG_PATIENCE) frog.leaving = true;
                if (!hop(frog, frogEnv, cols, rows)) frog = null;
            }

            if (!snail) {
                if (mossCount < SNAIL_MOSS || Math.random() > SNAIL_ODDS) return;
                snail = callSnail();
                snailHunger = 0;
                return;
            }
            if (++snailHunger > SNAIL_PATIENCE) snail.leaving = true;
            if (!crawl(snail, snailEnv, cols, rows)) snail = null;
        };

        /**
         * what the bolt does to the sand it hits. fulgurite first: real lightning
         * fuses sand to glass along its path, so the grains under the hit turn to
         * glass down through the letter, a vein that rain cannot wash and a way
         * to weld the name back together. then the blast: sand around the hit is
         * loosened and thrown up and out, and falls back as a spray
         */
        const fuse = (hx: number, hy: number, depth: number, blast: number) => {
            const { cells, tint } = engine;
            const fuseCell = (i: number) => {
                cells[i] = GLASS;
                tint[i] = (Math.random() * 4) | 0;
                bed[i] = 0;
            };
            let x = hx;
            for (let y = hy; y < Math.min(rows - 1, hy + depth); y++) {
                const i = y * cols + x;
                const m = cells[i];
                // the vein crosses a gap (the dot of the i to its stem) but a
                // wall, water or ink ends it
                if (m !== EMPTY && m !== GLASS && !isSand(m)) break;
                if (isSand(m)) fuseCell(i);
                // a tube, not a thread: it wanders and thickens like the bolt did
                const nx = x + (Math.random() < 0.5 ? -1 : 1);
                if (nx >= 0 && nx < cols && Math.random() < 0.6) {
                    if (isSand(cells[y * cols + nx])) fuseCell(y * cols + nx);
                    if (Math.random() < 0.4) x = nx;
                }
            }
            if (blast <= 0) return;
            for (let dy = -blast; dy <= blast; dy++) {
                const y = hy + dy;
                if (y < 0 || y >= rows) continue;
                for (let dx = -blast; dx <= blast; dx++) {
                    const x = hx + dx;
                    if (x < 0 || x >= cols || dx * dx + dy * dy > blast * blast) continue;
                    const i = y * cols + x;
                    if (cells[i] === MOSS) {
                        // moss burns
                        cells[i] = EMPTY;
                        continue;
                    }
                    if (cells[i] === SNOW || cells[i] === ICE) {
                        // snow and ice melt
                        engine.set(x, y, WATER);
                        continue;
                    }
                    if (!isSand(cells[i])) continue;
                    // everything in the blast comes loose; most of it is thrown up
                    // and away from the hit, the rest caves in after it
                    cells[i] &= MATERIAL;
                    bed[i] = 0;
                    if (Math.random() < 0.3) continue;
                    const tx = x + Math.round((Math.random() * 2 - 1) * blast * 2.5);
                    const ty = y - 2 - ((Math.random() * blast * 2.5) | 0);
                    if (tx < 0 || tx >= cols || ty < 0) continue;
                    const t = ty * cols + tx;
                    if (cells[t] !== EMPTY) continue;
                    cells[t] = cells[i];
                    tint[t] = tint[i];
                    cells[i] = EMPTY;
                }
            }
            sandAwake = true;
        };

        /**
         * a bolt down column x from the cloud base, or from the top of the sky
         * when the sky is clear, to whatever it hits first; sand it hits it works
         * over, see fuse(). power is the tool's press; the weather's own bolts
         * are weaker and only nick the word
         */
        const bolt_ = (x0: number, power: number) => {
            let x = x0;
            let y = Math.max(0, base[x]);
            bolt = [];
            let hit = -1;
            while (y < rows - 1) {
                bolt.push(y * cols + x);
                if (Math.random() < 0.4) {
                    // fork sideways a cell so the bolt zigzags rather than drops straight
                    const nx = x + (Math.random() < 0.5 ? -1 : 1);
                    if (nx > 0 && nx < cols - 1) {
                        bolt.push(y * cols + nx);
                        x = nx;
                    }
                }
                y++;
                if (engine.cells[y * cols + x] !== EMPTY) {
                    hit = y;
                    break;
                }
            }
            flash = FLASH_FRAMES;
            if (hit < 0) return;
            const hm = engine.cells[hit * cols + x];
            if (isSand(hm)) fuse(x, hit, power > 1 ? 12 : 3, power > 1 ? 4 : 1);
            else if (hm === SNOW || hm === ICE) melt(x, hit, power > 1 ? 5 : 2);
        };

        /** the heat of a bolt on snow or ice: everything frozen within reach is water again */
        const melt = (hx: number, hy: number, radius: number) => {
            const cells = engine.cells;
            for (let dy = -radius; dy <= radius; dy++) {
                const y = hy + dy;
                if (y < 0 || y >= rows) continue;
                for (let dx = -radius; dx <= radius; dx++) {
                    const x = hx + dx;
                    if (x < 0 || x >= cols || dx * dx + dy * dy > radius * radius) continue;
                    const m = cells[y * cols + x];
                    if (m === SNOW || m === ICE) engine.set(x, y, WATER);
                }
            }
        };

        /** a bolt from a raining cloud base down to whatever it hits first */
        const strike = () => {
            const starts: Array<number> = [];
            for (let x = 2; x < cols - 2; x++) if (base[x] >= 0) starts.push(x);
            if (!starts.length) return;
            bolt_(starts[(Math.random() * starts.length) | 0], 1);
        };

        const render = () => {
            const amb = cur.ambient;
            // the flash decays fast and never gets near white: a bolt should read as a
            // pop of light on the deck, not a blown-out frame
            const t = flash / FLASH_FRAMES;
            const lift = flash > 0 ? 0.3 * t * t : 0;

            const topP = pack(
                clamp255(waterTop[0] * amb[0] + 255 * lift),
                clamp255(waterTop[1] * amb[1] + 255 * lift),
                clamp255(waterTop[2] * amb[2] + 255 * lift),
            );
            for (const m of [WALL, RASP, AMBER, INK, WATER, GLASS, SEED, MOSS, SNOW, ICE]) {
                const shades = sandRGB[m];
                for (let i = 0; i < shades.length; i++) {
                    const c = m === WALL ? mix3(shades[i], page.abyss, cur.rockLift) : shades[i];
                    sandPacked[m][i] = pack(
                        clamp255(c[0] * amb[0] + 255 * lift),
                        clamp255(c[1] * amb[1] + 255 * lift),
                        clamp255(c[2] * amb[2] + 255 * lift),
                    );
                }
            }
            const groundP = [packRGB(page.ground[0], lift), packRGB(page.ground[1], lift)];
            const abyssP = packRGB(page.abyss, lift);
            // the seam dithers rock cells into the page, and a dither is only quiet
            // when its two tones are close. so both tones sink toward the page row
            // by row down the seam, the "page" cells running a step ahead of the
            // rock: the checker never spans more than that step, and the last row
            // hands over to the ground with nothing left to see
            const seamRock: number[][] = [];
            const seamPage: number[][] = [];
            for (let r = 0; r < SEAM; r++) {
                const sink = r / (SEAM - 1);
                const rockRow: number[] = [];
                const pageRow: number[] = [];
                for (let b = 0; b < 2; b++) {
                    const rock = mix3(sandRGB[WALL][b], page.abyss, cur.rockLift);
                    const lit: RGB = [rock[0] * amb[0], rock[1] * amb[1], rock[2] * amb[2]];
                    rockRow.push(packRGB(mix3(lit, page.ground[b], sink), lift));
                    pageRow.push(packRGB(mix3(lit, page.ground[b], Math.min(1, sink + 0.4)), lift));
                }
                seamRock.push(rockRow);
                seamPage.push(pageRow);
            }

            // sky, quantised into bands. a smooth vertical ramp would be a gradient;
            // stepping it keeps the sky the same material as everything else here.
            // it runs top to horizon over the sky, then fades to the abyss under the
            // crest: below the island there is no sky, there is the page
            const BANDS = 14;
            const FADE = 7;
            const skyPacked = new Array<number>(BANDS + FADE);
            for (let b = 0; b < BANDS; b++) {
                skyPacked[b] = packRGB(mix3(cur.skyTop, cur.skyLow, b / (BANDS - 1)), lift);
            }
            for (let b = 0; b < FADE; b++) {
                skyPacked[BANDS + b] = packRGB(mix3(cur.skyLow, page.abyss, (b + 1) / FADE), lift);
            }
            const { bx, by, R, clear } = body();
            const haloR = clear * 1.25;
            const haloR2 = haloR * haloR;
            const fadeRows = Math.max(1, heroRows - crestRow);
            for (let y = 0; y < rows; y++) {
                let f: number;
                if (y < crestRow) f = (y / crestRow) * (BANDS - 1);
                else if (y < heroRows) f = BANDS - 1 + ((y - crestRow) / fadeRows) * FADE;
                else f = BANDS + FADE - 1;
                const b0 = Math.floor(f);
                const frac = f - b0;
                const row = y * cols;
                const lo = skyPacked[Math.min(BANDS + FADE - 1, b0)];
                const hi = skyPacked[Math.min(BANDS + FADE - 1, b0 + 1)];
                const bayerRow = (y & 3) * 4;
                const dy = y - by;
                // the halo is this row's own sky colour warmed toward the body, so it
                // lightens a pale horizon and a dark zenith alike, and it is clipped
                // by nothing but the crest
                const haloRow = y < crestRow && dy * dy < haloR2;
                const haloP = haloRow
                    ? packRGB(mix3(mix3(cur.skyTop, cur.skyLow, Math.min(1, f / (BANDS - 1))), cur.bodyDim, 0.3), lift)
                    : 0;
                for (let x = 0; x < cols; x++) {
                    // stipple the boundary between two bands instead of stepping it.
                    // the ramp stays a ramp, but every cell is still one of ten colours
                    const bay = (BAYER[bayerRow + (x & 3)] + 0.5) / 16;
                    let c = frac > bay ? hi : lo;
                    if (haloRow) {
                        // a soft halo on the sky itself, dithered out with distance
                        const dx = x - bx;
                        const dd = dx * dx + dy * dy;
                        if (dd < haloR2) {
                            const u = 1 - Math.sqrt(dd) / haloR;
                            if (u * u * 0.8 > bay) c = haloP;
                        }
                    }
                    buf[row + x] = c;
                }
            }

            // stars
            if (cur.starAlpha > 0.02) {
                for (const s of stars) {
                    const tw = 0.55 + 0.45 * Math.sin(frame * 0.05 + s.phase);
                    const a = s.base * tw * cur.starAlpha;
                    if (a < 0.06) continue;
                    const c = mix3(cur.skyTop, [255, 255, 255], Math.min(1, a));
                    buf[s.y * cols + s.x] = pack(clamp255(c[0]), clamp255(c[1]), clamp255(c[2]));
                }
            }

            // the celestial body: one disc, occluded by a second disc when the look
            // is a moon. the same nine cells of crater detail either way
            const lit = packRGB(cur.bodyLit);
            const dim = packRGB(cur.bodyDim);
            for (let dy = -R; dy <= R; dy++) {
                for (let dx = -R; dx <= R; dx++) {
                    if (dx * dx + dy * dy > R * R) continue;
                    const x = bx + dx;
                    const y = by + dy;
                    if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
                    // the crescent's dark limb: a second disc offset up and right
                    if (cur.crescent > 0.5) {
                        const ox = dx - R * 0.52;
                        const oy = dy + R * 0.2;
                        if (ox * ox + oy * oy < R * R) continue;
                    }
                    const crater = hash2(dx * 7 + 31, dy * 13 + 5) < 0.12;
                    buf[y * cols + x] = crater ? dim : lit;
                }
            }
            if (cur.crescent < 0.5) {
                // sun rays: eight ticks, two cells clear of the disc
                for (let k = 0; k < 8; k++) {
                    const a = (k / 8) * Math.PI * 2;
                    for (let r = R + 2; r <= R + 3; r++) {
                        const x = bx + Math.round(Math.cos(a) * r);
                        const y = by + Math.round(Math.sin(a) * r);
                        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
                        buf[y * cols + x] = dim;
                    }
                }
            }

            // cloud deck, three tones. the thresholds are what turn a smooth noise
            // field into pixel art: everything between two of them is one flat colour.
            // near the body the surviving cloud takes the body's colour instead: lit
            // from behind, burning off, not cut away
            const litP = packRGB(cur.cloudLit, lift);
            const midP = packRGB(cur.cloudMid, lift);
            const lowP = packRGB(cur.cloudLow, lift);
            const glowLitP = packRGB(mix3(cur.cloudLit, cur.bodyLit, 0.55), lift);
            const glowMidP = packRGB(mix3(cur.cloudMid, cur.bodyLit, 0.45), lift);
            const glowLowP = packRGB(mix3(cur.cloudLow, cur.bodyLit, 0.4), lift);
            for (let y = 0; y < skyRows; y++) {
                const row = y * cols;
                const bayerRow = (y & 3) * 4;
                for (let x = 0; x < cols; x++) {
                    const d = cloud[row + x];
                    if (d < 0.012) continue;
                    // lit crown near the top of each mass, shadow under it
                    const above = y > 0 ? cloud[row - cols + x] : -1;
                    const tone = d > 0.1 ? (above < 0.012 ? 0 : 1) : 2;
                    const g = glow[row + x];
                    const backlit = g > 0 && g * 1.1 > (BAYER[bayerRow + (x & 3)] + 0.5) / 16;
                    buf[row + x] = backlit
                        ? tone === 0
                            ? glowLitP
                            : tone === 1
                              ? glowMidP
                              : glowLowP
                        : tone === 0
                          ? litP
                          : tone === 1
                            ? midP
                            : lowP;
                }
            }

            // lightning channel sits over the clouds
            if (flash > 0) {
                const white = pack(255, 255, 255);
                for (const i of bolt) if (i >= 0 && i < buf.length) buf[i] = white;
            }

            // the simulation last, so grains occlude everything
            const cells = engine.cells;
            const tint = engine.tint;
            for (let y = 0; y < rows; y++) {
                const row = y * cols;
                // rock takes its shade from the row rather than the grain, so the keel
                // reads as bedded strata instead of a wall of static
                const band = ((y / 7) | 0) & 1;
                // the keel turns into the page over the last few rows of the hero band:
                // dithered, so the seam is a texture change and not a line
                const seamRow = y - (heroRows - SEAM);
                const seam = y >= heroRows ? 1 : seamRow >= 0 ? (seamRow + 1) / (SEAM + 1) : 0;
                const bayerRow = (y & 3) * 4;
                for (let x = 0; x < cols; x++) {
                    const i = row + x;
                    const m = cells[i];
                    if (m === EMPTY) {
                        if (y >= heroRows) buf[i] = abyssP;
                        continue;
                    }
                    const shades = sandPacked[m & MATERIAL];
                    if (!shades) continue;
                    if (m === WATER && (y === 0 || cells[i - cols] === EMPTY)) {
                        // the waterline, and every drop still in the air, catch the light
                        buf[i] = topP;
                    } else if (m === WALL) {
                        const page = seam > 0 && seam > (BAYER[bayerRow + (x & 3)] + 0.5) / 16;
                        // a quarter of rock cells opt out of their band, which keeps the
                        // bedding legible without turning the keel into a barcode
                        const bedded = hash2(x, y) > 0.25;
                        buf[i] =
                            seam > 0 && seam < 1
                                ? (page ? seamPage : seamRock)[seamRow][bedded ? band : tint[i] & 1]
                                : page
                                  ? groundP[bedded ? band : 1 - band]
                                  : bedded
                                    ? shades[band]
                                    : shades[tint[i] & 3];
                    } else {
                        buf[i] = shades[tint[i] & 3];
                    }
                }
            }

            // falling flakes, a cell each, over the grid and under the birds
            if (flakes.length) {
                const flakeP = sandPacked[SNOW][1];
                for (const f of flakes) {
                    const x = f.x | 0;
                    const y = f.y | 0;
                    if (x < 0 || x >= cols || y < 0 || y >= heroRows) continue;
                    buf[y * cols + x] = flakeP;
                }
            }

            // birds last: silhouettes over sky, cloud and word alike. they are the
            // nearest thing in the frame, and a bird on a letter has to be on it
            const birdP = packRGB([44 * amb[0], 34 * amb[1], 40 * amb[2]], lift * 0.5);
            for (const b of flock.birds) {
                const bx = Math.round(b.x);
                const by = Math.round(b.y);
                for (const [dx, dy] of birdCells(b)) {
                    const x = bx + dx;
                    const y = by + dy;
                    if (x < 0 || x >= cols || y < 0 || y >= heroRows) continue;
                    buf[y * cols + x] = birdP;
                }
            }

            // fish: orange body and a darker fin, seen through the water so they are
            // a shade under it and full colour only in the air of a leap
            for (const f of fishes) {
                const a = f.fade * (f.jumping ? 1 : 0.8);
                if (a < 0.03) continue;
                const fx = Math.round(f.x);
                const fy = Math.round(f.y);
                for (const [dx, dy, part] of fishCells(f)) {
                    const x = fx + dx;
                    const y = fy + dy;
                    if (x < 0 || x >= cols || y < 0 || y >= heroRows) continue;
                    const i = y * cols + x;
                    // under a letter's overhang it is behind the letter
                    const cell = engine.cells[i];
                    if (cell !== WATER && cell !== EMPTY) continue;
                    const under = buf[i];
                    const c: RGB = part === "body" ? [235 * amb[0], 140 * amb[1], 55 * amb[2]] : [190 * amb[0], 95 * amb[1], 45 * amb[2]];
                    const r = (under >>> 0) & 255;
                    const g = (under >>> 8) & 255;
                    const b = (under >>> 16) & 255;
                    buf[i] = packRGB([r + (c[0] - r) * a, g + (c[1] - g) * a, b + (c[2] - b) * a]);
                }
            }

            // the frog: a toad really, rust body and a sandy head so it reads against
            // the moss it sits on, pink tongue, lit like the grains
            if (frog) {
                const bodyP = packRGB([175 * amb[0], 105 * amb[1], 45 * amb[2]], lift);
                const headP = packRGB([235 * amb[0], 185 * amb[1], 110 * amb[2]], lift);
                const tongueP = packRGB([240 * amb[0], 120 * amb[1], 140 * amb[2]], lift);
                const fx = Math.round(frog.x);
                const fy = Math.round(frog.y);
                for (const [dx, dy, part] of frogCells(frog)) {
                    const x = fx + dx;
                    const y = fy + dy;
                    if (x < 0 || x >= cols || y < 0 || y >= heroRows) continue;
                    if (part === "tongue" && engine.cells[y * cols + x] !== EMPTY) continue;
                    buf[y * cols + x] = part === "body" ? bodyP : part === "head" ? headP : tongueP;
                }
            }

            // the snail: a shell of amber-brown and a pale body, lit like the grains
            if (snail) {
                const shellP = packRGB([150 * amb[0], 95 * amb[1], 50 * amb[2]], lift);
                const bodyP = packRGB([225 * amb[0], 205 * amb[1], 170 * amb[2]], lift);
                for (const [dx, dy, part] of snailCells(snail)) {
                    const x = snail.x + dx;
                    const y = snail.y + dy;
                    if (x < 0 || x >= cols || y < 0 || y >= heroRows) continue;
                    buf[y * cols + x] = part === "shell" ? shellP : bodyP;
                }
            }

            // fireflies: a lit cell with a faint cross of halo, mixed over whatever
            // is there so a blink over the word is a glow on it, not a hole in it
            for (const f of fireflies.bugs) {
                const g = flyGlow(f);
                if (g < 0.04) continue;
                const fx = Math.round(f.x);
                const fy = Math.round(f.y);
                const spots: Array<[number, number, number]> = [
                    [fx, fy, g],
                    [fx - 1, fy, g * 0.45],
                    [fx + 1, fy, g * 0.45],
                    [fx, fy - 1, g * 0.45],
                    [fx, fy + 1, g * 0.45],
                ];
                for (const [x, y, a] of spots) {
                    if (x < 0 || x >= cols || y < 0 || y >= heroRows) continue;
                    const i = y * cols + x;
                    const v = buf[i];
                    buf[i] = pack(
                        clamp255((v & 255) + (255 - (v & 255)) * a),
                        clamp255(((v >> 8) & 255) + (235 - ((v >> 8) & 255)) * a),
                        clamp255(((v >> 16) & 255) + (70 - ((v >> 16) & 255)) * a),
                    );
                }
            }

            srcCtx.putImageData(image, 0, 0);
            view.imageSmoothingEnabled = false;
            view.clearRect(0, 0, canvas.width, canvas.height);
            view.drawImage(src, 0, 0, canvas.width, canvas.height);
        };

        /* ----------------------------------------------------------- loop */

        /** the simulation ticks at 60hz whatever the display refreshes at */
        const clock = createFixedStep(60, 2);
        let hudAt = 0;
        const tick = () => {
            frame++;
            easeLook(LOOK_BY[themeRef.current], 0.035);

            // wind wanders on its own so the deck never drifts at a constant rate
            wind = 0.07 + 0.04 * Math.sin(frame * 0.0018) + 0.02 * Math.sin(frame * 0.0071);
            drift += wind * 0.0035;

            // recount now and then: the pointer can add or erase water behind the
            // budget's back, and a drifting count would slowly break the cycle
            if (frame % 90 === 0) recount();
            else airRaw = Math.max(0, Math.min(1, (capacity - waterCount) / capacity));
            air += (airRaw - air) * 0.012;

            if ((frame & 1) === 0) stepClouds();
            rain();
            blow();
            fall();
            settle();
            if (sandAwake) engine.step({ water: false });
            markResting();
            drink();
            live();
            frost();
            critters();
            flow(FLOW_PASSES);
            spill();
            pressure(10);
            evaporate();
            birds();
            // the falls leave the frame, and what leaves rejoins the air. this is the
            // half of the loop the island made possible: the drop is not a dead end.
            // sand that gets this far is gone too, there is no floor under the page
            const lastRow = (rows - 1) * cols;
            for (let x = 0; x < cols; x++) {
                const m = engine.cells[lastRow + x];
                if (m === EMPTY || m === WALL) continue;
                if (m === WATER) waterCount--;
                engine.cells[lastRow + x] = EMPTY;
            }

            if (flash > 0) flash--;
            else if (cur.starAlpha > 0.35 && air > 0.38 && Math.random() < 0.007) strike();

            if (frame - hudAt > 20) {
                hudAt = frame;
                let covered = 0;
                for (let i = 0; i < cloud.length; i++) if (cloud[i] > 0.012) covered++;
                cover = covered / cloud.length;
                setHud({ humidity: air, cover, drops: waterCount });
            }
        };

        /** off screen the loop stops dead; the observer below restarts it */
        let visible = true;
        const loop = (now: number) => {
            if (!running || !visible) return;
            // a 120hz display gets two frames per tick, not double-speed weather. a
            // tab coming back from the background gets at most two ticks, not a
            // catch-up storm. same clock as the old sand hero
            const steps = clock.advance(now);
            for (let i = 0; i < steps; i++) tick();
            if (steps) render();
            raf = requestAnimationFrame(loop);
        };

        /* ------------------------------------------------------- pointer */

        const cellFrom = (clientX: number, clientY: number) => {
            const rect = canvas.getBoundingClientRect();
            return {
                x: Math.floor(((clientX - rect.left) / rect.width) * cols),
                y: Math.floor(((clientY - rect.top) / rect.height) * rows),
            };
        };
        /** the readout stops asking once the sand has been touched */
        const wake = () => {
            if (reduced) return;
            sandAwake = true;
            setAwake(true);
        };
        let painting = false;
        const chrome = (e: PointerEvent) => !!(e.target as HTMLElement).closest("button, a");
        /** the brush loosens what it touches a little wider than it pours */
        const dig = (cx: number, cy: number, radius: number) => {
            const { cells } = engine;
            for (let dy = -radius; dy <= radius; dy++) {
                const y = cy + dy;
                if (y < 0 || y >= rows) continue;
                for (let dx = -radius; dx <= radius; dx++) {
                    const x = cx + dx;
                    if (x < 0 || x >= cols || dx * dx + dy * dy > radius * radius) continue;
                    const i = y * cols + x;
                    if (cells[i] & PACKED) loosen(i);
                }
            }
        };
        let strokes = 0;
        const stroke = (e: PointerEvent) => {
            strokes++;
            const { x, y } = cellFrom(e.clientX, e.clientY);
            const m = toolRef.current;
            if (m === CLOUD || m === SNOWCLOUD) {
                seed(x, y, 4, m === SNOWCLOUD);
                return;
            }
            if (m === SEED) {
                // a pinch of seed into the air, not a pour: they fall and wait for rain
                touchedAt = { x, y, frame };
                for (let k = 0; k < 3; k++) {
                    const sx = x + ((Math.random() * 5) | 0) - 2;
                    const sy = y + ((Math.random() * 5) | 0) - 2;
                    if (sx < 0 || sx >= cols || sy < 0 || sy >= rows) continue;
                    if (engine.cells[sy * cols + sx] === EMPTY) engine.set(sx, sy, SEED);
                }
                sandAwake = true;
                return;
            }
            const r = m === EMPTY ? 5 : 3;
            touchedAt = { x, y, frame };
            dig(x, y, r + 1);
            engine.pour(x, y, r, m);
        };
        /**
         * reduced motion has no loop to pick a change up, so the pointer paints its own
         * frame. the cloud brush writes to `stain`, which only reaches the sky through
         * stepClouds, so that runs too: render alone would draw a frame with no cloud in it
         */
        const repaint = () => {
            stepClouds();
            render();
        };
        /**
         * wraps the whole brush rather than sitting inside it: the cloud and seed
         * branches return early, and so will the next tool
         */
        const paint = (e: PointerEvent) => {
            stroke(e);
            if (reduced) repaint();
        };
        const down = (e: PointerEvent) => {
            if (e.button !== 0 || chrome(e)) return;
            // a press on the copy is for the text: select it, do not paint over it.
            // anywhere else the press is a brush stroke, and the default it cancels
            // is the browser starting a text selection that the drag would then
            // sweep across the heading
            if ((e.target as HTMLElement).closest(".hero-copy")) return;
            e.preventDefault();
            if (toolRef.current === LIGHTNING) {
                // a press, not a stroke: one bolt per click
                const { x, y } = cellFrom(e.clientX, e.clientY);
                touchedAt = { x, y, frame };
                wake();
                bolt_(Math.max(1, Math.min(cols - 2, x)), 2);
                if (reduced) {
                    // nothing runs to decay the flash, and a white frame that never
                    // clears is the last thing reduced motion wants: keep the glass
                    // the bolt fused, drop the flash and the channel
                    flash = 0;
                    repaint();
                }
                return;
            }
            painting = true;
            stage.setPointerCapture(e.pointerId);
            wake();
            paint(e);
        };
        const move = (e: PointerEvent) => {
            if (painting) paint(e);
        };
        const up = () => {
            painting = false;
        };
        /**
         * drop a burst of grains in from a point in page space. the look buttons
         * use it, so picking a time of day spills something out of the button
         * instead of just recolouring the page
         */
        const pourAt = (clientX: number, clientY: number, material: number) => {
            const { x, y } = cellFrom(clientX, clientY);
            engine.pour(x, y, 5, material);
            sandAwake = true;
            if (reduced) render();
        };
        pourRef.current = pourAt;

        const ro = new ResizeObserver(() => {
            build();
            render();
        });

        build();
        // the variable font may still be loading on first paint; stamp after it settles
        document.fonts.ready
            .catch(() => undefined)
            .then(() => {
                if (!running) return;
                terrain();
                render();
            });
        resetRef.current = () => {
            terrain();
            render();
        };
        soakRef.current = () => {
            // lift every drop back into the air at once: the sky closes over within
            // a second or two, then rains it all back down
            for (let i = 0; i < engine.cells.length; i++) {
                if (engine.cells[i] === WATER) engine.cells[i] = EMPTY;
            }
            waterCount = 0;
            airRaw = 1;
            air = 1;
        };

        if (import.meta.env.DEV) {
            // the lab's acceptance checks read the lake through this, nothing else does
            const half = () => cols / 2 - shaft0;
            (window as Window & { __wx?: unknown }).__wx = {
                birds: () => flock.birds.map((b) => ({ x: b.x | 0, y: b.y | 0, state: b.state })),
                perch: () => ({ site: perchSite(), box: wordBox, skyRows }),
                /** painted deck left, summed */
                stain: () => stain.reduce((a, v) => a + v, 0),
                seed: (x: number, y: number) => seed(x, y, 4),
                tool: () => toolRef.current,
                strokes: () => strokes,
                /** glass cells, what the lightning has fused so far */
                glass: () => {
                    let n = 0;
                    for (let i = 0; i < engine.cells.length; i++) if (engine.cells[i] === GLASS) n++;
                    return n;
                },
                /** a tool bolt on column x */
                bolt: (x: number) => bolt_(x, 2),
                moss: () => {
                    let seeds = 0;
                    let wet = 0;
                    for (let i = 0; i < engine.cells.length; i++) {
                        if (engine.cells[i] === SEED) seeds++;
                        if (moss.damp[i] > 0) wet++;
                    }
                    return { moss: mossCount, budget: mossBudget, seeds, wet };
                },
                critters: () => ({
                    flies: fireflies.bugs.length,
                    bugs: fireflies.bugs.map((b) => [Math.round(b.x), Math.round(b.y), +b.fade.toFixed(2)]),
                    lit: fireflies.bugs.filter((b) => flyGlow(b) > 0.3).length,
                    snail: snail ? { x: snail.x, y: snail.y, chew: snail.chew, leaving: snail.leaving } : null,
                    fish: fishes.map((f) => ({ x: Math.round(f.x), y: Math.round(f.y), jumping: f.jumping, fade: f.fade, leaving: f.leaving })),
                    fishWant,
                    lake: lakeRoom().deep,
                    frog: frog ? { x: frog.x, y: frog.y, state: frog.state, licking: frog.state === LICK, leaving: frog.leaving } : null,
                }),
                /** call the frog now */
                frog: () => {
                    for (let k = 0; k < 20 && !frog; k++) frog = callFrog();
                    frogBored = 0;
                    return frog;
                },
                /** call a fish now, and make one leap */
                fish: () => {
                    const room = lakeRoom();
                    if (room.spot) fishes.push(spawnFish(room.spot[0], room.spot[1], 1));
                    return fishes.length;
                },
                leap: () => {
                    for (const f of fishes) {
                        f.jumping = true;
                        f.vy = -0.5;
                    }
                },
                /** call the snail now */
                snail: () => {
                    for (let k = 0; k < 20 && !snail; k++) snail = callSnail();
                    return snail;
                },
                frost: () => {
                    let snow = 0;
                    let ice = 0;
                    for (let i = 0; i < engine.cells.length; i++) {
                        if (engine.cells[i] === SNOW) snow++;
                        if (engine.cells[i] === ICE) ice++;
                    }
                    return { flakes: flakes.length, snow, ice, chill: chill.reduce((a, v) => a + v, 0), waterCount };
                },
                /** a cold cloud at a cell */
                chill: (x: number, y: number) => seed(x, y, 4, true),
                /** a pinch of seed at a cell */
                sow: (x: number, y: number) => {
                    for (let k = 0; k < 3; k++) engine.set(x + k - 1, y, SEED);
                    sandAwake = true;
                },
                /** how much of the word still stands: packed grains left */
                packed: () => {
                    let n = 0;
                    for (let i = 0; i < engine.cells.length; i++) if (engine.cells[i] & PACKED) n++;
                    return n;
                },
                probe: () => {
                    // the lake proper: water stacked on the basin floor, not what sits
                    // on the letters or in the counter of the e
                    let surface = rows;
                    const cells = engine.cells;
                    for (let x = 0; x < cols; x++) {
                        if ((Math.min(x, cols - 1 - x) - shaft0) / half() < LIP_U + BANK_U) continue;
                        let y = floorRow - 1;
                        if (cells[y * cols + x] !== WATER) continue;
                        while (y > 0 && cells[(y - 1) * cols + x] === WATER) y--;
                        if (y < surface) surface = y;
                    }
                    // the lake apart from the wells: a column is a well when sand or
                    // wall sits within six cells of it along the row under the crest
                    let lake = 0;
                    let wells = 0;
                    for (let x = 0; x < cols; x++) {
                        if ((Math.min(x, cols - 1 - x) - shaft0) / half() < LIP_U + BANK_U) continue;
                        let y = floorRow - 1;
                        if (cells[y * cols + x] !== WATER) continue;
                        while (y > 0 && cells[(y - 1) * cols + x] === WATER) y--;
                        const head = crestRow - y;
                        if (head <= 0) continue;
                        let walled = false;
                        for (let d = -6; d <= 6 && !walled; d++) {
                            const m = cells[(crestRow - 1) * cols + x + d];
                            walled = m !== EMPTY && m !== WATER;
                        }
                        if (walled) wells = Math.max(wells, head);
                        else lake = Math.max(lake, head);
                    }
                    let left = 0;
                    let right = 0;
                    for (let y = crestRow + CREST_DROP + 2; y < rows - 1; y++) {
                        for (let x = 0; x < shaft0; x++) {
                            if (cells[y * cols + x] === WATER) left++;
                            if (cells[y * cols + cols - 1 - x] === WATER) right++;
                        }
                    }
                    return { crestRow, surface, above: crestRow - surface, lake, wells, left, right, air, waterCount, frame };
                },
                look: (i: number) => pick(THEMES[i]),
                /** head per interior column, negative while the top cell is still falling */
                heads: () => {
                    const half = cols / 2 - shaft0;
                    const cells = engine.cells;
                    const hist: number[] = [];
                    for (let x = 0; x < cols; x++) {
                        if ((Math.min(x, cols - 1 - x) - shaft0) / half < LIP_U) continue;
                        let y = crestRow - 1;
                        let head = 0;
                        if (cells[y * cols + x] === WATER) {
                            while (y > 0 && cells[(y - 1) * cols + x] === WATER) y--;
                            head = rest[y * cols + x] ? crestRow - y : -(crestRow - y);
                        }
                        hist.push(head);
                    }
                    return hist;
                },
                /** stack n rows of water on the lake, the crumble's surge without the crumble */
                surge: (n: number) => {
                    const half = cols / 2 - shaft0;
                    const cells = engine.cells;
                    for (let x = 0; x < cols; x++) {
                        if ((Math.min(x, cols - 1 - x) - shaft0) / half < LIP_U + BANK_U) continue;
                        for (let y = crestRow - 1; y >= Math.max(1, crestRow - n); y--) {
                            const i = y * cols + x;
                            if (cells[i] !== EMPTY) continue;
                            cells[i] = WATER;
                            waterCount++;
                        }
                    }
                },
            };
        }


        stage.addEventListener("pointerdown", down);
        stage.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        window.addEventListener("pointercancel", up);
        ro.observe(stage);

        // don't burn frames while scrolled away
        const io = new IntersectionObserver(([entry]) => {
            const was = visible;
            visible = entry.isIntersecting;
            if (visible && !was && !reduced) {
                cancelAnimationFrame(raf);
                clock.reset();
                raf = requestAnimationFrame(loop);
            }
        });
        io.observe(stage);

        if (reduced) {
            // one settled frame, no cycle: the page still shows a sky, a lake and a shore
            easeLook(LOOK_BY[themeRef.current], 1);
            stepClouds();
            render();
        } else {
            raf = requestAnimationFrame(loop);
        }

        return () => {
            running = false;
            cancelAnimationFrame(raf);
            ro.disconnect();
            io.disconnect();
            stage.removeEventListener("pointerdown", down);
            stage.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
            window.removeEventListener("pointercancel", up);
        };
    }, []);

    /** the theme is the look: pick one and the page, the sky and the sand follow */
    const pick = (next: Theme, from?: HTMLElement) => {
        themeRef.current = next;
        setTheme(next);
        applyTheme(next);
        retargetRef.current();
        // pour from just under the button, so the grains look like they fell out of it
        const rect = from?.getBoundingClientRect();
        if (rect) pourRef.current(rect.left + rect.width / 2, rect.bottom + 6, DUST[next]);
    };

    const shades = PALETTES[theme === "light" ? "light" : "dark"];

    return (
        <div className="weather-hero" ref={stageRef}>
            <canvas
                ref={canvasRef}
                className="weather-canvas"
                role="img"
                aria-label="a falling-sand toy: the word mike written in raspberry sand, standing in a lake on an island under a pixel sky that rains"
            />

            <div className="weather-band" ref={bandRef}>
                {overlay}

                <div className="sky-looks" role="group" aria-label="time of day">
                    {LOOKS.map((l) => (
                        <button
                            key={l.id}
                            type="button"
                            className="sand-tool sky-look"
                            aria-pressed={theme === l.id}
                            onClick={(e) => pick(l.id, e.currentTarget)}
                        >
                            <SkyIcon look={l} />
                            <span className="sky-look-label">{l.label}</span>
                        </button>
                    ))}
                </div>

                <div className="sand-tools" role="toolbar" aria-label="sand materials">
                    {TOOLS.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            className="sand-tool"
                            aria-pressed={tool === t.id}
                            onClick={() => setTool(t.id)}
                        >
                            {t.id === EMPTY ? (
                                <span className="sand-swatch sand-swatch-erase" />
                            ) : t.id === CLOUD ? (
                                <span className="sand-swatch sand-swatch-cloud" />
                            ) : t.id === SNOWCLOUD ? (
                                <span className="sand-swatch sand-swatch-snow" />
                            ) : t.id === LIGHTNING ? (
                                <span className="sand-swatch sand-swatch-bolt" />
                            ) : t.id === SEED ? (
                                <span className="sand-swatch" style={{ background: shades[MOSS][0] }} />
                            ) : (
                                <span className="sand-swatch" style={{ background: shades[t.id][0] }} />
                            )}
                            <span className="sand-tool-label">{t.label}</span>
                        </button>
                    ))}
                    {lab ? (
                        <button type="button" className="sand-tool sand-reset" onClick={() => soakRef.current()}>
                            soak
                        </button>
                    ) : null}
                    <button type="button" className="sand-tool sand-reset" onClick={() => resetRef.current()}>
                        reset<span className="sand-tool-label"> sand</span>
                    </button>
                </div>

                {/* the nudge is for everyone and goes away on the first touch; the
                    numbers behind it are the lab's instrumentation, so off the front
                    page the pill leaves with the nudge */}
                {lab || !awake ? (
                    <p className="sand-hint" data-awake={awake} aria-hidden="true">
                        {awake ? null : <span className="sand-hint-nudge">touch the sand</span>}
                        {lab ? (
                            <span className="sand-hint-stats">
                                {awake ? "" : " · "}
                                humidity {(hud.humidity * 100).toFixed(0)}% · cover{" "}
                                {(hud.cover * 100).toFixed(0)}% · {hud.drops} drops
                            </span>
                        ) : null}
                    </p>
                ) : null}
            </div>

            {children}
        </div>
    );
}


/** [x, y, width, height], in cells of the icon's own 8x8 grid */
type IconCell = [number, number, number, number];

/**
 * the three looks as 8x8 pixel tiles: the same disc, half-set disc and crescent
 * the sky draws, in that look's own colours and on whole cells, so at 16px a
 * cell is exactly two device pixels and nothing is anti-aliased. each tile
 * brings its own sky as a ground, so it reads on all three page themes
 */
function SkyIcon({ look }: { look: Look }) {
    const rgb = (c: RGB) => `rgb(${c[0]} ${c[1]} ${c[2]})`;
    const mix = (a: RGB, b: RGB, t: number) =>
        rgb([
            Math.round(a[0] + (b[0] - a[0]) * t),
            Math.round(a[1] + (b[1] - a[1]) * t),
            Math.round(a[2] + (b[2] - a[2]) * t),
        ]);

    const black: RGB = [0, 0, 0];
    const lit = rgb(look.bodyLit);
    const dim = rgb(look.bodyDim);

    // the same octagon three times, sliced differently: whole and high for noon,
    // cut off at the horizon for dusk, bitten into a crescent for night
    const disc: Array<IconCell> = [
        [3, 1, 2, 1],
        [2, 2, 4, 1],
        [1, 3, 6, 1],
        [1, 4, 6, 1],
        [2, 5, 4, 1],
        [3, 6, 2, 1],
    ];

    // painted in order, so the land band covers the half of the sun below it
    const layers: Array<{ fill: string; cells: Array<IconCell> }> =
        look.crescent > 0.5
            ? [
                  { fill: rgb(look.skyTop), cells: [[0, 0, 8, 8]] },
                  {
                      fill: dim,
                      cells: [
                          [6, 2, 1, 1],
                          [1, 7, 1, 1],
                      ],
                  },
                  {
                      fill: lit,
                      cells: [
                          [3, 1, 3, 1],
                          [2, 2, 3, 1],
                          [1, 3, 3, 1],
                          [1, 4, 3, 1],
                          [2, 5, 3, 1],
                          [3, 6, 3, 1],
                      ],
                  },
              ]
            : look.sun > 0.5
              ? [
                    { fill: rgb(look.skyTop), cells: [[0, 0, 8, 7]] },
                    { fill: rgb(look.skyLow), cells: [[0, 7, 8, 1]] },
                    // eight ticks a cell clear of the disc, the same count the sky
                    // throws, so noon is a sun and not just a bright disc
                    {
                        fill: dim,
                        cells: [
                            [3, 0, 2, 1],
                            [3, 7, 2, 1],
                            [0, 3, 1, 2],
                            [7, 3, 1, 2],
                            [1, 1, 1, 1],
                            [6, 1, 1, 1],
                            [1, 6, 1, 1],
                            [6, 6, 1, 1],
                        ],
                    },
                    {
                        fill: lit,
                        cells: [
                            [3, 2, 2, 1],
                            [2, 3, 4, 1],
                            [2, 4, 4, 1],
                            [3, 5, 2, 1],
                        ],
                    },
                ]
              : [
                    { fill: rgb(look.skyTop), cells: [[0, 0, 8, 3]] },
                    // the burn at the horizon, pulled back toward the night sky so
                    // the sun still stands out of it
                    { fill: mix(look.skyLow, look.skyTop, 0.35), cells: [[0, 3, 8, 3]] },
                    { fill: lit, cells: disc },
                    // the land eats the bottom cap of the disc, so the sun is a
                    // whole round thing resting on the horizon rather than a mound
                    { fill: mix(look.skyTop, black, 0.5), cells: [[0, 6, 8, 2]] },
                ];

    return (
        <svg className="sky-icon" viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
            {layers.map((layer, i) =>
                layer.cells.map(([x, y, w, h]) => (
                    <rect key={`${i}-${x}-${y}`} x={x} y={y} width={w} height={h} fill={layer.fill} />
                )),
            )}
        </svg>
    );
}
