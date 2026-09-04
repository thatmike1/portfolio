/**
 * a snail for the word. it turns up when there is moss to eat, crawls the
 * surface of the letters, climbs a step, turns at a drop, and grazes the moss
 * it reaches back down to sand. washed into the lake it sinks and crawls the
 * floor. when it has gone hungry a while it wanders off an edge.
 * grid cells, one tick per simulation step; the caller owns the cells.
 */

export type Snail = {
    x: number;
    y: number;
    dir: -1 | 1;
    /** ticks until the next move */
    wait: number;
    /** ticks left chewing the moss under or ahead of it */
    chew: number;
    /** heading for an edge to leave over */
    leaving: boolean;
    /** ticks spent leaving; past GONE it has found its own way off */
    left: number;
};

export type SnailEnv = {
    /** can a snail stand on or bump into this cell */
    solid: (x: number, y: number) => boolean;
    /** is this cell moss */
    moss: (x: number, y: number) => boolean;
    /** water: a snail wades a puddle and sinks through anything deeper to the floor */
    water: (x: number, y: number) => boolean;
    /** the snail has eaten this moss cell */
    eat: (x: number, y: number) => void;
};

/** ticks between steps, ticks a mouthful takes, and the deepest drop it takes on purpose */
export const PACE = 9;
export const CHEW = 50;
export const DROP = 4;
/** ticks a leaving snail gets before it is simply gone, edge or no edge */
export const GONE = 600;

export function spawn(x: number, y: number, dir: -1 | 1): Snail {
    return { x, y, dir, wait: PACE, chew: 0, leaving: false, left: 0 };
}

/** one tick; returns false when the snail is gone (off the grid) */
export function crawl(s: Snail, env: SnailEnv, cols: number, rows: number): boolean {
    const { x, y, dir } = s;
    if (x < 0 || x >= cols || y >= rows - 1) return false;
    if (s.leaving && ++s.left > GONE) return false;
    // gravity first: nothing under it, it drops. a puddle one cell deep is
    // ground it wades through; deeper water it sinks through to the floor and
    // crawls on from there
    if (env.water(x, y + 1)) {
        if (!env.solid(x, y + 2)) {
            s.y++;
            return true;
        }
    } else if (!env.solid(x, y + 1)) {
        s.y++;
        return true;
    }
    if (s.chew > 0) {
        s.chew--;
        if (s.chew === 0) {
            if (env.moss(x, y + 1)) env.eat(x, y + 1);
            else if (env.moss(x + dir, y)) env.eat(x + dir, y);
        }
        return true;
    }
    if (--s.wait > 0) return true;
    s.wait = PACE;
    // moss under it or in its way: stop and eat
    if (!s.leaving && (env.moss(x, y + 1) || env.moss(x + dir, y))) {
        s.chew = CHEW;
        return true;
    }
    const ax = x + dir;
    if (ax < 0 || ax >= cols) {
        if (s.leaving) return false;
        s.dir = dir > 0 ? -1 : 1;
        return true;
    }
    if (env.solid(ax, y)) {
        // a step up, or a wall to turn from
        if (!env.solid(ax, y - 1) && y > 0) {
            s.x = ax;
            s.y = y - 1;
        } else s.dir = dir > 0 ? -1 : 1;
        return true;
    }
    if (env.solid(ax, y + 1) || env.water(ax, y + 1)) {
        s.x = ax;
        return true;
    }
    if (env.solid(ax, y + 2) || env.water(ax, y + 2)) {
        // a step down
        s.x = ax;
        s.y = y + 1;
        return true;
    }
    // a short drop it lets itself down (the dot of the i to its stem); a long
    // one it turns from, unless it is leaving, then over the edge it goes
    for (let k = 3; k <= DROP + 1; k++) {
        if (env.solid(ax, y + k) || (env.water(ax, y + k) && env.solid(ax, y + k + 1))) {
            s.x = ax;
            return true;
        }
        if (env.water(ax, y + k)) break;
    }
    if (s.leaving) {
        s.x = ax;
        return true;
    }
    s.dir = dir > 0 ? -1 : 1;
    return true;
}

/** sprite cells (dx, dy) from the snail's cell: a shell behind, a head with a horn in front */
export function snailCells(s: Snail): ReadonlyArray<readonly [number, number, "shell" | "body"]> {
    const d = s.dir;
    const horn = s.chew > 0 ? 0 : 1;
    return [
        [-d, 0, "shell"],
        [-d, -1, "shell"],
        [0, 0, "body"],
        [d * horn, -1, "body"],
    ];
}
