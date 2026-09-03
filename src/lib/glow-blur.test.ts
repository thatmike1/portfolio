import { describe, expect, it } from "vitest";
import { createGlowBlur } from "./glow-blur";

const W = 9;
const H = 9;

function single(r: number, g: number, b: number, a = 255) {
    const src = new Uint8ClampedArray(W * H * 4);
    const p = (4 * W + 4) * 4;
    src[p] = r;
    src[p + 1] = g;
    src[p + 2] = b;
    src[p + 3] = a;
    return src;
}

describe("createGlowBlur", () => {
    it("spreads a single grain into a symmetric halo that keeps its hue", () => {
        const blur = createGlowBlur(W, H, { radius: 2 });
        const dst = new Uint8ClampedArray(W * H * 4);
        blur(single(200, 40, 120), dst);
        const at = (x: number, y: number) => Array.from(dst.subarray((y * W + x) * 4, (y * W + x) * 4 + 4));
        const centre = at(4, 4);
        // colour survives premultiply round trip; only alpha is spread
        expect(centre.slice(0, 3)).toEqual([200, 40, 120]);
        expect(centre[3]).toBeGreaterThan(0);
        expect(centre[3]).toBeLessThan(255);
        expect(at(4, 4)[3]).toBeGreaterThan(at(4, 6)[3]);
        expect(at(4, 6)).toEqual(at(4, 2));
        expect(at(6, 4)).toEqual(at(2, 4));
        // two passes of radius 2 reach 4 cells out and no further
        expect(at(4, 8)[3]).toBeGreaterThan(0);
        expect(at(0, 0)[3]).toBe(0);
    });

    it("conserves total light across the grid", () => {
        const blur = createGlowBlur(W, H, { radius: 1 });
        const dst = new Uint8ClampedArray(W * H * 4);
        blur(single(255, 255, 255), dst);
        let total = 0;
        for (let i = 3; i < dst.length; i += 4) total += dst[i];
        // the halo stays inside the 9x9 grid, so nothing is lost to the edges
        expect(Math.abs(total - 255)).toBeLessThanOrEqual(4);
    });

    it("bakes in the alpha multiplier and the saturation boost", () => {
        const plain = createGlowBlur(1, 1, { radius: 0 });
        const baked = createGlowBlur(1, 1, { radius: 0, saturate: 1.3, alpha: 0.9 });
        const src = new Uint8ClampedArray([200, 100, 100, 255]);
        const a = new Uint8ClampedArray(4);
        const b = new Uint8ClampedArray(4);
        plain(src, a);
        baked(src, b);
        expect(Array.from(a)).toEqual([200, 100, 100, 255]);
        expect(b[3]).toBe(Math.round(255 * 0.9));
        // more saturated: red pulls up, the others down
        expect(b[0]).toBeGreaterThan(200);
        expect(b[1]).toBeLessThan(100);
    });
});
