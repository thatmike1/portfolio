import { describe, expect, it } from "vitest";
import { DRY, FADE, fishCells, spawn, swim } from "./fish";
import type { FishEnv } from "./fish";

/** a pool: water from row `top` down to the last row, air above, banks at the grid edges */
const pool = (cols: number, rows: number, top: number): FishEnv => ({
    water: (x, y) => x >= 0 && x < cols && y >= top && y < rows,
    open: (x, y) => x >= 0 && x < cols && y >= 0 && y < top,
});

describe("fish", () => {
    it("fades in and cruises the pool without leaving the water", () => {
        const env = pool(40, 10, 4);
        const f = spawn(20, 7, 1);
        for (let i = 0; i < 600; i++) {
            expect(swim(f, env, 40, 10)).toBe(true);
            if (!f.jumping) {
                expect(env.water(Math.round(f.x), Math.round(f.y))).toBe(true);
            }
        }
        expect(f.fade).toBe(1);
    });

    it("turns at the bank", () => {
        const env = pool(12, 8, 2);
        const f = spawn(9, 5, 1);
        // no leaps or whims for this one
        const rnd = Math.random;
        Math.random = () => 0.5;
        try {
            for (let i = 0; i < 40; i++) swim(f, env, 12, 8);
        } finally {
            Math.random = rnd;
        }
        expect(f.dir).toBe(-1);
        expect(f.x).toBeLessThan(11);
    });

    it("leaps clear of the water and falls back in", () => {
        const env = pool(40, 12, 6);
        const f = spawn(20, 7, 1);
        f.fade = 1;
        f.jumping = true;
        f.vy = -0.5;
        let top = f.y;
        let ticks = 0;
        while (f.jumping && ticks++ < 200) {
            swim(f, env, 40, 12);
            top = Math.min(top, f.y);
        }
        expect(f.jumping).toBe(false);
        expect(top).toBeLessThan(6);
        expect(env.water(Math.round(f.x), Math.round(f.y))).toBe(true);
    });

    it("is gone once its water has been away a while", () => {
        const env: FishEnv = { water: () => false, open: () => true };
        const f = spawn(5, 5, 1);
        let alive = true;
        let ticks = 0;
        while (alive && ticks < DRY + 5) {
            alive = swim(f, env, 20, 10);
            ticks++;
        }
        expect(alive).toBe(false);
        expect(ticks).toBe(DRY + 1);
    });

    it("fades out and is gone when leaving", () => {
        const env = pool(40, 10, 4);
        const f = spawn(20, 7, 1);
        f.fade = 1;
        f.leaving = true;
        let ticks = 0;
        while (swim(f, env, 40, 10)) ticks++;
        expect(ticks).toBe(Math.ceil(1 / FADE) - 1);
    });

    it("draws three cells with the head forward", () => {
        const f = spawn(0, 0, -1);
        const cells = fishCells(f);
        expect(cells.length).toBe(3);
        expect(cells[0]).toEqual([-1, 0, "body"]);
        expect(cells[2][0]).toBe(1);
        expect(cells[2][2]).toBe("fin");
    });
});
