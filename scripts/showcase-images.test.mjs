import { describe, expect, it } from "vitest";
import { ladderFor } from "./showcase-images.mjs";

describe("the webp ladder", () => {
    it("caps a big desktop capture at 2560 and keeps the rungs a phone and a laptop need", () => {
        expect(ladderFor(2560)).toEqual([480, 800, 1200, 1600, 2000, 2560]);
        expect(ladderFor(3840)).toEqual([480, 800, 1200, 1600, 2000, 2560]);
    });

    it("tops out at the master's own width, never upscaling", () => {
        expect(ladderFor(1170)).toEqual([480, 800, 1170]);
        expect(ladderFor(440)).toEqual([440]);
    });

    it("skips a rung too close to the top to be worth its own file", () => {
        // 1200 is within 10% of 1300, so 1300 itself is the next step up from 800
        expect(ladderFor(1300)).toEqual([480, 800, 1300]);
    });
});
