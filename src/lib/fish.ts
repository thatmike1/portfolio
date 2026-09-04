/**
 * fish for the lake. they turn up once there is water deep enough to hide in,
 * cruise the basin turning at the banks, drift up and down a little, and now
 * and then one leaps clear of the surface and falls back in. a fish whose water
 * goes away is gone with it. grid cells, one tick per simulation step; the
 * caller owns the cells and the sprites.
 */

export type Fish = {
    x: number;
    y: number;
    dir: -1 | 1;
    /** vertical speed; the swim drift, or the arc of a jump */
    vy: number;
    /** tail phase, radians */
    phase: number;
    /** 0..1, fades in on arrival and out when leaving */
    fade: number;
    leaving: boolean;
    /** clear of the water, on an arc */
    jumping: boolean;
    /** ticks in a row spent out of water while not jumping */
    dry: number;
};

export type FishEnv = {
    /** is this cell water */
    water: (x: number, y: number) => boolean;
    /** is this cell air, so a jump has somewhere to go */
    open: (x: number, y: number) => boolean;
};

/** cells per tick along the cruise, and the fade step per tick */
export const SPEED = 0.12;
export const FADE = 0.02;
/** odds per tick of a leap, its launch speed and the pull back down */
export const LEAP_ODDS = 0.0012;
export const LEAP = -0.5;
export const GRAVITY = 0.03;
/** cells a leap carries the fish along, about; the arc is 2 * LEAP / GRAVITY ticks at 1.6 * SPEED */
export const LEAP_RUN = 6;
/** ticks a fish survives out of water before it is gone */
export const DRY = 40;

export function spawn(x: number, y: number, dir: -1 | 1): Fish {
    return { x, y, dir, vy: 0, phase: Math.random() * Math.PI * 2, fade: 0, leaving: false, jumping: false, dry: 0 };
}

/** one tick; returns false when the fish is gone */
export function swim(f: Fish, env: FishEnv, cols: number, rows: number): boolean {
    if (f.leaving) {
        f.fade -= FADE;
        if (f.fade <= 0) return false;
    } else if (f.fade < 1) {
        f.fade = Math.min(1, f.fade + FADE);
    }
    const cx = Math.round(f.x);
    const cy = Math.round(f.y);

    if (f.jumping) {
        f.vy += GRAVITY;
        f.y += f.vy;
        f.x += f.dir * SPEED * 1.6;
        f.phase += 0.35;
        const nx = Math.round(f.x);
        const ny = Math.round(f.y);
        if (nx < 0 || nx >= cols || ny >= rows) return false;
        if (f.vy > 0 && env.water(nx, ny)) {
            f.jumping = false;
            f.vy = 0;
        } else if (f.vy > 0 && !env.open(nx, ny)) {
            // came down on something that is not water: it flops off
            f.jumping = false;
            f.vy = 0;
            f.leaving = true;
        }
        return true;
    }

    if (!env.water(cx, cy)) {
        // the water went away under it: sink after it, or dry out
        if (++f.dry > DRY) return false;
        if (env.water(cx, cy + 1)) f.y += 0.25;
        return true;
    }
    f.dry = 0;

    // a leap, when there is air within three cells over its head and the arc
    // comes down in water rather than on a letter standing in the lake
    if (!f.leaving && Math.random() < LEAP_ODDS) {
        for (let k = 1; k <= 3; k++) {
            if (env.open(cx, cy - k)) {
                const lx = cx + f.dir * LEAP_RUN;
                const clear = env.open(cx + f.dir * (LEAP_RUN >> 1), cy - k) && env.open(lx, cy - k);
                if (clear && (env.water(lx, cy) || env.water(lx, cy - 1))) {
                    f.jumping = true;
                    f.vy = LEAP;
                    f.phase = 0;
                }
                return true;
            }
            if (!env.water(cx, cy - k)) break;
        }
    }

    // cruise: turn at the bank or on a whim, and drift up or down a little
    const ahead = Math.round(f.x + f.dir * 2);
    if (ahead < 0 || ahead >= cols || !env.water(ahead, cy) || Math.random() < 0.002) {
        f.dir = f.dir > 0 ? -1 : 1;
    }
    f.x += f.dir * SPEED;
    if (Math.random() < 0.01) f.vy = (Math.random() - 0.5) * 0.08;
    // it stays under: a move needs water in the new cell and over it
    const ny = Math.round(f.y + f.vy);
    if (ny !== cy && !(env.water(cx, ny) && env.water(cx, ny - 1))) f.vy = 0;
    else f.y += f.vy;
    f.phase += 0.12;
    return true;
}

/**
 * sprite cells as (dx, dy, part) from the fish's position: a two-cell body
 * with the head forward and a tail fin that flicks up and down as it swims
 */
export function fishCells(f: Fish): ReadonlyArray<readonly [number, number, "body" | "fin"]> {
    const s = Math.sin(f.phase);
    const flick = s > 0.35 ? -1 : s < -0.35 ? 1 : 0;
    return [
        [f.dir, 0, "body"],
        [0, 0, "body"],
        [-f.dir, flick, "fin"],
    ];
}
