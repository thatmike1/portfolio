import { describe, expect, it } from "vitest";
import { Fireflies, glow } from "./fireflies";

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
});
