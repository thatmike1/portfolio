import { describe, expect, it } from "vitest";
import { createFixedStep } from "./fixed-step";

/** total ticks over `frames` frames delivered `gap` ms apart, with optional jitter */
function run(gap: number, frames: number, jitter = 0) {
    const clock = createFixedStep(60, 2);
    let now = 1000;
    let ticks = 0;
    const perFrame: number[] = [];
    for (let i = 0; i < frames; i++) {
        const n = clock.advance(now);
        ticks += n;
        perFrame.push(n);
        now += gap + (i % 2 === 0 ? jitter : -jitter);
    }
    return { ticks, perFrame };
}

describe("createFixedStep", () => {
    it("ticks once per frame on a 60hz display, even with frame jitter", () => {
        const { ticks, perFrame } = run(1000 / 60, 121, 0.4);
        expect(ticks).toBe(120);
        // no 0-then-2 hitches
        expect(perFrame.slice(1).every((n) => n === 1)).toBe(true);
    });

    it("ticks every other frame on a 120hz display", () => {
        const { ticks } = run(1000 / 120, 241);
        expect(ticks).toBe(120);
    });

    it("ticks twice per frame on a 30hz display", () => {
        const { ticks } = run(1000 / 30, 61);
        expect(ticks).toBe(120);
    });

    it("caps catch-up after a long pause", () => {
        const clock = createFixedStep(60, 2);
        clock.advance(0);
        clock.advance(16.7);
        expect(clock.advance(5000)).toBe(2);
    });

    it("owes nothing on the first frame after a reset", () => {
        const clock = createFixedStep(60, 2);
        clock.advance(0);
        clock.advance(16.7);
        clock.reset();
        expect(clock.advance(9000)).toBe(0);
        expect(clock.advance(9016.7)).toBe(1);
    });
});
