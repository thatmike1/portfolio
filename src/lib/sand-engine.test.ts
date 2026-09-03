import { describe, expect, it } from "vitest";
import { AMBER, EMPTY, MATERIAL, PACKED, RASP, SandEngine, WATER } from "./sand-engine";

describe("packed sand", () => {
    it("holds its place while loose grains fall past it", () => {
        const e = new SandEngine(5, 6);
        e.set(2, 1, RASP | PACKED);
        e.set(0, 0, RASP);
        for (let i = 0; i < 10; i++) e.step();
        expect(e.cells[1 * 5 + 2]).toBe(RASP | PACKED);
        expect(e.cells[5 * 5 + 0]).toBe(RASP);
    });

    it("is solid to powder and to water", () => {
        const e = new SandEngine(3, 4);
        for (let x = 0; x < 3; x++) e.set(x, 2, AMBER | PACKED);
        e.set(1, 0, RASP);
        e.set(0, 0, WATER);
        for (let i = 0; i < 10; i++) e.step();
        // the packed row is untouched and nothing got through it
        for (let x = 0; x < 3; x++) expect(e.cells[2 * 3 + x]).toBe(AMBER | PACKED);
        for (let x = 0; x < 3; x++) expect(e.cells[3 * 3 + x]).toBe(EMPTY);
        expect(e.cells[1 * 3 + 1]).toBe(RASP);
    });

    it("falls once the bit is cleared, keeping its tint", () => {
        const e = new SandEngine(3, 4);
        e.set(1, 0, RASP | PACKED);
        const tint = e.tint[1];
        e.cells[1] &= MATERIAL;
        for (let i = 0; i < 5; i++) e.step();
        expect(e.cells[3 * 3 + 1]).toBe(RASP);
        expect(e.tint[3 * 3 + 1]).toBe(tint);
    });
});
