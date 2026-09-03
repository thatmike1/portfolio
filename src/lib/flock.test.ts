import { describe, expect, it } from "vitest";
import { APPROACH, FLY, Flock, LEAVE, PERCH, birdCells } from "./flock";
import type { FlockEnv } from "./flock";

const quiet = (over: Partial<FlockEnv> = {}): FlockEnv => ({
    wind: 0.05,
    want: 3,
    perch: () => -1,
    holds: () => true,
    scared: () => false,
    ...over,
});

function run(flock: Flock, env: FlockEnv, ticks: number) {
    for (let i = 0; i < ticks; i++) flock.tick(env);
}

describe("flock", () => {
    it("fills the sky up to want and no further", () => {
        const f = new Flock(120, 40);
        run(f, quiet({ want: 3 }), 600);
        expect(f.birds.length).toBe(3);
    });

    it("sends everyone off when want drops to zero", () => {
        const f = new Flock(120, 40);
        run(f, quiet({ want: 3 }), 600);
        run(f, quiet({ want: 0 }), 2000);
        expect(f.birds.length).toBe(0);
    });

    it("keeps flyers inside the sky rows", () => {
        const f = new Flock(120, 30);
        const env = quiet({ want: 5, wind: -0.1 });
        for (let i = 0; i < 3000; i++) {
            f.tick(env);
            for (const b of f.birds) {
                expect(b.y).toBeGreaterThanOrEqual(1);
                expect(b.y).toBeLessThanOrEqual(28);
            }
        }
    });

    it("lands on a perch and takes off when it stops holding", () => {
        const f = new Flock(120, 40);
        const site = 20 * 120 + 60;
        let holds = true;
        const env = quiet({ want: 1, perch: () => site, holds: () => holds });
        let landed = false;
        for (let i = 0; i < 6000 && !landed; i++) {
            f.tick(env);
            landed = f.birds.some((b) => b.state === PERCH);
        }
        expect(landed).toBe(true);
        const bird = f.birds.find((b) => b.state === PERCH)!;
        expect(bird.x).toBe(60);
        expect(bird.y).toBe(20);
        holds = false;
        f.tick(env);
        expect(bird.state).toBe(FLY);
        expect(bird.vy).toBeLessThan(0);
    });

    it("draws every state as a handful of cells", () => {
        const f = new Flock(120, 40);
        const b = f.spawn(1);
        for (const state of [FLY, APPROACH, PERCH, LEAVE]) {
            b.state = state;
            const cells = birdCells(b);
            expect(cells.length).toBeGreaterThanOrEqual(3);
            expect(cells.length).toBeLessThanOrEqual(5);
        }
    });
});
