import { describe, expect, it } from "vitest";
import { clamp255, mix3, pack, packRGB } from "./pixel";
import type { Page, RGB } from "./pixel";
import {
    BED,
    SEAM,
    SKY_BANDS,
    SKY_FADE,
    flashLift,
    rockLiftAt,
    rockRows,
    seamTones,
    skyBandAt,
    skyRamp,
} from "./rasterize";
import type { LookColors } from "./rasterize";

/** the front page's ground: a near-white bg and a half step off it */
const PAGE: Page = { abyss: [250, 249, 247], ground: [[250, 249, 247], [236, 234, 230]] };

/** noon's slate, resolved from the four oklch shades the hero uses */
const SLATE: RGB[] = [
    [98, 94, 96],
    [90, 87, 88],
    [106, 101, 103],
    [83, 80, 81],
];

const LOOK: LookColors = {
    skyTop: [96, 142, 209],
    skyLow: [186, 214, 240],
    cloudLit: [255, 253, 248],
    cloudMid: [226, 232, 243],
    cloudLow: [183, 196, 218],
    bodyLit: [255, 214, 92],
    bodyDim: [255, 232, 150],
    crescent: 0,
    starAlpha: 0,
    ambient: [1, 1, 1],
    rockLift: 0.45,
};

const WHITE: RGB = [1, 1, 1];
const unpack = (v: number): [number, number, number] => [v & 255, (v >> 8) & 255, (v >> 16) & 255];
/** how far apart two packed greys are, summed over the channels */
const spread = (a: number, b: number): number => {
    const [ar, ag, ab] = unpack(a);
    const [br, bg, bb] = unpack(b);
    return Math.abs(ar - br) + Math.abs(ag - bg) + Math.abs(ab - bb);
};

describe("packed colour", () => {
    it("packs rgb into the little-endian word an ImageData view reads back", () => {
        const v = pack(10, 20, 30);
        expect(unpack(v)).toEqual([10, 20, 30]);
        // alpha is always opaque, and the word never comes back signed
        expect(v >>> 24).toBe(255);
        expect(pack(255, 255, 255)).toBeGreaterThan(0);
    });

    it("clamps and floors on the way in", () => {
        expect(clamp255(-3)).toBe(0);
        expect(clamp255(300)).toBe(255);
        expect(clamp255(12.9)).toBe(12);
    });

    it("lifts a colour toward white by a fraction of full scale", () => {
        expect(unpack(packRGB([10, 20, 30]))).toEqual([10, 20, 30]);
        expect(unpack(packRGB([10, 20, 30], 0.2))).toEqual([61, 71, 81]);
        // a big lift saturates rather than wrapping
        expect(unpack(packRGB([200, 200, 200], 0.5))).toEqual([255, 255, 255]);
    });

    it("mixes linearly and keeps both ends exact", () => {
        expect(mix3([0, 0, 0], [100, 200, 40], 0)).toEqual([0, 0, 0]);
        expect(mix3([0, 0, 0], [100, 200, 40], 1)).toEqual([100, 200, 40]);
        expect(mix3([0, 0, 0], [100, 200, 40], 0.5)).toEqual([50, 100, 20]);
    });
});

describe("sky quantisation", () => {
    it("steps from zenith to horizon and then fades to the page", () => {
        const ramp = skyRamp(LOOK, PAGE, 0);
        expect(ramp).toHaveLength(SKY_BANDS + SKY_FADE);
        expect(unpack(ramp[0])).toEqual([96, 142, 209]);
        expect(unpack(ramp[SKY_BANDS - 1])).toEqual([186, 214, 240]);
        // the last fade step is the page itself: under the island there is no sky
        expect(unpack(ramp[SKY_BANDS + SKY_FADE - 1])).toEqual([250, 249, 247]);
    });

    it("never repeats a band, so every step is visible", () => {
        const ramp = skyRamp(LOOK, PAGE, 0);
        expect(new Set(ramp).size).toBe(ramp.length);
    });

    it("places rows on the ramp: sky over the crest, fade under it, page below", () => {
        const crest = 76;
        const hero = 100;
        expect(skyBandAt(0, crest, hero)).toBe(0);
        expect(skyBandAt(crest, crest, hero)).toBeCloseTo(SKY_BANDS - 1);
        expect(skyBandAt(hero - 1, crest, hero)).toBeLessThan(SKY_BANDS + SKY_FADE - 1);
        expect(skyBandAt(hero, crest, hero)).toBe(SKY_BANDS + SKY_FADE - 1);
        expect(skyBandAt(hero + 40, crest, hero)).toBe(SKY_BANDS + SKY_FADE - 1);
        // monotonic all the way down: no row is lighter than the one above it
        for (let y = 1; y <= hero; y++) {
            expect(skyBandAt(y, crest, hero)).toBeGreaterThanOrEqual(skyBandAt(y - 1, crest, hero));
        }
    });

    it("survives a crest at the very top of the band", () => {
        expect(skyBandAt(5, 0, 100)).toBeGreaterThan(SKY_BANDS - 1);
        expect(Number.isFinite(skyBandAt(5, 0, 0))).toBe(true);
    });
});

describe("rock lift ramp", () => {
    const crest = 76;
    const hero = 100;

    it("is off at the crest and full by the top of the seam", () => {
        expect(rockLiftAt(crest, crest, hero, 0.45)).toBe(0);
        expect(rockLiftAt(crest - 5, crest, hero, 0.45)).toBe(0);
        expect(rockLiftAt(hero - SEAM, crest, hero, 0.45)).toBeCloseTo(0.45);
        expect(rockLiftAt(hero, crest, hero, 0.45)).toBeCloseTo(0.45);
    });

    it("climbs without ever stepping back", () => {
        let prev = -1;
        for (let y = crest; y <= hero; y++) {
            const l = rockLiftAt(y, crest, hero, 0.45);
            expect(l).toBeGreaterThanOrEqual(prev);
            prev = l;
        }
    });

    it("stays flat at zero for the looks that do not lift at all", () => {
        for (let y = crest; y <= hero; y++) expect(rockLiftAt(y, crest, hero, 0)).toBe(0);
    });

    it("does not divide by zero when the seam eats the whole keel", () => {
        expect(Number.isFinite(rockLiftAt(90, 95, 100, 0.45))).toBe(true);
    });

    it("keeps the bedding pair legible at the crest and gives it up at the seam", () => {
        const rows = rockRows(SLATE, PAGE, WHITE, 0, 0.45, crest, hero);
        expect(rows).toHaveLength(hero - SEAM - crest + 1);
        const top = spread(rows[0][BED[0]], rows[0][BED[1]]);
        const bottom = spread(rows[rows.length - 1][BED[0]], rows[rows.length - 1][BED[1]]);
        // full slate at the crest, compressed by the lift at the seam
        expect(top).toBeGreaterThan(bottom);
        expect(Math.abs(bottom - top * (1 - 0.45))).toBeLessThanOrEqual(3);
        // and the extreme pair beats the pair the stripes used to take
        expect(top).toBeGreaterThan(spread(rows[0][0], rows[0][1]));
    });

    it("pulls every shade toward the page as it goes down", () => {
        const rows = rockRows(SLATE, PAGE, WHITE, 0, 0.45, crest, hero);
        for (let i = 0; i < 4; i++) {
            const [r] = unpack(rows[0][i]);
            const [rDeep] = unpack(rows[rows.length - 1][i]);
            expect(rDeep).toBeGreaterThan(r);
        }
        // with no lift in the look, the keel is one colour top to bottom
        const flat = rockRows(SLATE, PAGE, WHITE, 0, 0, crest, hero);
        expect(flat[0]).toEqual(flat[flat.length - 1]);
        expect(unpack(flat[0][0])).toEqual([98, 94, 96]);
    });
});

describe("seam dither", () => {
    it("runs the rock down to the page over exactly the seam's rows", () => {
        const { rock, page } = seamTones(SLATE, PAGE, WHITE, 0, 0.45);
        expect(rock).toHaveLength(SEAM);
        expect(page).toHaveLength(SEAM);
        // the last row is the ground itself: nothing left to hand over
        expect(unpack(rock[SEAM - 1][0])).toEqual(unpack(packRGB(PAGE.ground[0])));
        expect(unpack(rock[SEAM - 1][1])).toEqual(unpack(packRGB(PAGE.ground[1])));
    });

    it("keeps the checker quiet: the two tones close in, never apart", () => {
        const { rock, page } = seamTones(SLATE, PAGE, WHITE, 0, 0.45);
        // the step between them is fixed while there is room for it, then closes;
        // it never widens, so the checker cannot get louder further down
        const first = spread(rock[0][0], page[0][0]);
        for (let r = 0; r < SEAM; r++) {
            expect(spread(rock[r][0], page[r][0])).toBeLessThanOrEqual(first + 3);
        }
        expect(spread(rock[SEAM - 2][0], page[SEAM - 2][0])).toBeLessThan(first);
        expect(spread(rock[SEAM - 1][0], page[SEAM - 1][0])).toBe(0);
    });

    it("runs the page cells a step ahead of the rock cells", () => {
        const { rock, page } = seamTones(SLATE, PAGE, WHITE, 0, 0.45);
        for (let r = 0; r < SEAM - 1; r++) {
            // ahead means lighter here, because the page under the island is pale
            expect(unpack(page[r][0])[0]).toBeGreaterThan(unpack(rock[r][0])[0]);
        }
    });

    it("carries the same bedding pair the keel above it uses", () => {
        const { rock } = seamTones(SLATE, PAGE, WHITE, 0, 0);
        // b=0 is the light shade, b=1 the dark one, so the strata do not invert
        expect(unpack(rock[0][0])[0]).toBeGreaterThan(unpack(rock[0][1])[0]);
        expect(unpack(rock[0][0])).toEqual(unpack(packRGB(SLATE[BED[0]])));
    });
});

describe("flash", () => {
    it("decays on a square curve and is nothing once the bolt is spent", () => {
        expect(flashLift(0, 12)).toBe(0);
        expect(flashLift(12, 12)).toBeCloseTo(0.3);
        expect(flashLift(6, 12)).toBeCloseTo(0.075);
        expect(flashLift(12, 12)).toBeGreaterThan(2 * flashLift(6, 12));
    });
});
