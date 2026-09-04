/**
 * moss for the sand word. a seed is a grain that falls like sand; where it
 * comes to rest on damp sand it takes, and moss spreads from there over any
 * damp sand it touches, upward for preference, so it climbs the letters after
 * rain. moss is static: the grain under it is bound, rain washes nothing off
 * it, and the sand engine never moves it. pure rules over the engine's cells,
 * the component decides when to run them and draws the result.
 */

import { AMBER, EMPTY, MATERIAL, MOSS, RASP, SEED, WATER } from "./sand-engine";

export type MossWorld = {
    cols: number;
    rows: number;
    /** the sand engine's cells, written in place */
    cells: Uint8Array;
    tint: Uint8Array;
    /** per cell, 0..255: how recently water touched this grain; see dampen() */
    damp: Uint8Array;
};

/** loose or packed sand, the only ground moss takes */
export const isSand = (m: number): boolean => {
    const k = m & MATERIAL;
    return k === RASP || k === AMBER;
};

/** sand and moss beside water are soaked; the mark fades as decay() runs */
export function dampen(w: MossWorld): number {
    const { cols, rows, cells, damp } = w;
    let n = 0;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const i = y * cols + x;
            if (cells[i] !== WATER) continue;
            const around = [i - cols, i + cols, x > 0 ? i - 1 : -1, x < cols - 1 ? i + 1 : -1];
            for (const j of around) {
                if (j < 0 || j >= cells.length || (!isSand(cells[j]) && cells[j] !== MOSS)) continue;
                damp[j] = 255;
                n++;
            }
        }
    }
    return n;
}

/** dampness fades */
export function decay(w: MossWorld, by: number): void {
    const { damp } = w;
    for (let i = 0; i < damp.length; i++) if (damp[i] > 0) damp[i] = Math.max(0, damp[i] - by);
}

/**
 * a seed that has stopped falling takes where the ground is damp: on damp sand,
 * or with moss or water beside it. on dry ground it waits for rain. returns
 * how many took
 */
export function germinate(w: MossWorld): number {
    const { cols, rows, cells, tint, damp } = w;
    let n = 0;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const i = y * cols + x;
            if (cells[i] !== SEED) continue;
            const below = y + 1 < rows ? cells[i + cols] : -1;
            // still on its way down, or floating in water on its way to the floor
            if (below === EMPTY || below === WATER) continue;
            const wet =
                (isSand(below) && damp[i + cols] > 0) ||
                (x > 0 && (cells[i - 1] === MOSS || cells[i - 1] === WATER)) ||
                (x < cols - 1 && (cells[i + 1] === MOSS || cells[i + 1] === WATER)) ||
                (below === MOSS);
            if (!wet) continue;
            cells[i] = MOSS;
            tint[i] = (Math.random() * 4) | 0;
            n++;
        }
    }
    return n;
}

/**
 * moss spreads: each moss cell may claim one sand neighbour, the one above
 * twice as likely as the sides and the one below least, so a patch climbs.
 * the odds follow the wetter of the two cells: a soaked patch wicks onto dry
 * sand beside it, dry moss waits for rain. budget caps the total so a long
 * rain greens the letters but never carpets them. moss left with no neighbour
 * at all (the sand under it washed away) drops off. returns the moss count
 * after the pass
 */
export function grow(w: MossWorld, budget: number, rate: number, rng: () => number = Math.random): number {
    const { cols, rows, cells, tint, damp } = w;
    let count = 0;
    for (let i = 0; i < cells.length; i++) if (cells[i] === MOSS) count++;
    const claims: number[] = [];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const i = y * cols + x;
            if (cells[i] !== MOSS) continue;
            const up = y > 0 ? i - cols : -1;
            const down = y + 1 < rows ? i + cols : -1;
            const left = x > 0 ? i - 1 : -1;
            const right = x < cols - 1 ? i + 1 : -1;
            let held = false;
            for (const j of [up, down, left, right]) if (j >= 0 && cells[j] !== EMPTY) held = true;
            if (!held) {
                cells[i] = EMPTY;
                count--;
                continue;
            }
            if (count + claims.length >= budget) continue;
            // the roll picks the direction and the damp picks the odds
            const picks = [up, up, left, right, down];
            const j = picks[(rng() * picks.length) | 0];
            if (j < 0 || !isSand(cells[j])) continue;
            const wet = Math.max(damp[j], damp[i]);
            if (wet > 0 && rng() < rate * (wet / 255)) claims.push(j);
        }
    }
    for (const j of claims) {
        if (cells[j] === MOSS) continue;
        cells[j] = MOSS;
        tint[j] = (Math.random() * 4) | 0;
        count++;
    }
    return count;
}

/** the most spread passes preGrow() runs, and the run of empty ones it stops on */
const PRE_PASSES = 60;
const PRE_STALLS = 8;

/**
 * green the word before anyone is watching. left alone a page needs about seven
 * minutes of rain and birds to reach the mossed look, and the snail and the
 * fireflies are gated behind moss existing, so a first load starts there
 * instead. the grain that faces the sky is what rain wets and what a bird's
 * seed lands on, so that is what gets seeded, and the ordinary spread runs from
 * there until the target is met. same rules as a running page, fast-forwarded.
 * the dampness the shortcut needs is handed back the way it was found, so the
 * moss does not keep racing once the clock starts.
 *
 * @param w the world to green, written in place
 * @param target moss cells to end with, and the budget the spread runs under
 * @returns how many moss cells the word carries
 */
export function preGrow(w: MossWorld, target: number, rng: () => number = Math.random): number {
    if (target <= 0) return 0;
    const { cols, rows, cells, tint, damp } = w;
    // sand with open sky over it: where the rain lands and a seed comes to rest
    const crown: number[] = [];
    for (let y = 1; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const i = y * cols + x;
            if (isSand(cells[i]) && cells[i - cols] === EMPTY) crown.push(i);
        }
    }
    if (crown.length === 0) return 0;
    const dry = damp.slice();
    // the shower that grew this has been and gone. grow() reads damp for its odds
    for (const i of crown) damp[i] = 255;
    dampen(w);
    // seeds spaced along the crown rather than clustered, so every letter greens
    const seeds = Math.max(1, Math.ceil(target / 6));
    const step = Math.max(1, Math.floor(crown.length / seeds));
    let count = 0;
    for (let k = 0; k < crown.length && count < target; k += step) {
        cells[crown[k]] = MOSS;
        tint[crown[k]] = (rng() * 4) | 0;
        count++;
    }
    // a pass can come up empty on the roll alone, so it takes a run of them to
    // mean the moss has nowhere left to go
    let stalled = 0;
    for (let pass = 0; pass < PRE_PASSES && count < target && stalled < PRE_STALLS; pass++) {
        const next = grow(w, target, 1, rng);
        stalled = next > count ? 0 : stalled + 1;
        count = next;
    }
    damp.set(dry);
    return count;
}
