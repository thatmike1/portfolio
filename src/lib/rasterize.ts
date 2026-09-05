/**
 * the weather hero's rasterizer: one frame of sky, weather, island and wildlife
 * written into a Uint32Array, back to front.
 *
 * it is the whole picture and none of the state. everything it needs arrives in
 * one params object — the engine's cells, the eased look, the page's own tokens,
 * the creatures — and the only thing it touches is `buf`. that is what makes the
 * quantisation choices here (sky bands, the seam's dither ramp, the keel's
 * bedding) testable without a canvas, a dom or a clock.
 *
 * order matters and is the same order a painter would use: sky, stars, the body,
 * the cloud deck, the bolt, then the simulation over all of it, then the things
 * that live in front of the grid.
 */
import {
    AMBER,
    EMPTY,
    GLASS,
    ICE,
    INK,
    MATERIAL,
    MOSS,
    RASP,
    SEED,
    SNOW,
    WALL,
    WATER,
} from "./sand-engine";
import { BAYER, clamp255, hash2, mix3, pack, packRGB, smooth } from "./pixel";
import type { Page, RGB } from "./pixel";
import { birdCells } from "./flock";
import type { Bird } from "./flock";
import { glow as flyGlow } from "./fireflies";
import type { Firefly } from "./fireflies";
import type { Flake } from "./frost";
import { snailCells } from "./snail";
import type { Snail } from "./snail";
import { fishCells } from "./fish";
import type { Fish } from "./fish";
import { frogCells } from "./frog";
import type { Frog } from "./frog";

/**
 * the seam, where the keel dissolves into the page at the bottom of the band,
 * is a share of the keel rather than a count of rows. a fixed twelve rows was
 * half of a desktop keel and three quarters of a phone's: on a 390px screen
 * the crest sat at row 47 and the band ended at 63, so of sixteen rows of rock
 * twelve were dither, and rock dissolving into the page read instead as the
 * grey and white checker an image editor draws for transparency. the share
 * keeps a desktop at the twelve it had and gives a phone about seven
 */
export const SEAM_SHARE = 0.45;
export const SEAM_MIN = 4;
export const SEAM_MAX = 12;

/** how many rows of seam a keel this tall gets */
export function seamRows(crestRow: number, heroRows: number): number {
    const keel = Math.max(0, heroRows - crestRow);
    return Math.max(SEAM_MIN, Math.min(SEAM_MAX, Math.round(keel * SEAM_SHARE)));
}
/** how the vertical sky ramp is quantised: bands over the sky, then a fade to the page */
export const SKY_BANDS = 14;
export const SKY_FADE = 7;
/**
 * the two slate shades the keel's bedding stripes alternate between: the
 * lightest and the darkest of the four, not the two nearest. the lift that
 * keeps the rock off the page compresses the gap between any pair, so the
 * strata only survive it if they start from the widest one
 */
export const BED: [number, number] = [2, 3];

/** every material the rasterizer has a palette for */
const MATERIALS = [WALL, RASP, AMBER, INK, WATER, GLASS, SEED, MOSS, SNOW, ICE];

/** the eased colours of the current time of day. the rest of a Look is chrome */
export type LookColors = {
    skyTop: RGB;
    skyLow: RGB;
    cloudLit: RGB;
    cloudMid: RGB;
    cloudLow: RGB;
    bodyLit: RGB;
    bodyDim: RGB;
    /** 0 = sun disc, 1 = crescent moon */
    crescent: number;
    starAlpha: number;
    /** multiplied into every sand grain so the ground sits in the same light */
    ambient: RGB;
    /** how far the island's rock is pulled toward the page colour at the seam */
    rockLift: number;
};

/** the sun or moon in cells, and how wide a zone it burns through */
export type Body = { bx: number; by: number; R: number; clear: number };

export type Star = { x: number; y: number; base: number; phase: number };

export type RasterizeParams = {
    /** the frame, as an abgr word per cell. the only thing written */
    buf: Uint32Array;
    cols: number;
    rows: number;
    /** rows in the hero band; everything below is the copy block */
    heroRows: number;
    skyRows: number;
    /** the crest row at the lake's edge */
    crestRow: number;
    look: LookColors;
    page: Page;
    /** the resolved rgb of every material's four shades */
    sandRGB: Record<number, RGB[]>;
    /** the lit top of the water: one row of it turns a blue mass into a surface */
    waterTop: RGB;
    /** frames left in the lightning flash, and how long a full one lasts */
    flash: number;
    flashFrames: number;
    /** frames since the hero started; only the stars twinkle off it */
    frame: number;
    cells: Uint8Array;
    tint: Uint8Array;
    /** cloud density per sky cell, and how much the body is burning through */
    cloud: Float32Array;
    glow: Float32Array;
    stars: Star[];
    body: Body;
    /** buffer indices the current bolt runs through */
    bolt: number[];
    flakes: Flake[];
    birds: Bird[];
    fishes: Fish[];
    frog: Frog | null;
    snail: Snail | null;
    flies: Firefly[];
};

/**
 * how far the rock in row `y` is pulled toward the page.
 *
 * slate on a white page is a hard edge and its dithered seam into the page a
 * loud checkerboard, which is what the lift is for. but the lift pulls all four
 * slate shades toward one colour, so a constant lift costs the keel its strata:
 * at noon it flattened the whole island into one grey. so it ramps with depth
 * instead. none of it at the crest, where the keel still stands against sky and
 * the shades can be as far apart as they like, all of it by the top of the seam,
 * where the rock has to hand over to the page.
 */
export function rockLiftAt(y: number, crestRow: number, heroRows: number, rockLift: number): number {
    const span = Math.max(1, heroRows - seamRows(crestRow, heroRows) - crestRow);
    return rockLift * smooth((y - crestRow) / span);
}

/**
 * the keel's four shades packed once per row of the lift ramp. index it with
 * `y - crestRow`, clamped into 0..span: above the crest it is the unlifted
 * table, below the ramp every row is the fully lifted one
 */
export function rockRows(
    slate: RGB[],
    page: Page,
    amb: RGB,
    lift: number,
    rockLift: number,
    crestRow: number,
    heroRows: number,
): number[][] {
    const span = Math.max(1, heroRows - seamRows(crestRow, heroRows) - crestRow);
    const rows: number[][] = [];
    for (let r = 0; r <= span; r++) {
        const l = rockLiftAt(crestRow + r, crestRow, heroRows, rockLift);
        rows.push(
            slate.map((s) => {
                const c = mix3(s, page.abyss, l);
                return pack(
                    clamp255(c[0] * amb[0] + 255 * lift),
                    clamp255(c[1] * amb[1] + 255 * lift),
                    clamp255(c[2] * amb[2] + 255 * lift),
                );
            }),
        );
    }
    return rows;
}

/**
 * the seam dithers rock cells into the page, and a dither is only quiet when its
 * two tones are close. so both tones sink toward the page row by row down the
 * seam, the "page" cells running a step ahead of the rock: the checker never
 * spans more than that step, and the last row hands over to the ground with
 * nothing left to see. both tones carry the bedding pair, so the strata do not
 * stop dead where the seam starts
 */
export function seamTones(
    slate: RGB[],
    page: Page,
    amb: RGB,
    lift: number,
    rockLift: number,
    seam: number,
): { rock: number[][]; page: number[][] } {
    const rock: number[][] = [];
    const paged: number[][] = [];
    for (let r = 0; r < seam; r++) {
        const sink = r / (seam - 1);
        const rockRow: number[] = [];
        const pageRow: number[] = [];
        for (let b = 0; b < 2; b++) {
            const slab = mix3(slate[BED[b]], page.abyss, rockLift);
            const litSlab: RGB = [slab[0] * amb[0], slab[1] * amb[1], slab[2] * amb[2]];
            rockRow.push(packRGB(mix3(litSlab, page.ground[b], sink), lift));
            pageRow.push(packRGB(mix3(litSlab, page.ground[b], Math.min(1, sink + 0.4)), lift));
        }
        rock.push(rockRow);
        paged.push(pageRow);
    }
    return { rock, page: paged };
}

/**
 * the sky, quantised into bands. a smooth vertical ramp would be a gradient;
 * stepping it keeps the sky the same material as everything else here. it runs
 * top to horizon over the sky, then fades to the abyss under the crest: below
 * the island there is no sky, there is the page
 */
export function skyRamp(look: LookColors, page: Page, lift: number): number[] {
    const packed = new Array<number>(SKY_BANDS + SKY_FADE);
    for (let b = 0; b < SKY_BANDS; b++) {
        packed[b] = packRGB(mix3(look.skyTop, look.skyLow, b / (SKY_BANDS - 1)), lift);
    }
    for (let b = 0; b < SKY_FADE; b++) {
        packed[SKY_BANDS + b] = packRGB(mix3(look.skyLow, page.abyss, (b + 1) / SKY_FADE), lift);
    }
    return packed;
}

/** where row `y` lands in the ramp, as a fractional index the dither steps across */
export function skyBandAt(y: number, crestRow: number, heroRows: number): number {
    if (y < crestRow) return (y / crestRow) * (SKY_BANDS - 1);
    if (y < heroRows) {
        const fadeRows = Math.max(1, heroRows - crestRow);
        return SKY_BANDS - 1 + ((y - crestRow) / fadeRows) * SKY_FADE;
    }
    return SKY_BANDS + SKY_FADE - 1;
}

/** how far toward white the lightning flash lifts the whole frame this frame */
export function flashLift(flash: number, flashFrames: number): number {
    // the flash decays fast and never gets near white: a bolt should read as a
    // pop of light on the deck, not a blown-out frame
    const t = flash / flashFrames;
    return flash > 0 ? 0.3 * t * t : 0;
}

/** draw one frame into `buf`. nothing else is touched */
export function rasterize(p: RasterizeParams): void {
    const {
        buf,
        cols,
        rows,
        heroRows,
        skyRows,
        crestRow,
        look,
        page,
        sandRGB,
        cells,
        tint,
        cloud,
        glow,
        stars,
        bolt,
        flakes,
        flies,
    } = p;
    const amb = look.ambient;
    const lift = flashLift(p.flash, p.flashFrames);

    const topP = pack(
        clamp255(p.waterTop[0] * amb[0] + 255 * lift),
        clamp255(p.waterTop[1] * amb[1] + 255 * lift),
        clamp255(p.waterTop[2] * amb[2] + 255 * lift),
    );
    const sandPacked: Record<number, number[]> = {};
    for (const m of MATERIALS) {
        const shades = sandRGB[m];
        const packed: number[] = [];
        for (let i = 0; i < shades.length; i++) {
            const c = m === WALL ? mix3(shades[i], page.abyss, look.rockLift) : shades[i];
            packed.push(
                pack(
                    clamp255(c[0] * amb[0] + 255 * lift),
                    clamp255(c[1] * amb[1] + 255 * lift),
                    clamp255(c[2] * amb[2] + 255 * lift),
                ),
            );
        }
        sandPacked[m] = packed;
    }
    const groundP = [packRGB(page.ground[0], lift), packRGB(page.ground[1], lift)];
    const abyssP = packRGB(page.abyss, lift);
    const seamN = seamRows(crestRow, heroRows);
    const seam2 = seamTones(sandRGB[WALL], page, amb, lift, look.rockLift, seamN);
    const rock = rockRows(sandRGB[WALL], page, amb, lift, look.rockLift, crestRow, heroRows);
    const rockSpan = rock.length - 1;

    const skyPacked = skyRamp(look, page, lift);
    const last = SKY_BANDS + SKY_FADE - 1;
    const { bx, by, R, clear } = p.body;
    const haloR = clear * 1.25;
    const haloR2 = haloR * haloR;
    for (let y = 0; y < rows; y++) {
        const f = skyBandAt(y, crestRow, heroRows);
        const b0 = Math.floor(f);
        const frac = f - b0;
        const row = y * cols;
        const lo = skyPacked[Math.min(last, b0)];
        const hi = skyPacked[Math.min(last, b0 + 1)];
        const bayerRow = (y & 3) * 4;
        const dy = y - by;
        // the halo is this row's own sky colour warmed toward the body, so it
        // lightens a pale horizon and a dark zenith alike, and it is clipped
        // by nothing but the crest
        const haloRow = y < crestRow && dy * dy < haloR2;
        const haloP = haloRow
            ? packRGB(
                  mix3(
                      mix3(look.skyTop, look.skyLow, Math.min(1, f / (SKY_BANDS - 1))),
                      look.bodyDim,
                      0.3,
                  ),
                  lift,
              )
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
    if (look.starAlpha > 0.02) {
        for (const s of stars) {
            const tw = 0.55 + 0.45 * Math.sin(p.frame * 0.05 + s.phase);
            const a = s.base * tw * look.starAlpha;
            if (a < 0.06) continue;
            const c = mix3(look.skyTop, [255, 255, 255], Math.min(1, a));
            buf[s.y * cols + s.x] = pack(clamp255(c[0]), clamp255(c[1]), clamp255(c[2]));
        }
    }

    // the celestial body: one disc, occluded by a second disc when the look
    // is a moon. the same nine cells of crater detail either way
    const litBody = packRGB(look.bodyLit);
    const dimBody = packRGB(look.bodyDim);
    for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
            if (dx * dx + dy * dy > R * R) continue;
            const x = bx + dx;
            const y = by + dy;
            if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
            // the crescent's dark limb: a second disc offset up and right
            if (look.crescent > 0.5) {
                const ox = dx - R * 0.52;
                const oy = dy + R * 0.2;
                if (ox * ox + oy * oy < R * R) continue;
            }
            const crater = hash2(dx * 7 + 31, dy * 13 + 5) < 0.12;
            buf[y * cols + x] = crater ? dimBody : litBody;
        }
    }
    if (look.crescent < 0.5) {
        // sun rays: eight ticks, two cells clear of the disc
        for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2;
            for (let r = R + 2; r <= R + 3; r++) {
                const x = bx + Math.round(Math.cos(a) * r);
                const y = by + Math.round(Math.sin(a) * r);
                if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
                buf[y * cols + x] = dimBody;
            }
        }
    }

    // cloud deck, three tones. the thresholds are what turn a smooth noise
    // field into pixel art: everything between two of them is one flat colour.
    // near the body the surviving cloud takes the body's colour instead: lit
    // from behind, burning off, not cut away
    const litP = packRGB(look.cloudLit, lift);
    const midP = packRGB(look.cloudMid, lift);
    const lowP = packRGB(look.cloudLow, lift);
    const glowLitP = packRGB(mix3(look.cloudLit, look.bodyLit, 0.55), lift);
    const glowMidP = packRGB(mix3(look.cloudMid, look.bodyLit, 0.45), lift);
    const glowLowP = packRGB(mix3(look.cloudLow, look.bodyLit, 0.4), lift);
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
    if (p.flash > 0) {
        const white = pack(255, 255, 255);
        for (const i of bolt) if (i >= 0 && i < buf.length) buf[i] = white;
    }

    // the simulation last, so grains occlude everything
    for (let y = 0; y < rows; y++) {
        const row = y * cols;
        // rock takes its shade from the row rather than the grain, so the keel
        // reads as bedded strata instead of a wall of static
        const band = ((y / 7) | 0) & 1;
        // the keel turns into the page over the last few rows of the hero band:
        // dithered, so the seam is a texture change and not a line
        const seamRow = y - (heroRows - seamN);
        const seam = y >= heroRows ? 1 : seamRow >= 0 ? (seamRow + 1) / (seamN + 1) : 0;
        const bayerRow = (y & 3) * 4;
        const deep = y - crestRow;
        const rockRow = rock[deep < 0 ? 0 : deep > rockSpan ? rockSpan : deep];
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
                const onPage = seam > 0 && seam > (BAYER[bayerRow + (x & 3)] + 0.5) / 16;
                // a quarter of rock cells opt out of their band, which keeps the
                // bedding legible without turning the keel into a barcode
                const bedded = hash2(x, y) > 0.25;
                buf[i] =
                    seam > 0 && seam < 1
                        ? (onPage ? seam2.page : seam2.rock)[seamRow][bedded ? band : tint[i] & 1]
                        : onPage
                          ? groundP[bedded ? band : 1 - band]
                          : bedded
                            ? rockRow[BED[band]]
                            : rockRow[tint[i] & 3];
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
    for (const b of p.birds) {
        const cx = Math.round(b.x);
        const cy = Math.round(b.y);
        for (const [dx, dy] of birdCells(b)) {
            const x = cx + dx;
            const y = cy + dy;
            if (x < 0 || x >= cols || y < 0 || y >= heroRows) continue;
            buf[y * cols + x] = birdP;
        }
    }

    // fish: orange body and a darker fin, seen through the water so they are
    // a shade under it and full colour only in the air of a leap
    for (const f of p.fishes) {
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
            const cell = cells[i];
            if (cell !== WATER && cell !== EMPTY) continue;
            const under = buf[i];
            const c: RGB =
                part === "body"
                    ? [235 * amb[0], 140 * amb[1], 55 * amb[2]]
                    : [190 * amb[0], 95 * amb[1], 45 * amb[2]];
            const r = (under >>> 0) & 255;
            const g = (under >>> 8) & 255;
            const b = (under >>> 16) & 255;
            buf[i] = packRGB([r + (c[0] - r) * a, g + (c[1] - g) * a, b + (c[2] - b) * a]);
        }
    }

    // the frog: a toad really, rust body and a sandy head so it reads against
    // the moss it sits on, pink tongue, lit like the grains
    const frog = p.frog;
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
            if (part === "tongue" && cells[y * cols + x] !== EMPTY) continue;
            buf[y * cols + x] = part === "body" ? bodyP : part === "head" ? headP : tongueP;
        }
    }

    // the snail: a shell of amber-brown and a pale body, lit like the grains
    const snail = p.snail;
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
    for (const f of flies) {
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
}
