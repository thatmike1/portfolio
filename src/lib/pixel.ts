/**
 * the small vocabulary every pixel in the weather hero is written in: colours as
 * plain rgb triples, one 32-bit pack step at the very end, and the two bits of
 * cheap noise that keep a hard-quantised frame from banding.
 *
 * nothing here knows what a hero is. it is shared by the rasterizer and by the
 * simulation's own noise, which is why it lives on its own.
 */

/** a colour on the way to the buffer: unclamped, so it can be scaled and mixed */
export type RGB = [number, number, number];

/**
 * the page under the island. it does not change with the weather, because it is
 * the page: the same dark ground the front page's copy sits on. the abyss is what
 * shows through the shafts once the sky has faded out below the crest, and the
 * two ground tones are what the keel dithers into under the copy.
 */
export type Page = { abyss: RGB; ground: [RGB, RGB] };

/** rgb to the little-endian abgr word an ImageData's Uint32 view wants */
export const pack = (r: number, g: number, b: number): number =>
    (((255 << 24) | (b << 16) | (g << 8) | r) >>> 0) as number;

export const clamp255 = (n: number): number => (n < 0 ? 0 : n > 255 ? 255 : n | 0);

/** pack a triple, optionally raised toward white by `lift` (the lightning flash) */
export const packRGB = (c: RGB, lift = 0): number =>
    pack(clamp255(c[0] + 255 * lift), clamp255(c[1] + 255 * lift), clamp255(c[2] + 255 * lift));

/** linear blend, `t` of `b` into `a`. not clamped: callers pass a valid t */
export const mix3 = (a: RGB, b: RGB, t: number): RGB => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
];

/** smoothstep, clamped at both ends */
export const smooth = (t: number): number => {
    const c = t < 0 ? 0 : t > 1 ? 1 : t;
    return c * c * (3 - 2 * c);
};

/** integer hash, ~0..1. cheaper than the sin-fract trick and it tiles no worse */
export function hash2(x: number, y: number): number {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** 4x4 ordered dither. band edges in the sky get stippled instead of stepping hard */
export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
