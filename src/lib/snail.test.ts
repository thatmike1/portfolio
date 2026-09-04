import { describe, expect, it } from "vitest";
import { CHEW, crawl, GONE, PACE, snailCells, spawn } from "./snail";
import type { SnailEnv } from "./snail";

/** a tiny world from rows of text: # solid, m moss, ~ water, . air */
function world(rows: string[]) {
    const grid = rows.map((r) => r.split(""));
    const env: SnailEnv = {
        solid: (x, y) => (grid[y]?.[x] === "#" || grid[y]?.[x] === "m") ?? false,
        moss: (x, y) => grid[y]?.[x] === "m",
        water: (x, y) => grid[y]?.[x] === "~",
        eat: (x, y) => {
            grid[y][x] = "#";
        },
    };
    return { grid, env, cols: grid[0].length, rows: grid.length };
}

function run(s: ReturnType<typeof spawn>, w: ReturnType<typeof world>, ticks: number): boolean {
    for (let i = 0; i < ticks; i++) if (!crawl(s, w.env, w.cols, w.rows)) return false;
    return true;
}

describe("snail", () => {
    it("walks flat ground, climbs a step and turns at a wall", () => {
        const w = world([
            "........",
            "......##",
            "....####",
            "########",
        ]);
        const s = spawn(0, 2, 1);
        run(s, w, PACE);
        expect([s.x, s.y]).toEqual([1, 2]);
        run(s, w, PACE * 3);
        expect([s.x, s.y]).toEqual([4, 1]);
        run(s, w, PACE * 2);
        expect([s.x, s.y]).toEqual([6, 0]);
        run(s, w, PACE * 2);
        expect([s.x, s.y]).toEqual([7, 0]);
        expect(s.dir).toBe(-1);
    });

    it("turns at a wall it cannot climb", () => {
        const w = world([
            "...#",
            "...#",
            "####",
        ]);
        const s = spawn(1, 1, 1);
        run(s, w, PACE * 2);
        expect([s.x, s.y]).toEqual([2, 1]);
        expect(s.dir).toBe(-1);
    });

    it("turns at a drop and steps down a single step", () => {
        const w = world([
            "......",
            "###...",
            "####..",
            "####..",
            "......",
            "......",
            "......",
            "......",
        ]);
        const s = spawn(1, 0, 1);
        run(s, w, PACE);
        expect([s.x, s.y]).toEqual([2, 0]);
        run(s, w, PACE);
        expect([s.x, s.y]).toEqual([3, 1]);
        run(s, w, PACE);
        expect(s.dir).toBe(-1);
        expect(s.x).toBe(3);
    });

    it("lets itself down a short drop", () => {
        const w = world([
            "##..",
            "....",
            "....",
            "..##",
            "..##",
        ]);
        const s = spawn(1, -1, 1);
        run(s, w, PACE + 4);
        expect([s.x, s.y]).toEqual([2, 2]);
    });

    it("eats the moss it reaches", () => {
        const w = world([
            "....",
            "..m.",
            "####",
        ]);
        const s = spawn(0, 1, 1);
        run(s, w, PACE);
        expect(s.x).toBe(1);
        run(s, w, PACE);
        expect(s.chew).toBe(CHEW);
        run(s, w, CHEW);
        expect(w.grid[1][2]).toBe("#");
    });

    it("falls, wades a puddle, and sinks through deep water to the floor", () => {
        const w = world([
            "#..",
            "..~",
            "~~#",
            "~~#",
            "###",
        ]);
        const s = spawn(1, 0, 1);
        expect(run(s, w, 4)).toBe(true);
        expect(s.y).toBe(2);
        // then climbs the step out of it, into the puddle on the ledge
        run(s, w, PACE);
        expect([s.x, s.y]).toEqual([2, 1]);
        const p = spawn(2, 0, 1);
        expect(run(p, w, PACE)).toBe(true);
        expect(p.y).toBe(0);
    });

    it("gives up and is gone after a while on the way out", () => {
        const w = world([
            "....",
            "####",
        ]);
        const s = spawn(1, 0, 1);
        s.leaving = true;
        expect(run(s, w, GONE + 2)).toBe(false);
    });

    it("leaves over the edge instead of turning", () => {
        const w = world([
            "....",
            "##..",
            "##..",
            "##..",
        ]);
        const s = spawn(0, 0, 1);
        s.leaving = true;
        run(s, w, PACE * 2);
        expect(s.x).toBe(2);
        run(s, w, 3);
        expect(s.y).toBeGreaterThan(0);
    });

    it("is a shell and a head", () => {
        const s = spawn(3, 3, 1);
        const cells = snailCells(s);
        expect(cells.length).toBe(4);
        expect(cells.filter((c) => c[2] === "shell").length).toBe(2);
    });
});
