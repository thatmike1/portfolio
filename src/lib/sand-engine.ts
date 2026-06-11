/**
 * a tiny falling-sand cellular automaton, homage to powder-lab.
 * pure data + rules, no dom: the component owns the canvas.
 */

export const EMPTY = 0;
export const WALL = 1;
export const RASP = 2;
export const AMBER = 3;
export const INK = 4;
export const WATER = 5;

export type Material =
    | typeof EMPTY
    | typeof WALL
    | typeof RASP
    | typeof AMBER
    | typeof INK
    | typeof WATER;

/** grain shades per material; tint index picks one so a grain keeps its color while falling */
export const PALETTES: Record<number, string[]> = {
    [WALL]: [
        "oklch(0.2 0.01 357)",
        "oklch(0.23 0.01 357)",
        "oklch(0.21 0.012 357)",
        "oklch(0.24 0.01 357)",
    ],
    [RASP]: [
        "oklch(0.55 0.21 357)",
        "oklch(0.6 0.21 357)",
        "oklch(0.51 0.2 357)",
        "oklch(0.65 0.19 357)",
    ],
    [AMBER]: [
        "oklch(0.78 0.14 75)",
        "oklch(0.74 0.14 70)",
        "oklch(0.82 0.13 80)",
        "oklch(0.76 0.15 72)",
    ],
    [INK]: [
        "oklch(0.25 0.012 357)",
        "oklch(0.3 0.012 357)",
        "oklch(0.27 0.012 357)",
        "oklch(0.33 0.01 357)",
    ],
    [WATER]: [
        "oklch(0.62 0.13 250)",
        "oklch(0.66 0.12 252)",
        "oklch(0.6 0.14 248)",
        "oklch(0.68 0.11 254)",
    ],
};

const FALLERS = new Set<number>([RASP, AMBER, INK]);

export class SandEngine {
    readonly cols: number;
    readonly rows: number;
    /** material id per cell */
    cells: Uint8Array;
    /** per-grain shade index, travels with the grain */
    tint: Uint8Array;
    private frame = 0;

    constructor(cols: number, rows: number) {
        this.cols = cols;
        this.rows = rows;
        this.cells = new Uint8Array(cols * rows);
        this.tint = new Uint8Array(cols * rows);
    }

    set(x: number, y: number, m: number): void {
        if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return;
        const i = y * this.cols + x;
        this.cells[i] = m;
        this.tint[i] = (Math.random() * 4) | 0;
    }

    /** scatter material in a rough disc, sparse so pours look grainy */
    pour(cx: number, cy: number, radius: number, m: number): void {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx * dx + dy * dy > radius * radius) continue;
                // erasing and walls paint solid; powders scatter
                if (m === EMPTY || m === WALL || Math.random() < 0.55) {
                    this.set(cx + dx, cy + dy, m);
                }
            }
        }
    }

    /** one simulation tick; bottom-up scan so a grain falls one cell per frame */
    step(): void {
        this.frame++;
        const { cols, rows, cells } = this;
        const ltr = (this.frame & 1) === 0;
        for (let y = rows - 1; y >= 0; y--) {
            const row = y * cols;
            for (let xi = 0; xi < cols; xi++) {
                const x = ltr ? xi : cols - 1 - xi;
                const i = row + x;
                const m = cells[i];
                if (m === EMPTY || m === WALL) continue;
                if (m === WATER) this.stepWater(x, y, i);
                else if (FALLERS.has(m)) this.stepPowder(x, y, i);
            }
        }
    }

    private stepPowder(x: number, y: number, i: number): void {
        const { cols, rows, cells } = this;
        if (y + 1 >= rows) return;
        const below = i + cols;
        if (cells[below] === EMPTY) return this.move(i, below);
        if (cells[below] === WATER) return this.swap(i, below); // powder sinks through water
        const dir = Math.random() < 0.5 ? -1 : 1;
        for (const d of [dir, -dir]) {
            const nx = x + d;
            if (nx < 0 || nx >= cols) continue;
            const diag = below + d;
            if (cells[diag] === EMPTY) return this.move(i, diag);
            if (cells[diag] === WATER) return this.swap(i, diag);
        }
    }

    private stepWater(x: number, y: number, i: number): void {
        const { cols, rows, cells } = this;
        if (y + 1 < rows) {
            const below = i + cols;
            if (cells[below] === EMPTY) return this.move(i, below);
            const dir = Math.random() < 0.5 ? -1 : 1;
            for (const d of [dir, -dir]) {
                const nx = x + d;
                if (nx < 0 || nx >= cols) continue;
                if (cells[below + d] === EMPTY) return this.move(i, below + d);
            }
        }
        // can't fall: spread sideways
        const dir = Math.random() < 0.5 ? -1 : 1;
        for (const d of [dir, -dir]) {
            const nx = x + d;
            if (nx < 0 || nx >= cols) continue;
            if (cells[i + d] === EMPTY) return this.move(i, i + d);
        }
    }

    private move(from: number, to: number): void {
        this.cells[to] = this.cells[from];
        this.tint[to] = this.tint[from];
        this.cells[from] = EMPTY;
    }

    private swap(a: number, b: number): void {
        const cm = this.cells[a];
        const ct = this.tint[a];
        this.cells[a] = this.cells[b];
        this.tint[a] = this.tint[b];
        this.cells[b] = cm;
        this.tint[b] = ct;
    }
}

/**
 * rasterize a word into sand cells, mostly raspberry with amber flecks.
 * uses a throwaway canvas at grid resolution so one pixel = one grain.
 */
export function stampWord(engine: SandEngine, word: string, fontFamily: string): void {
    const { cols, rows } = engine;
    const c = document.createElement("canvas");
    c.width = cols;
    c.height = rows;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let size = Math.floor(rows * 0.58);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${size}px ${fontFamily}`;
    const maxWidth = cols * 0.86;
    const measured = ctx.measureText(word).width;
    if (measured > maxWidth) {
        size = Math.floor((size * maxWidth) / measured);
        ctx.font = `800 ${size}px ${fontFamily}`;
    }
    ctx.fillStyle = "#000";
    // sits a bit above center so the crumble has somewhere to go
    ctx.fillText(word, cols / 2, rows * 0.44);

    const data = ctx.getImageData(0, 0, cols, rows).data;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const alpha = data[(y * cols + x) * 4 + 3];
            if (alpha > 120) {
                engine.set(x, y, Math.random() < 0.12 ? AMBER : RASP);
            }
        }
    }
}
