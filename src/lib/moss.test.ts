import { describe, expect, it } from "vitest";
import { dampen, decay, germinate, grow, preGrow } from "./moss";
import type { MossWorld } from "./moss";
import { EMPTY, MOSS, PACKED, RASP, SandEngine, SEED, WALL, WATER } from "./sand-engine";

function world(cols: number, rows: number): MossWorld & { engine: SandEngine } {
    const engine = new SandEngine(cols, rows);
    return { cols, rows, cells: engine.cells, tint: engine.tint, damp: new Uint8Array(cols * rows), engine };
}

const count = (w: MossWorld, m: number) => w.cells.reduce((n, c) => n + (c === m ? 1 : 0), 0);

describe("moss", () => {
    it("wets the sand beside water and dries it off again", () => {
        const w = world(3, 3);
        w.cells[4] = WATER;
        w.cells[7] = RASP | PACKED;
        w.cells[3] = RASP;
        expect(dampen(w)).toBe(2);
        expect(w.damp[7]).toBe(255);
        expect(w.damp[3]).toBe(255);
        expect(w.damp[5]).toBe(0);
        decay(w, 200);
        decay(w, 200);
        expect(w.damp[7]).toBe(0);
    });

    it("a seed takes on damp sand and waits on dry sand", () => {
        const w = world(1, 3);
        w.cells[0] = SEED;
        w.cells[1] = RASP | PACKED;
        w.cells[2] = WALL;
        expect(germinate(w)).toBe(0);
        expect(w.cells[0]).toBe(SEED);
        w.damp[1] = 255;
        expect(germinate(w)).toBe(1);
        expect(w.cells[0]).toBe(MOSS);
    });

    it("a falling seed does not take mid-air", () => {
        const w = world(1, 4);
        w.cells[0] = SEED;
        w.cells[3] = RASP | PACKED;
        w.damp[3] = 255;
        expect(germinate(w)).toBe(0);
        w.engine.step();
        w.engine.step();
        expect(w.cells[2]).toBe(SEED);
        expect(germinate(w)).toBe(1);
    });

    it("spreads over damp sand, climbs, and stops at the budget", () => {
        const w = world(3, 6);
        // a column of packed sand with moss at its foot, all of it damp
        for (let y = 0; y < 6; y++) w.cells[y * 3 + 1] = RASP | PACKED;
        w.cells[5 * 3 + 1] = MOSS;
        w.damp.fill(255);
        const always = () => 0;
        for (let k = 0; k < 20; k++) grow(w, 4, 1, always);
        expect(count(w, MOSS)).toBe(4);
        // it went up the column, not sideways into air
        expect(w.cells[2 * 3 + 1]).toBe(MOSS);
        expect(w.cells[1 * 3 + 1]).toBe(RASP | PACKED);
    });

    it("dry moss leaves dry sand alone, wet moss wicks onto it", () => {
        const w = world(1, 3);
        w.cells[0] = RASP | PACKED;
        w.cells[1] = MOSS;
        w.cells[2] = WALL;
        for (let k = 0; k < 20; k++) grow(w, 10, 1, () => 0);
        expect(w.cells[0]).toBe(RASP | PACKED);
        w.damp[1] = 255;
        grow(w, 10, 1, () => 0);
        expect(w.cells[0]).toBe(MOSS);
    });

    it("moss with nothing around it drops off", () => {
        const w = world(3, 3);
        w.cells[4] = MOSS;
        expect(grow(w, 10, 1)).toBe(0);
        expect(w.cells[4]).toBe(EMPTY);
    });

    it("pre-grows a word from its skyward face and leaves the ground dry", () => {
        // a five-wide block of sand with open sky over the top row
        const w = world(5, 4);
        for (let i = 5; i < 20; i++) w.cells[i] = RASP | PACKED;
        const n = preGrow(w, 8);
        expect(n).toBe(8);
        expect(count(w, MOSS)).toBe(8);
        // the top row is where it started, so it greened first
        for (let x = 0; x < 5; x++) expect(w.cells[5 + x]).toBe(MOSS);
        // nothing reached the bottom row, and the shortcut's dampness is gone
        for (let x = 0; x < 5; x++) expect(w.cells[15 + x]).toBe(RASP | PACKED);
        expect(w.damp.every((d) => d === 0)).toBe(true);
    });

    it("pre-grows nothing without a target or a word", () => {
        const w = world(3, 3);
        w.cells[4] = RASP | PACKED;
        expect(preGrow(w, 0)).toBe(0);
        expect(preGrow(world(3, 3), 5)).toBe(0);
    });

    it("the engine never moves moss and drops a seed", () => {
        const w = world(1, 3);
        w.cells[0] = SEED;
        w.cells[1] = MOSS;
        w.engine.step();
        expect(w.cells[0]).toBe(SEED);
        expect(w.cells[1]).toBe(MOSS);
        w.cells[1] = EMPTY;
        w.engine.step();
        expect(w.cells[1]).toBe(SEED);
    });
});
