/**
 * a fixed-rate simulation clock. feed it requestAnimationFrame timestamps and
 * it hands back how many ticks the simulation owes, so a 120hz display gets two
 * frames per tick instead of double-speed physics, and a tab coming back from
 * the background gets at most `maxTicks` instead of a catch-up storm.
 */
export type FixedStep = {
    /** ticks owed since the previous call, between 0 and maxTicks */
    advance(now: number): number;
    /** forget the previous timestamp; call when the loop restarts after a pause */
    reset(): void;
};

export function createFixedStep(hz = 60, maxTicks = 2): FixedStep {
    const step = 1000 / hz;
    // a display running at exactly the tick rate delivers frames a hair under the
    // step as often as over it. without slack the accumulator would skip a tick
    // on the short frame and double up on the next, a visible hitch every few
    // seconds. the debt is paid back on later frames, so the average rate holds
    const slack = step * 0.25;
    let acc = 0;
    let last = 0;
    return {
        advance(now) {
            if (last) acc += Math.min(Math.max(0, now - last), step * maxTicks);
            last = now;
            let ticks = 0;
            while (acc >= step - slack && ticks < maxTicks) {
                acc -= step;
                ticks++;
            }
            return ticks;
        },
        reset() {
            acc = 0;
            last = 0;
        },
    };
}
