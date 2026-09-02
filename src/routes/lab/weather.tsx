import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
    AMBER,
    EMPTY,
    PALETTES,
    RASP,
    SandEngine,
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
 * dense cloud cells drop water. water falls, percolates through the dunes, pools
 * on the bedrock. sun evaporates standing water back into humidity, and humidity
 * is what decides cloud cover on the next frame. rain empties the sky; sunlight
 * refills it. nobody is animating the weather, it is a loop that runs itself, so
 * the scene is never twice the same and it never needs a keyframe.
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
/** fraction of the grid that is sky; the rest is where sand can pile */
const SKY_FRACTION = 0.66;

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
    /** where the body sits, in fractions of the frame */
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
        bodyY: 0.16,
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
        bodyY: 0.44,
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
        bodyY: 0.14,
        starAlpha: 1,
        sun: 0.26,
        ambient: [0.62, 0.66, 0.86],
    },
];

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

const mix3 = (a: RGB, b: RGB, t: number): RGB => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
];

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
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lookRef = useRef(0);
    const toolRef = useRef<number>(RASP);
    const [lookIdx, setLookIdx] = useState(0);
    const [tool, setTool] = useState<number>(RASP);
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
        const wrap = wrapRef.current;
        const canvas = canvasRef.current;
        if (!wrap || !canvas) return;
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
        let skyRows = 0;
        let image = new ImageData(1, 1);
        let buf = new Uint32Array(image.data.buffer);
        let engine = new SandEngine(1, 1);
        /** cloud density per sky cell, recomputed every other frame */
        let cloud = new Float32Array(1);
        /** lowest raining row per column, -1 for clear sky */
        let base = new Int16Array(1);
        let stars: Array<{ x: number; y: number; base: number; phase: number }> = [];

        /** sand grain colours as raw rgb, before the look's ambient tint */
        const sandRGB: Record<number, Array<RGB>> = {};
        for (const m of [WALL, RASP, AMBER, WATER]) {
            sandRGB[m] = PALETTES.light[m].map((css) => resolve(swatchCtx, css));
        }
        // bedrock is the engine's wall material, but the front page's near-black ink
        // reads as a solid ui bar across a frame this size, so it gets slate instead
        sandRGB[WALL] = [
            "oklch(0.42 0.022 357)",
            "oklch(0.38 0.02 357)",
            "oklch(0.45 0.024 357)",
            "oklch(0.35 0.018 357)",
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
        let humidity = 1;
        let frame = 0;
        let drift = 0;
        let wind = 0.12;
        let flash = 0;
        let bolt: Array<number> = [];
        let raf = 0;
        let running = true;

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

        const terrain = () => {
            engine.cells.fill(EMPTY);
            // bedrock is a rolling fbm floor rather than a flat slab with posts on it,
            // so the basins that hold water are part of the landscape's shape
            for (let x = 0; x < cols; x++) {
                const rock = Math.floor(
                    rows * 0.87 + fbm(x * 0.014, 4.2, 3) * rows * 0.16 - rows * 0.04,
                );
                for (let y = Math.max(0, rock); y < rows; y++) engine.set(x, y, WALL);
                // dunes ride on the rock, thin over the ridges and deep in the hollows
                const dune = Math.floor(fbm(x * 0.031, 11.5, 3) * rows * 0.22);
                for (let y = Math.max(0, rock - dune); y < rock; y++) {
                    engine.set(x, y, Math.random() < 0.14 ? AMBER : RASP);
                }
            }
            waterCount = 0;
            humidity = 1;
        };

        const build = () => {
            const rect = wrap.getBoundingClientRect();
            cols = Math.max(60, Math.floor((rect.width * dpr) / grain));
            rows = Math.max(50, Math.floor((rect.height * dpr) / grain));
            skyRows = Math.floor(rows * SKY_FRACTION);
            canvas.width = cols * grain;
            canvas.height = rows * grain;
            src.width = cols;
            src.height = rows;
            image = new ImageData(cols, rows);
            buf = new Uint32Array(image.data.buffer);
            engine = new SandEngine(cols, rows);
            cloud = new Float32Array(cols * skyRows);
            base = new Int16Array(cols);
            capacity = Math.max(600, Math.floor(cols * rows * 0.06));
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

        /**
         * the cloud deck. fbm over a slowly advected lattice, masked to a band so
         * clouds sit in the sky rather than smearing to the horizon, then biased by
         * humidity: the wetter the ground has made the air, the more of the field
         * clears the threshold and becomes cloud.
         */
        const stepClouds = () => {
            const bias = -0.54 + humidity * 0.36;
            for (let x = 0; x < cols; x++) base[x] = -1;
            for (let y = 0; y < skyRows; y++) {
                // clouds live in a band: thin at the very top, gone near the horizon
                const t = y / skyRows;
                const band = Math.max(0, Math.min(1, (t - 0.04) * 5)) * Math.max(0, Math.min(1, (0.82 - t) * 3.4));
                const row = y * cols;
                if (band <= 0) {
                    for (let x = 0; x < cols; x++) cloud[row + x] = -1;
                    continue;
                }
                for (let x = 0; x < cols; x++) {
                    const n = fbm(x * 0.045 + drift, y * 0.1 + 3.3, 3);
                    const d = n * band + bias;
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
            if (humidity <= 0.08) return;
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
                if (Math.random() > (0.55 + d * 1.6) * humidity * humidity) continue;
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
                    if (m === WATER && Math.random() < 0.03 * strength) {
                        cells[i] = EMPTY;
                        waterCount--;
                    }
                    break;
                }
            }
        };

        /**
         * extra lateral passes for water that has landed. the shared engine gives a
         * drop one sideways step per frame, which is enough for the hero's occasional
         * splash but not for a lake fed by continuous rain: without this the pool
         * piles into a heap instead of finding its level.
         */
        const relax = (passes: number) => {
            const { cells, tint } = engine;
            for (let p = 0; p < passes; p++) {
                const ltr = ((frame + p) & 1) === 0;
                for (let y = rows - 2; y >= 0; y--) {
                    const row = y * cols;
                    for (let xi = 0; xi < cols; xi++) {
                        const x = ltr ? xi : cols - 1 - xi;
                        const i = row + x;
                        if (cells[i] !== WATER) continue;
                        if (cells[i + cols] === EMPTY) continue; // still falling
                        const dir = Math.random() < 0.5 ? -1 : 1;
                        for (const d of [dir, -dir]) {
                            const nx = x + d;
                            if (nx < 0 || nx >= cols) continue;
                            if (cells[row + nx] !== EMPTY) continue;
                            cells[row + nx] = WATER;
                            tint[row + nx] = tint[i];
                            cells[i] = EMPTY;
                            break;
                        }
                    }
                }
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

            // sky, quantised into bands. a smooth vertical ramp would be a gradient;
            // stepping it keeps the sky the same material as everything else here
            const BANDS = 14;
            const skyPacked = new Array<number>(BANDS);
            for (let b = 0; b < BANDS; b++) {
                const c = mix3(cur.skyTop, cur.skyLow, b / (BANDS - 1));
                skyPacked[b] = pack(
                    clamp255(c[0] + 255 * lift),
                    clamp255(c[1] + 255 * lift),
                    clamp255(c[2] + 255 * lift),
                );
            }
            for (let y = 0; y < rows; y++) {
                const f = (y / rows) * (BANDS - 1);
                const b0 = Math.floor(f);
                const frac = f - b0;
                const row = y * cols;
                const lo = skyPacked[b0];
                const hi = skyPacked[Math.min(BANDS - 1, b0 + 1)];
                const bayerRow = (y & 3) * 4;
                for (let x = 0; x < cols; x++) {
                    // stipple the boundary between two bands instead of stepping it.
                    // the ramp stays a ramp, but every cell is still one of ten colours
                    buf[row + x] = frac > (BAYER[bayerRow + (x & 3)] + 0.5) / 16 ? hi : lo;
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
            const bx = Math.floor(cols * cur.bodyX);
            const by = Math.floor(rows * cur.bodyY);
            const R = Math.max(5, Math.floor(cols * 0.028));
            const lit = pack(clamp255(cur.bodyLit[0]), clamp255(cur.bodyLit[1]), clamp255(cur.bodyLit[2]));
            const dim = pack(clamp255(cur.bodyDim[0]), clamp255(cur.bodyDim[1]), clamp255(cur.bodyDim[2]));
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
            // field into pixel art: everything between two of them is one flat colour
            const litP = pack(clamp255(cur.cloudLit[0] + 255 * lift), clamp255(cur.cloudLit[1] + 255 * lift), clamp255(cur.cloudLit[2] + 255 * lift));
            const midP = pack(clamp255(cur.cloudMid[0] + 255 * lift), clamp255(cur.cloudMid[1] + 255 * lift), clamp255(cur.cloudMid[2] + 255 * lift));
            const lowP = pack(clamp255(cur.cloudLow[0] + 255 * lift), clamp255(cur.cloudLow[1] + 255 * lift), clamp255(cur.cloudLow[2] + 255 * lift));
            for (let y = 0; y < skyRows; y++) {
                const row = y * cols;
                for (let x = 0; x < cols; x++) {
                    const d = cloud[row + x];
                    if (d < 0.012) continue;
                    // lit crown near the top of each mass, shadow under it
                    const above = y > 0 ? cloud[row - cols + x] : -1;
                    buf[row + x] = d > 0.1 ? (above < 0.012 ? litP : midP) : lowP;
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
            for (let i = 0; i < cells.length; i++) {
                const m = cells[i];
                if (m === EMPTY) continue;
                const shades = sandPacked[m];
                if (shades) buf[i] = shades[tint[i] & 3];
            }

            srcCtx.putImageData(image, 0, 0);
            view.imageSmoothingEnabled = false;
            view.clearRect(0, 0, canvas.width, canvas.height);
            view.drawImage(src, 0, 0, canvas.width, canvas.height);
        };

        /* ----------------------------------------------------------- loop */

        let hudAt = 0;
        const loop = () => {
            if (!running) return;
            frame++;
            easeLook(LOOKS[lookRef.current], 0.035);

            // wind wanders on its own so the deck never drifts at a constant rate
            wind = 0.1 + 0.09 * Math.sin(frame * 0.0018) + 0.04 * Math.sin(frame * 0.0071);
            drift += wind * 0.0035;

            // recount now and then: the pointer can add or erase water behind the
            // budget's back, and a drifting count would slowly break the cycle
            if (frame % 90 === 0) {
                let n = 0;
                for (let i = 0; i < engine.cells.length; i++) if (engine.cells[i] === WATER) n++;
                waterCount = n;
            }
            humidity = Math.max(0, Math.min(1, (capacity - waterCount) / capacity));

            if ((frame & 1) === 0) stepClouds();
            rain();
            blow();
            engine.step();
            relax(6);
            evaporate();

            if (flash > 0) flash--;
            else if (cur.starAlpha > 0.35 && humidity > 0.38 && Math.random() < 0.007) strike();

            render();

            if (frame - hudAt > 20) {
                hudAt = frame;
                let covered = 0;
                for (let i = 0; i < cloud.length; i++) if (cloud[i] > 0.012) covered++;
                setHud({ humidity, cover: covered / cloud.length, drops: waterCount });
            }

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
            painting = true;
            canvas.setPointerCapture(e.pointerId);
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
            humidity = 1;
        };

        canvas.addEventListener("pointerdown", down);
        canvas.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        ro.observe(wrap);

        if (reduced) {
            // one settled frame, no cycle: the page still shows a sky and a shore
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
            canvas.removeEventListener("pointerdown", down);
            canvas.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
        };
    }, []);

    return (
        <main className="wx">
            <div className="wx-stage" ref={wrapRef}>
                <canvas ref={canvasRef} className="wx-canvas" aria-hidden="true" />

                <div className="wx-words">
                    <p className="wx-crumb">
                        <Link to="/lab">← the lab</Link>
                    </p>
                    <h1>weather</h1>
                    <p className="wx-lede">
                        clouds are fractal noise snapped to the sand grid. dense cells rain,
                        rain pools, sun evaporates it back into cloud cover. nothing here is
                        animated. it is one loop feeding itself.
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
                    humidity {(hud.humidity * 100).toFixed(0)}% · cover {(hud.cover * 100).toFixed(0)}% ·{" "}
                    {hud.drops} drops
                </p>
            </div>
        </main>
    );
}
