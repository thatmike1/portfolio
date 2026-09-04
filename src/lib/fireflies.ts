/**
 * fireflies for the night sky. they come out over moss once the birds have
 * gone, each one drifting around a patch of it and blinking on its own clock.
 * positions are grid cells, a tick is one simulation step; the caller says
 * how many the night wants and where the moss is, and draws the glow.
 */

export type Firefly = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    /** the cell this one hangs around */
    hx: number;
    hy: number;
    /** blink clock, radians */
    phase: number;
    /** how fast this one blinks */
    rate: number;
    /** 0..1, fades in on arrival and out when sent home */
    fade: number;
    leaving: boolean;
};

export type FireflyEnv = {
    /** how many the night wants right now */
    want: number;
    /** a cell with moss in it to hang around, or null when there is none */
    home: () => readonly [number, number] | null;
};

/** cells a firefly wanders from its home before it turns back */
const RANGE = 7;

export class Fireflies {
    bugs: Firefly[] = [];
    private cooldown = 0;

    constructor(
        readonly cols: number,
        readonly rows: number,
    ) {}

    tick(env: FireflyEnv): void {
        const { bugs } = this;
        if (this.cooldown > 0) this.cooldown--;
        const staying = bugs.filter((b) => !b.leaving).length;
        if (staying < env.want && this.cooldown === 0) {
            const home = env.home();
            if (home) {
                bugs.push({
                    x: home[0] + (Math.random() * 6 - 3),
                    y: home[1] - 1 - Math.random() * 3,
                    vx: 0,
                    vy: 0,
                    hx: home[0],
                    hy: home[1],
                    phase: Math.random() * Math.PI * 2,
                    rate: 0.03 + Math.random() * 0.03,
                    fade: 0,
                    leaving: false,
                });
                this.cooldown = 40;
            }
        } else if (staying > env.want) {
            const b = bugs.find((f) => !f.leaving);
            if (b) b.leaving = true;
        }

        for (let k = bugs.length - 1; k >= 0; k--) {
            const b = bugs[k];
            b.fade += b.leaving ? -0.01 : 0.01;
            if (b.fade <= 0 && b.leaving) {
                bugs.splice(k, 1);
                continue;
            }
            b.fade = Math.min(1, b.fade);
            // a wander with a pull back toward home, gentle so the path curls
            b.vx += (Math.random() - 0.5) * 0.02 + (b.hx - b.x) * 0.0006;
            b.vy += (Math.random() - 0.5) * 0.02 + (b.hy - 2 - b.y) * 0.0006;
            const dx = b.x - b.hx;
            const dy = b.y - b.hy;
            if (dx * dx + dy * dy > RANGE * RANGE) {
                b.vx -= dx * 0.003;
                b.vy -= dy * 0.003;
            }
            b.vx *= 0.96;
            b.vy *= 0.96;
            b.x += b.vx;
            b.y += b.vy;
            b.x = Math.max(0, Math.min(this.cols - 1, b.x));
            b.y = Math.max(0, Math.min(this.rows - 1, b.y));
            b.phase += b.rate;
            // now and then one picks a new patch to hang around
            if (Math.random() < 0.002) {
                const home = env.home();
                if (home) {
                    b.hx = home[0];
                    b.hy = home[1];
                }
            }
        }
    }
}

/** 0..1 how lit a firefly is this tick: a pulse, dark for the other half */
export function glow(b: Firefly): number {
    const s = Math.sin(b.phase);
    return (s > 0 ? s * s : 0) * b.fade;
}
