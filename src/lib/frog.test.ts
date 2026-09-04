import { describe, expect, it } from "vitest";
import { HOP, LICK, LICK_TICKS, SIT, frogCells, hop, spawn } from "./frog";
import type { FrogEnv } from "./frog";

/** flat ground at row `ground` across the grid, nothing to eat */
const flat = (ground: number, over: Partial<FrogEnv> = {}): FrogEnv => ({
    stand: (_x, y) => y >= ground,
    prey: () => null,
    eat: () => {},
    ...over,
});

describe("frog", () => {
    it("sits, hops forward and lands back on the ground", () => {
        const env = flat(10);
        const f = spawn(20, 9, 1);
        f.timer = 3;
        let hopped = false;
        for (let i = 0; i < 300; i++) {
            expect(hop(f, env, 60, 20)).toBe(true);
            if (f.state === HOP) hopped = true;
            if (hopped && f.state === SIT) break;
        }
        expect(hopped).toBe(true);
        expect(f.state).toBe(SIT);
        expect(f.y).toBe(9);
        expect(Math.abs(f.x - 20)).toBeGreaterThan(3);
    });

    it("licks a firefly in reach and eats it halfway through", () => {
        const eaten: Array<readonly [number, number]> = [];
        let there = true;
        const env = flat(10, {
            prey: () => (there ? ([23, 6] as const) : null),
            eat: (t) => {
                eaten.push(t);
                there = false;
            },
        });
        const f = spawn(20, 9, -1);
        hop(f, env, 60, 20);
        expect(f.state).toBe(LICK);
        expect(f.dir).toBe(1);
        for (let i = 0; i < LICK_TICKS; i++) hop(f, env, 60, 20);
        expect(eaten).toEqual([[23, 6]]);
        expect(f.state).toBe(SIT);
        expect(f.tongue).toBeNull();
    });

    it("drops when the ground goes and is gone off the bottom", () => {
        let ground = 10;
        const env: FrogEnv = { stand: (_x, y) => y >= ground, prey: () => null, eat: () => {} };
        const f = spawn(20, 9, 1);
        ground = 100;
        let alive = true;
        for (let i = 0; i < 200 && alive; i++) alive = hop(f, env, 60, 20);
        expect(alive).toBe(false);
    });

    it("turns from a cliff and hops toward the lure", () => {
        // ground only to the left of x = 30; the frog sits near the edge facing it
        const env = flat(10, { stand: (x, y) => y >= 10 && x < 30 });
        const f = spawn(26, 9, 1);
        f.timer = 1;
        hop(f, env, 60, 20);
        expect(f.state).toBe(HOP);
        expect(f.dir).toBe(-1);

        const lured = flat(10, { lure: () => 50 });
        const g = spawn(20, 9, -1);
        g.timer = 1;
        const rnd = Math.random;
        Math.random = () => 0.1;
        try {
            hop(g, lured, 60, 20);
        } finally {
            Math.random = rnd;
        }
        expect(g.dir).toBe(1);
    });

    it("leaving, it hops toward the nearer edge until it is off", () => {
        const env = flat(10);
        const f = spawn(10, 9, 1);
        f.leaving = true;
        f.timer = 1;
        let alive = true;
        let ticks = 0;
        while (alive && ticks++ < 3000) alive = hop(f, env, 60, 20);
        expect(alive).toBe(false);
        expect(f.x).toBeLessThan(0);
    });

    it("draws body and head, and a tongue that reaches the target mid-lick", () => {
        const f = spawn(5, 5, 1);
        expect(frogCells(f).map((c) => c[2])).toEqual(["body", "body", "head"]);
        f.state = LICK;
        f.tongue = [9, 3];
        f.timer = LICK_TICKS >> 1;
        const cells = frogCells(f);
        const tip = cells[cells.length - 1];
        expect(tip[2]).toBe("tongue");
        expect([5 + tip[0], 5 + tip[1]]).toEqual([9, 3]);
    });
});
