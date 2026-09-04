import { describe, expect, it } from "vitest";
import { Fireflies, glow, nearest } from "./fireflies";
import type { Firefly } from "./fireflies";

const bug = (x: number, y: number): Firefly => ({
    x,
    y,
    vx: 0,
    vy: 0,
    hx: x,
    hy: y,
    phase: 0,
    rate: 0.03,
    fade: 1,
    leaving: false,
});

describe("fireflies", () => {
    it("comes out over moss up to want, and goes home when want drops", () => {
        const f = new Fireflies(120, 60);
        const env = { want: 4, home: () => [60, 40] as const };
        for (let i = 0; i < 600; i++) f.tick(env);
        expect(f.bugs.length).toBe(4);
        for (let i = 0; i < 600; i++) f.tick({ ...env, want: 0 });
        expect(f.bugs.length).toBe(0);
    });

    it("stays away when there is no moss to hang around", () => {
        const f = new Fireflies(120, 60);
        for (let i = 0; i < 600; i++) f.tick({ want: 4, home: () => null });
        expect(f.bugs.length).toBe(0);
    });

    it("keeps near home and blinks", () => {
        const f = new Fireflies(120, 60);
        const env = { want: 1, home: () => [60, 40] as const };
        let lit = 0;
        for (let i = 0; i < 3000; i++) {
            f.tick(env);
            for (const b of f.bugs) {
                expect(Math.hypot(b.x - 60, b.y - 40)).toBeLessThan(14);
                if (glow(b) > 0.5) lit++;
            }
        }
        expect(lit).toBeGreaterThan(50);
        expect(lit).toBeLessThan(2000);
    });

    it("finds the nearest bug to a stale aim, and nothing when the aim is off", () => {
        const bugs = [bug(10.4, 20.2), bug(12, 20), bug(30, 30)];
        // the frog aimed at cell (10, 20) and both near bugs have drifted since
        expect(nearest(bugs, 10, 20, 1.5)).toBe(0);
        expect(nearest(bugs, 12, 20, 1.5)).toBe(1);
        // an aim with nothing left near it eats nothing
        expect(nearest(bugs, 20, 20, 1.5)).toBe(-1);
        expect(nearest([], 10, 20, 1.5)).toBe(-1);
    });
});
