/**
 * a frog for the fireflies. it turns up at night once there are enough of
 * them, sits on a letter, hops a few cells now and then, and when a firefly
 * drifts within reach the tongue goes out and the firefly is gone. at daybreak
 * it hops off toward an edge. grid cells, one tick per simulation step; the
 * caller owns the cells, the fireflies and the sprites.
 */

export const SIT = 0;
export const HOP = 1;
export const LICK = 2;

export type Frog = {
    x: number;
    y: number;
    dir: -1 | 1;
    state: number;
    vx: number;
    vy: number;
    /** ticks left sitting, or ticks left of the lick */
    timer: number;
    /** where the tongue is going */
    tongue: readonly [number, number] | null;
    leaving: boolean;
};

export type FrogEnv = {
    /** anything at (x, y) a frog can sit on; water counts, it floats */
    stand: (x: number, y: number) => boolean;
    /** the nearest firefly within reach of (x, y), or null */
    prey: (x: number, y: number) => readonly [number, number] | null;
    /** that firefly is eaten */
    eat: (target: readonly [number, number]) => void;
    /** the x of whatever the frog would rather be near, or null for nowhere in particular */
    lure?: (x: number, y: number) => number | null;
};

/** how far the tongue reaches, in cells */
export const REACH = 4;
/** the hop: forward speed, launch speed, and the pull back down */
export const HOP_VX = 0.2;
export const HOP_VY = -0.45;
export const GRAVITY = 0.03;
/** ticks a lick takes; the firefly goes at the halfway point */
export const LICK_TICKS = 20;
/** about how far a hop carries it, and how far below the take-off it will drop to land */
export const HOP_RUN = 6;
export const HOP_DROP = 4;

/**
 * is there ground within HOP_DROP under the stretch where a hop that way comes
 * down; the arc lands somewhere in its last third, so every column there counts
 */
const landing = (env: FrogEnv, x: number, y: number, dir: -1 | 1): boolean => {
    for (let c = HOP_RUN - 2; c <= HOP_RUN; c++) {
        const lx = x + dir * c;
        let ok = false;
        for (let k = -1; k <= HOP_DROP && !ok; k++) ok = env.stand(lx, y + 1 + k);
        if (!ok) return false;
    }
    return true;
};

export function spawn(x: number, y: number, dir: -1 | 1): Frog {
    return { x, y, dir, state: SIT, vx: 0, vy: 0, timer: 60 + Math.random() * 120, tongue: null, leaving: false };
}

const sitAWhile = (f: Frog): void => {
    f.timer = f.leaving ? 20 + Math.random() * 30 : 150 + Math.random() * 450;
};

/** one tick; returns false when the frog is gone (off the grid) */
export function hop(f: Frog, env: FrogEnv, cols: number, rows: number): boolean {
    const cx = Math.round(f.x);
    const cy = Math.round(f.y);
    if (cx < -2 || cx > cols + 1 || cy >= rows - 1) return false;

    if (f.state === HOP) {
        f.vy += GRAVITY;
        f.x += f.vx;
        f.y += f.vy;
        const nx = Math.round(f.x);
        const ny = Math.round(f.y);
        if (f.vy > 0 && env.stand(nx, ny + 1)) {
            f.y = ny;
            f.vx = 0;
            f.vy = 0;
            f.state = SIT;
            sitAWhile(f);
        }
        return true;
    }

    // the ground went from under it: it drops
    if (!env.stand(cx, cy + 1)) {
        f.state = HOP;
        f.vx = 0;
        f.vy = 0;
        return true;
    }

    if (f.state === LICK) {
        f.timer--;
        if (f.timer === LICK_TICKS >> 1 && f.tongue) env.eat(f.tongue);
        if (f.timer <= 0) {
            f.tongue = null;
            f.state = SIT;
            sitAWhile(f);
        }
        return true;
    }

    // sitting: a firefly in reach is a lick, otherwise wait out the timer and hop
    if (!f.leaving) {
        const p = env.prey(cx, cy);
        if (p) {
            f.dir = p[0] < cx ? -1 : 1;
            f.tongue = p;
            f.state = LICK;
            f.timer = LICK_TICKS;
            return true;
        }
    }
    if (--f.timer > 0) return true;
    if (f.leaving) f.dir = cx < cols / 2 ? -1 : 1;
    else {
        // toward the fireflies more often than not, and never off a cliff
        const lure = env.lure ? env.lure(cx, cy) : null;
        if (lure !== null && Math.abs(lure - cx) > 2 && Math.random() < 0.7) f.dir = lure < cx ? -1 : 1;
        else if (Math.random() < 0.4) f.dir = f.dir > 0 ? -1 : 1;
        if (!landing(env, cx, cy, f.dir)) {
            f.dir = f.dir > 0 ? -1 : 1;
            if (!landing(env, cx, cy, f.dir)) {
                sitAWhile(f);
                return true;
            }
        }
    }
    f.state = HOP;
    f.vx = f.dir * HOP_VX;
    f.vy = HOP_VY;
    return true;
}

/**
 * sprite cells as (dx, dy, part): a two-cell body with the head up on the
 * forward side; mid-hop the legs trail. the tongue is a line of cells from the
 * head to its target
 */
export function frogCells(f: Frog): ReadonlyArray<readonly [number, number, "body" | "head" | "tongue"]> {
    const d = f.dir;
    const out: Array<readonly [number, number, "body" | "head" | "tongue"]> = [
        [0, 0, "body"],
        [d, 0, "body"],
        [d, -1, "head"],
    ];
    if (f.state === HOP) out.push([-d, 1, "body"]);
    if (f.state === LICK && f.tongue) {
        const cx = Math.round(f.x) + d;
        const cy = Math.round(f.y) - 1;
        const dx = f.tongue[0] - cx;
        const dy = f.tongue[1] - cy;
        const n = Math.max(Math.abs(dx), Math.abs(dy));
        // out fast, back slow: the tip is at the target through the middle of the lick
        const t = f.timer > LICK_TICKS * 0.6 ? (LICK_TICKS - f.timer) / (LICK_TICKS * 0.4) : f.timer / (LICK_TICKS * 0.6);
        const len = Math.round(n * Math.min(1, t));
        for (let k = 1; k <= len; k++) {
            out.push([d + Math.round((dx * k) / n), -1 + Math.round((dy * k) / n), "tongue"]);
        }
    }
    return out;
}
