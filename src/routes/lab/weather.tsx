import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
    AMBER,
    EMPTY,
    PALETTES,
    RASP,
    SandEngine,
    stampWord,
    WALL,
    WATER,
} from "../../lib/sand-engine";
import "./weather.css";

/**
 * weather — a closed water cycle drawn at grain resolution.
 *
 * the anthropic fable 5.1 launch hero is a three.js scene: a procedural cumulus
 * deck under three time-of-day looks, with depth of field, chromatic aberration
 * and a rigged bird. this page keeps the one idea worth keeping (a cloud deck you
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
 * the canvas is shaped like the front page: the hero band on top, the "i make
 * stuff." block under it, one grid behind both. that is what lets the falls be
 * page-height without a page-height hero.
 *
 * one canvas, one Uint32Array, no webgl and no dependencies past the sand engine
 * the front page already ships.
 */

const TITLE = "weather · lab · mike pšenčík";

export const Route = createFileRoute("/lab/weather")({
    component: Page,
    head: () => ({
        meta: [{ title: TITLE }, { name: "robots", content: "noindex" }],
    }),
});

/** how long a strike lights the deck, in frames */
const FLASH_FRAMES = 12;
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
/** how far a landed drop can travel along its row in one pass */
const REACH = 8;
const FLOW_PASSES = 3;
/** scales the per-column rain rate: the falls can only carry so much */
const RAIN = 0.4;
const FONT_STACK = "'Sora Variable', system-ui, sans-serif";

type RGB = [number, number, number];

type Look = {
    id: "noon" | "dusk" | "night";
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
};

const LOOKS: Array<Look> = [
    {
        id: "noon",
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
    },
    {
        id: "night",
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
    },
];

/**
 * the page under the island. it does not change with the weather, because it is
 * the page: the same dark ground the front page's copy sits on. the abyss is what
 * shows through the shafts once the sky has faded out below the crest.
 */
const GROUND: [RGB, RGB] = [
    [31, 26, 28],
    [37, 31, 34],
];
const ABYSS: RGB = [21, 18, 20];

const TOOLS: Array<{ id: number; label: string }> = [
    { id: RASP, label: "sand" },
    { id: WALL, label: "rock" },
    { id: WATER, label: "water" },
    { id: EMPTY, label: "erase" },
];

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

/* ------------------------------------------------------------------- page */

type Hud = { humidity: number; cover: number; drops: number };

function Page() {
    const stageRef = useRef<HTMLDivElement>(null);
    const bandRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lookRef = useRef(0);
    const toolRef = useRef<number>(RASP);
    const [lookIdx, setLookIdx] = useState(0);
    const [tool, setTool] = useState<number>(RASP);
    const [awake, setAwake] = useState(false);
    const [hud, setHud] = useState<Hud>({ humidity: 0.55, cover: 0, drops: 0 });
    const resetRef = useRef<() => void>(() => {});
    const soakRef = useRef<() => void>(() => {});

    useEffect(() => {
        lookRef.current = lookIdx;
    }, [lookIdx]);
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
        /** lowest raining row per column, -1 for clear sky */
        let base = new Int16Array(1);
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

        /** sand grain colours as raw rgb, before the look's ambient tint */
        const sandRGB: Record<number, Array<RGB>> = {};
        for (const m of [WALL, RASP, AMBER, WATER]) {
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
            [WATER]: [0, 0, 0, 0],
        };

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
         * the sand keeps the front page's contract: it holds its shape until the
         * first touch, then it is powder. the weather runs regardless, because rain
         * that waits for a pointer is not weather.
         */
        let sandAwake = false;

        // the displayed look eases toward the selected one so the dots read as a
        // time-of-day transition, the way the anthropic hero's do, not a swap
        let cur: Look = { ...LOOKS[0] };

        const easeLook = (target: Look, t: number) => {
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
        };

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
         * the width of open sky at one row. flat along the crest so the sheet leaves
         * a clean edge, then the face below erodes: it recedes, and fbm hangs a few
         * ledges off it that the falls break over on the way down.
         */
        const shaftAt = (y: number): number => {
            const drop = crestRow + CREST_DROP;
            if (y <= drop + 1) return shaft0;
            const t = y - drop;
            const recede = shaft0 + Math.min(3, t * 0.5);
            // ledges only in the hero band. beside the copy the face is plain, because
            // every ledge is a place for water to be caught behind its own stream
            if (y >= heroRows) return recede + 1;
            const wob = (fbm(y * 0.07, 77.3, 3) - 0.5) * cols * 0.07;
            return Math.max(shaft0 - 2, recede + wob);
        };

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
            stampWord(engine, "mike", FONT_STACK, {
                cx: cols / 2,
                baseline: floorRow - 2,
                size: heroRows * 0.46,
                maxWidth: (half - (LIP_U + BANK_U) * half) * 2 * 0.72,
            });
            sandAwake = false;
            setAwake(false);
            recount();
            air = airRaw;
        };

        const recount = () => {
            let n = 0;
            const cells = engine.cells;
            for (let i = 0; i < cells.length; i++) if (cells[i] === WATER) n++;
            waterCount = n;
            airRaw = Math.max(0, Math.min(1, (capacity - waterCount) / capacity));
        };

        const build = () => {
            const rect = stage.getBoundingClientRect();
            const bandRect = band.getBoundingClientRect();
            cols = Math.max(60, Math.floor((rect.width * dpr) / grain));
            rows = Math.max(50, Math.floor((rect.height * dpr) / grain));
            heroRows = Math.max(40, Math.min(rows, Math.floor((bandRect.height * dpr) / grain)));
            skyRows = Math.floor(heroRows * SKY_FRACTION);
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
        const stepClouds = () => {
            const bias = -0.54 + air * 0.36;
            const { bx, by, clear } = body();
            const clear2 = clear * clear;
            for (let x = 0; x < cols; x++) base[x] = -1;
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
                    const n = fbm(x * 0.045 + drift, y * 0.1 + 3.3, 3);
                    const d = n * band + bias - g * 0.22;
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
                const gate = vnoise(x * 0.022 + drift * 2.4, frame * 0.0007);
                if (gate < 0.54) continue;
                // squared, not linear: a damp sky barely drizzles while a saturated one
                // dumps. a linear throttle finds its equilibrium with the ground holding
                // nearly all the water, which leaves nothing in the sky to look at
                if (Math.random() > (0.7 + d * 1.9) * air * air * RAIN) continue;
                const ty = y + 1;
                if (ty >= rows) continue;
                if (engine.cells[ty * cols + x] !== EMPTY) continue;
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
         * only ever moves down: one cell a tick, straight or diagonally into a gap
         * beside its footing. every move ends lower than it started, so a settled
         * surface has nothing to do.
         */
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
                    // falling water is not a wall: a drop on a ledge beside its own
                    // stream would otherwise be walled in by it, and the ledge would
                    // fill into a pocket. it passes through and lands beyond
                    if (cells[t] === WATER && !rest[t]) {
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

        /** a bolt from a raining cloud base down to whatever it hits first */
        const strike = () => {
            const starts: Array<number> = [];
            for (let x = 2; x < cols - 2; x++) if (base[x] >= 0) starts.push(x);
            if (!starts.length) return;
            let x = starts[(Math.random() * starts.length) | 0];
            let y = base[x];
            bolt = [];
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
                if (engine.cells[y * cols + x] !== EMPTY) break;
            }
            flash = FLASH_FRAMES;
        };

        /* --------------------------------------------------------- render */

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
            for (const m of [WALL, RASP, AMBER, WATER]) {
                const shades = sandRGB[m];
                for (let i = 0; i < shades.length; i++) {
                    const c = shades[i];
                    sandPacked[m][i] = pack(
                        clamp255(c[0] * amb[0] + 255 * lift),
                        clamp255(c[1] * amb[1] + 255 * lift),
                        clamp255(c[2] * amb[2] + 255 * lift),
                    );
                }
            }
            const groundP = [packRGB(GROUND[0], lift), packRGB(GROUND[1], lift)];
            const abyssP = packRGB(ABYSS, lift);

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
                skyPacked[BANDS + b] = packRGB(mix3(cur.skyLow, ABYSS, (b + 1) / FADE), lift);
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
            const blend = 12;
            for (let y = 0; y < rows; y++) {
                const row = y * cols;
                // rock takes its shade from the row rather than the grain, so the keel
                // reads as bedded strata instead of a wall of static
                const band = ((y / 7) | 0) & 1;
                // the keel turns into the page over the last few rows of the hero band:
                // dithered, so the seam is a texture change and not a line
                const seam = y >= heroRows ? 1 : y >= heroRows - blend ? (y - (heroRows - blend) + 1) / (blend + 1) : 0;
                const bayerRow = (y & 3) * 4;
                for (let x = 0; x < cols; x++) {
                    const i = row + x;
                    const m = cells[i];
                    if (m === EMPTY) {
                        if (y >= heroRows) buf[i] = abyssP;
                        continue;
                    }
                    const shades = sandPacked[m];
                    if (!shades) continue;
                    if (m === WATER && (y === 0 || cells[i - cols] === EMPTY)) {
                        // the waterline, and every drop still in the air, catch the light
                        buf[i] = topP;
                    } else if (m === WALL) {
                        const page = seam > 0 && seam > (BAYER[bayerRow + (x & 3)] + 0.5) / 16;
                        // a quarter of rock cells opt out of their band, which keeps the
                        // bedding legible without turning the keel into a barcode
                        const bedded = hash2(x, y) > 0.25;
                        buf[i] = page ? groundP[bedded ? band : 1 - band] : bedded ? shades[band] : shades[tint[i] & 3];
                    } else {
                        buf[i] = shades[tint[i] & 3];
                    }
                }
            }

            srcCtx.putImageData(image, 0, 0);
            view.imageSmoothingEnabled = false;
            view.clearRect(0, 0, canvas.width, canvas.height);
            view.drawImage(src, 0, 0, canvas.width, canvas.height);
        };

        /* ----------------------------------------------------------- loop */

        /** the simulation ticks at this rate whatever the display refreshes at */
        const STEP = 1000 / 60;
        let acc = 0;
        let last = 0;
        let hudAt = 0;
        const tick = () => {
            frame++;
            easeLook(LOOKS[lookRef.current], 0.035);

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
            if (sandAwake) engine.step({ water: false });
            markResting();
            flow(FLOW_PASSES);
            pressure(10);
            evaporate();
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
                setHud({ humidity: air, cover: covered / cloud.length, drops: waterCount });
            }
        };

        const loop = (now: number) => {
            if (!running) return;
            // a 120hz display gets two frames per tick, not double-speed weather. a
            // tab coming back from the background gets at most two ticks, not a
            // catch-up storm
            if (last) acc += Math.min(now - last, STEP * 2);
            last = now;
            let steps = 0;
            while (acc >= STEP && steps < 2) {
                tick();
                acc -= STEP;
                steps++;
            }
            if (steps) render();
            raf = requestAnimationFrame(loop);
        };

        /* ------------------------------------------------------- pointer */

        const cellFrom = (e: PointerEvent) => {
            const rect = canvas.getBoundingClientRect();
            return {
                x: Math.floor(((e.clientX - rect.left) / rect.width) * cols),
                y: Math.floor(((e.clientY - rect.top) / rect.height) * rows),
            };
        };
        let painting = false;
        const paint = (e: PointerEvent) => {
            const { x, y } = cellFrom(e);
            const m = toolRef.current;
            engine.pour(x, y, m === EMPTY ? 5 : 3, m);
            if (reduced) render();
        };
        const down = (e: PointerEvent) => {
            if ((e.target as HTMLElement).closest("button, a")) return;
            painting = true;
            stage.setPointerCapture(e.pointerId);
            if (!sandAwake) {
                sandAwake = true;
                setAwake(true);
            }
            paint(e);
        };
        const move = (e: PointerEvent) => {
            if (painting) paint(e);
        };
        const up = () => {
            painting = false;
        };

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
                    let left = 0;
                    let right = 0;
                    for (let y = crestRow + CREST_DROP + 2; y < rows - 1; y++) {
                        for (let x = 0; x < shaft0; x++) {
                            if (cells[y * cols + x] === WATER) left++;
                            if (cells[y * cols + cols - 1 - x] === WATER) right++;
                        }
                    }
                    return { crestRow, surface, above: crestRow - surface, left, right, air, waterCount, frame };
                },
                look: (i: number) => setLookIdx(i),
            };
        }

        stage.addEventListener("pointerdown", down);
        stage.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        ro.observe(stage);

        if (reduced) {
            // one settled frame, no cycle: the page still shows a sky, a lake and a shore
            easeLook(LOOKS[lookRef.current], 1);
            stepClouds();
            render();
        } else {
            raf = requestAnimationFrame(loop);
        }

        return () => {
            running = false;
            cancelAnimationFrame(raf);
            ro.disconnect();
            stage.removeEventListener("pointerdown", down);
            stage.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
        };
    }, []);

    return (
        <main className="wx">
            <div className="wx-stage" ref={stageRef}>
                <canvas ref={canvasRef} className="wx-canvas" aria-hidden="true" />

                <div className="wx-band" ref={bandRef}>
                    <div className="wx-words">
                        <p className="wx-crumb">
                            <Link to="/lab">← the lab</Link>
                        </p>
                        <h1>weather</h1>
                        <p className="wx-lede">
                            clouds are fractal noise snapped to the sand grid. dense cells rain,
                            rain fills the lake, the lake runs off both ends of the island and
                            falls past the page. nothing here is animated. it is one loop feeding
                            itself.
                        </p>
                    </div>

                    <div className="wx-looks" role="group" aria-label="time of day">
                        {LOOKS.map((l, i) => (
                            <button
                                key={l.id}
                                type="button"
                                className="wx-look"
                                data-on={i === lookIdx}
                                style={{ background: l.swatch }}
                                aria-label={l.label}
                                aria-pressed={i === lookIdx}
                                onClick={() => setLookIdx(i)}
                            />
                        ))}
                    </div>

                    <div className="wx-bar">
                        {TOOLS.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                className="wx-chip"
                                data-on={tool === t.id}
                                onClick={() => setTool(t.id)}
                            >
                                {t.label}
                            </button>
                        ))}
                        <span className="wx-sep" />
                        <button type="button" className="wx-chip" onClick={() => soakRef.current()}>
                            soak
                        </button>
                        <button type="button" className="wx-chip" onClick={() => resetRef.current()}>
                            reset
                        </button>
                    </div>

                    <p className="wx-hud">
                        {awake ? "" : "touch the sand · "}
                        humidity {(hud.humidity * 100).toFixed(0)}% · cover{" "}
                        {(hud.cover * 100).toFixed(0)}% · {hud.drops} drops
                    </p>
                </div>

                {/* the front page's copy block, at the front page's size, so the falls
                    are measured against the thing they will actually run past */}
                <div className="container hero-copy wx-copy">
                    <h1>
                        i make stuff<span className="hero-stop">.</span>
                    </h1>
                    <p className="lede">
                        i'm mike, a full-stack product engineer in czechia. react and typescript on
                        top, node underneath, and i'd rather own the whole slice than half of it. i
                        do stuff, sometimes it works and sometimes it doesn't, but give me enough
                        time and i'll make it work. <em>probably.</em>
                    </p>
                    <p className="hero-note">
                        the sand up there is real, go make a mess. it's a tiny cousin of{" "}
                        <a href="https://github.com/thatmike1/powder-lab">powder-lab</a>.
                    </p>
                </div>
            </div>

            <div className="wx-after" aria-hidden="true">
                <span>the rest of the page starts here</span>
            </div>
        </main>
    );
}
