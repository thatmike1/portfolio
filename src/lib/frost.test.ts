import { describe, expect, it } from "vitest";
import { drift, FALL, freeze, thaw } from "./frost";
import type { Flake, FrostWorld } from "./frost";
import { EMPTY, ICE, PACKED, RASP, SandEngine, SNOW, WALL, WATER } from "./sand-engine";

function world(cols: number, rows: number): FrostWorld & { engine: SandEngine } {
    const engine = new SandEngine(cols, rows);
    return { cols, rows, cells: engine.cells, tint: engine.tint, engine };
}

const count = (w: FrostWorld, m: number) => w.cells.reduce((n, c) => n + (c === m ? 1 : 0), 0);

describe("frost", () => {
    it("a flake falls slower than sand and lands as snow on the letter", () => {
        const w = world(1, 6);
        w.cells[5] = RASP | PACKED;
        const flakes: Flake[] = [{ x: 0.5, y: 0, phase: 0 }];
        for (let i = 0; i < 3; i++) drift(flakes, w, 0);
        expect(flakes.length).toBe(1);
        expect(flakes[0].y).toBeLessThan(FALL * 3 + 0.1);
        for (let i = 0; i < 60 && flakes.length; i++) drift(flakes, w, 0);
        expect(flakes.length).toBe(0);
        expect(w.cells[4]).toBe(SNOW);
    });

    it("a flake on water freezes it", () => {
        const w = world(1, 3);
        w.cells[2] = WATER;
        const flakes: Flake[] = [{ x: 0.5, y: 0.95, phase: 0 }];
        drift(flakes, w, 0);
        expect(flakes.length).toBe(0);
        expect(w.cells[2]).toBe(ICE);
    });

    it("passes through falling rain and freezes only a pool", () => {
        const w = world(1, 4);
        w.cells[2] = WATER;
        w.cells[3] = WATER;
        w.resting = (i) => i === 3;
        const flakes: Flake[] = [{ x: 0.5, y: 0.95, phase: 0 }];
        drift(flakes, w, 0);
        expect(flakes.length).toBe(1);
        expect(w.cells[2]).toBe(WATER);
        for (let i = 0; i < 20 && flakes.length; i++) drift(flakes, w, 0);
        expect(w.cells[3]).toBe(ICE);
    });

    it("leans with the wind and is lost out of the bottom", () => {
        const w = world(20, 4);
        const flakes: Flake[] = [{ x: 5, y: 0, phase: 0 }];
        drift(flakes, w, 0.4);
        expect(flakes[0].x).toBeGreaterThan(5.1);
        let lost = 0;
        for (let i = 0; i < 60; i++) lost += drift(flakes, w, 0);
        expect(lost).toBe(1);
        expect(flakes.length).toBe(0);
    });

    it("ice creeps over the water beside it and stops at the shore", () => {
        const w = world(5, 2);
        for (let x = 0; x < 5; x++) w.cells[x] = x === 2 ? ICE : WATER;
        for (let x = 0; x < 5; x++) w.cells[5 + x] = WALL;
        for (let i = 0; i < 200; i++) freeze(w, 1);
        expect(count(w, ICE)).toBe(5);
        expect(count(w, WATER)).toBe(0);
    });

    it("the sun melts the open face and leaves buried ice alone", () => {
        const w = world(1, 4);
        w.cells[0] = EMPTY;
        w.cells[1] = SNOW;
        w.cells[2] = ICE;
        w.cells[3] = WALL;
        expect(thaw(w, 1)).toBe(1);
        expect(w.cells[1]).toBe(WATER);
        expect(w.cells[2]).toBe(ICE);
    });

    it("the engine never moves snow or ice", () => {
        const w = world(1, 3);
        w.cells[0] = SNOW;
        w.cells[1] = ICE;
        w.engine.step();
        expect(w.cells[0]).toBe(SNOW);
        expect(w.cells[1]).toBe(ICE);
    });
});
