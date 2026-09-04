/**
 * snow and ice for the sand word. flakes are not cells while they fall: they
 * drift as points, slower than rain and leaning with the wind, and become a
 * snow cell where they land. snow caps whatever it lands on; a flake on water
 * freezes it, and ice creeps over the water beside it while it is snowing.
 * the sun takes both back to water. pure rules over the engine's cells.
 */

import { EMPTY, ICE, SNOW, WATER } from "./sand-engine";

export type Flake = {
    x: number;
    y: number;
    /** sway clock, radians */
    phase: number;
};

export type FrostWorld = {
    cols: number;
    rows: number;
    cells: Uint8Array;
    tint: Uint8Array;
    /** is the water in cell i standing; a flake passes falling rain and freezes only a pool */
    resting?: (i: number) => boolean;
};

/** cells a flake drops per tick, before the sway */
export const FALL = 0.11;

/**
 * one tick of falling. a flake that reaches something other than air lands:
 * on water it freezes that cell, on anything else it becomes a snow cell in
 * the air above. returns how many flakes left the world through the bottom
 * or into a cell that was already taken, water that is no longer here
 */
export function drift(flakes: Flake[], w: FrostWorld, wind: number): number {
    const { cols, rows, cells, tint } = w;
    let lost = 0;
    for (let k = flakes.length - 1; k >= 0; k--) {
        const f = flakes[k];
        f.phase += 0.045;
        f.y += FALL + Math.random() * 0.03;
        f.x += wind * 0.5 + Math.sin(f.phase) * 0.04;
        if (f.x < 0) f.x += cols;
        else if (f.x >= cols) f.x -= cols;
        const x = f.x | 0;
        const y = f.y | 0;
        if (y >= rows - 1) {
            flakes.splice(k, 1);
            lost++;
            continue;
        }
        const bi = (y + 1) * cols + x;
        const below = cells[bi];
        if (below === EMPTY) continue;
        if (below === WATER && w.resting && !w.resting(bi)) continue;
        flakes.splice(k, 1);
        if (below === WATER) {
            cells[bi] = ICE;
            tint[bi] = (Math.random() * 4) | 0;
        } else if (cells[y * cols + x] === EMPTY) {
            cells[y * cols + x] = SNOW;
            tint[y * cols + x] = (Math.random() * 4) | 0;
        } else lost++;
    }
    return lost;
}

/**
 * ice creeps: each ice cell may take the water beside it, and now and then
 * the water under it, so a lake skins over from where the flakes hit and
 * thickens slowly. returns how many cells froze
 */
export function freeze(w: FrostWorld, odds: number, rng: () => number = Math.random): number {
    const { cols, rows, cells, tint } = w;
    let n = 0;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const i = y * cols + x;
            if (cells[i] !== ICE) continue;
            const side = x + (rng() < 0.5 ? -1 : 1);
            const j = rng() < 0.15 && y + 1 < rows ? i + cols : side >= 0 && side < cols ? y * cols + side : -1;
            if (j < 0 || cells[j] !== WATER || rng() >= odds) continue;
            cells[j] = ICE;
            tint[j] = (Math.random() * 4) | 0;
            n++;
        }
    }
    return n;
}

/**
 * the sun takes snow and ice back to water, from the exposed face in: a cell
 * with air over it, or beside it, melts; a buried one waits. returns how many
 * cells melted
 */
export function thaw(w: FrostWorld, odds: number, rng: () => number = Math.random): number {
    const { cols, rows, cells, tint } = w;
    let n = 0;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const i = y * cols + x;
            const m = cells[i];
            if (m !== SNOW && m !== ICE) continue;
            const open =
                (y > 0 && cells[i - cols] === EMPTY) ||
                (x > 0 && cells[i - 1] === EMPTY) ||
                (x < cols - 1 && cells[i + 1] === EMPTY);
            if (!open || rng() >= odds) continue;
            cells[i] = WATER;
            tint[i] = (Math.random() * 4) | 0;
            n++;
        }
    }
    return n;
}
