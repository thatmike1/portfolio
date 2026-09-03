/**
 * a few birds for a pixel sky. positions are in grid cells, a tick is one
 * simulation step; the caller owns the world (where a bird may perch, whether
 * a perch still holds, what counts as a scare) and draws the sprites itself.
 */

export const FLY = 0;
export const APPROACH = 1;
export const PERCH = 2;
export const LEAVE = 3;

export type Bird = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    /** which way it faces, -1 left, 1 right */
    dir: -1 | 1;
    /** wing phase, radians; only advances while flapping */
    phase: number;
    /** wings held flat for a stretch */
    glide: boolean;
    /** the two-cell wingspan bird is the near one */
    big: boolean;
    state: number;
    /** cell index of the perch being flown to or sat on */
    perch: number;
    /** ticks left in the current perch */
    timer: number;
    /** the row this bird cruises around while flying */
    home: number;
};

export type FlockEnv = {
    /** signed, the deck's drift; birds lean into it */
    wind: number;
    /** how many birds the sky should hold right now */
    want: number;
    /** a free cell to sit in with something solid under it, or -1 for none */
    perch: () => number;
    /** is that cell still a place to sit */
    holds: (i: number) => boolean;
    /** anything at (x, y) worth taking off from */
    scared: (x: number, y: number) => boolean;
};

const SPEED = 0.2;
/** ticks between two birds arriving, so a flock trickles in */
const SPAWN_GAP = 70;
/** how far past the edge a bird flies before it turns or is gone */
const MARGIN = 10;

export class Flock {
    birds: Bird[] = [];
    private cooldown = 0;
    private t = 0;

    constructor(
        readonly cols: number,
        /** rows of sky the birds may use */
        readonly skyRows: number,
    ) {}

    /** a bird enters from the upwind edge */
    spawn(wind: number): Bird {
        const dir: -1 | 1 = wind >= 0 ? 1 : -1;
        const home = 3 + Math.random() * Math.max(1, this.skyRows * 0.6);
        const bird: Bird = {
            x: dir > 0 ? -MARGIN + 2 : this.cols + MARGIN - 2,
            y: home,
            vx: dir * SPEED,
            vy: 0,
            dir,
            phase: Math.random() * Math.PI * 2,
            glide: false,
            big: Math.random() < 0.25,
            state: FLY,
            perch: -1,
            timer: 0,
            home,
        };
        this.birds.push(bird);
        return bird;
    }

    tick(env: FlockEnv): void {
        this.t++;
        const { birds, cols, skyRows } = this;
        if (this.cooldown > 0) this.cooldown--;

        const staying = birds.filter((b) => b.state !== LEAVE).length;
        if (staying < env.want && this.cooldown === 0) {
            this.spawn(env.wind);
            this.cooldown = SPAWN_GAP;
        } else if (staying > env.want) {
            // the one nearest an edge goes first, and it leaves the way it faces
            let pick: Bird | null = null;
            let best = Infinity;
            for (const b of birds) {
                if (b.state === LEAVE) continue;
                const d = Math.min(b.x, cols - b.x);
                if (d < best) {
                    best = d;
                    pick = b;
                }
            }
            if (pick) {
                pick.state = LEAVE;
                pick.dir = pick.x < cols / 2 ? -1 : 1;
            }
        }

        // loose flocking: a pull toward the group and a push off a neighbour.
        // only the flyers count; a bird on a letter is not in the formation
        let cx = 0;
        let cy = 0;
        let n = 0;
        for (const b of birds) {
            if (b.state !== FLY) continue;
            cx += b.x;
            cy += b.y;
            n++;
        }
        if (n) {
            cx /= n;
            cy /= n;
        }

        for (let k = birds.length - 1; k >= 0; k--) {
            const b = birds[k];
            if (b.state === PERCH) {
                b.timer--;
                if (b.timer <= 0 || !env.holds(b.perch) || env.scared(b.x, b.y)) {
                    // off in a hop, then a climb
                    b.state = FLY;
                    b.vy = -0.45;
                    b.vx = b.dir * SPEED * 1.4;
                    b.home = Math.max(3, b.y - 6 - Math.random() * skyRows * 0.4);
                    b.phase = 0;
                    b.glide = false;
                }
                continue;
            }

            if (b.state === APPROACH) {
                if (!env.holds(b.perch)) b.state = FLY;
                else {
                    const py = (b.perch / cols) | 0;
                    const px = b.perch - py * cols;
                    const dx = px - b.x;
                    const dy = py - b.y;
                    const d = Math.hypot(dx, dy);
                    if (d < 0.7) {
                        b.x = px;
                        b.y = py;
                        b.vx = 0;
                        b.vy = 0;
                        b.state = PERCH;
                        b.timer = 400 + Math.random() * 1400;
                        b.glide = false;
                        continue;
                    }
                    // slow into the landing so it settles rather than slams
                    const s = Math.min(SPEED * 1.2, 0.05 + d * 0.06);
                    b.vx += ((dx / d) * s - b.vx) * 0.08;
                    b.vy += ((dy / d) * s - b.vy) * 0.08;
                    if (Math.abs(b.vx) > 0.02) b.dir = b.vx > 0 ? 1 : -1;
                    b.x += b.vx;
                    b.y += b.vy;
                    b.phase += 0.22;
                    continue;
                }
            }

            // FLY and LEAVE: cruise, with a wobble and the wind
            if (b.state === FLY) {
                if (b.x < -MARGIN && b.dir < 0) b.dir = 1;
                else if (b.x > cols + MARGIN && b.dir > 0) b.dir = -1;
                // a rare change of mind, off screen or not
                else if (Math.random() < 0.0008) b.dir = b.dir > 0 ? -1 : 1;
                // now and then, a look for somewhere to sit
                if (Math.random() < 0.0012 && b.x > 0 && b.x < cols) {
                    const p = env.perch();
                    if (p >= 0) {
                        b.state = APPROACH;
                        b.perch = p;
                        b.glide = false;
                    }
                }
            } else if (b.x < -MARGIN || b.x > cols + MARGIN) {
                birds.splice(k, 1);
                continue;
            }

            const targetVx = b.dir * SPEED + env.wind * 0.3;
            b.vx += (targetVx - b.vx) * 0.04;
            const bob = Math.sin(this.t * 0.03 + b.phase * 0.2) * 1.5;
            let targetY = b.home + bob;
            if (n > 1 && b.state === FLY) {
                // a gentle pull to the group, mostly in height, so they keep a band
                targetY += (cy - b.y) * 0.25;
                b.vx += (cx - b.x) * 0.0004;
            }
            targetY = Math.max(2, Math.min(skyRows - 3, targetY));
            b.vy += ((targetY - b.y) * 0.03 - b.vy) * 0.1;
            for (const o of birds) {
                if (o === b || o.state === PERCH) continue;
                const dx = b.x - o.x;
                const dy = b.y - o.y;
                if (Math.abs(dx) < 4 && Math.abs(dy) < 2.5) {
                    b.vy += dy >= 0 ? 0.02 : -0.02;
                    b.vx += dx >= 0 ? 0.004 : -0.004;
                }
            }
            b.x += b.vx;
            b.y += b.vy;
            b.y = Math.max(1, Math.min(skyRows - 2, b.y));

            // flap, or hold the wings out for a bit when not climbing
            if (b.glide) {
                if (b.vy < -0.05 || Math.random() < 0.01) b.glide = false;
            } else {
                b.phase += 0.2;
                if (b.vy >= -0.02 && Math.random() < 0.004) b.glide = true;
            }
        }
    }
}

/**
 * sprite cells for a bird as (dx, dy) pairs from its position. flying birds
 * cycle four wing frames; a perched one is a lump with a head that bobs
 */
export function birdCells(b: Bird): ReadonlyArray<readonly [number, number]> {
    if (b.state === PERCH) {
        const bob = ((b.timer / 40) | 0) % 5 === 0;
        return [
            [-b.dir, 0],
            [0, 0],
            [b.dir, bob ? 0 : -1],
        ];
    }
    const frame = b.glide ? 1 : (((Math.sin(b.phase) + 1) / 2) * 3.99) | 0;
    return b.big ? BIG[frame] : SMALL[frame];
}

const SMALL: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
    [
        [-1, -1],
        [0, 0],
        [1, -1],
    ],
    [
        [-1, 0],
        [0, 0],
        [1, 0],
    ],
    [
        [-1, 1],
        [0, 0],
        [1, 1],
    ],
    [
        [-1, 0],
        [0, 0],
        [1, 0],
    ],
];

const BIG: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
    [
        [-2, -2],
        [-1, -1],
        [0, 0],
        [1, -1],
        [2, -2],
    ],
    [
        [-2, -1],
        [-1, 0],
        [0, 0],
        [1, 0],
        [2, -1],
    ],
    [
        [-2, 1],
        [-1, 1],
        [0, 0],
        [1, 1],
        [2, 1],
    ],
    [
        [-2, 0],
        [-1, 0],
        [0, 0],
        [1, 0],
        [2, 0],
    ],
];
