import { useEffect, useRef, useState } from "react";
import {
    AMBER,
    EMPTY,
    INK,
    PALETTES,
    RASP,
    SandEngine,
    WALL,
    WATER,
    stampWord,
} from "../lib/sand-engine";
import type { ThemeName } from "../lib/sand-engine";

const CELL = 5; // css pixels per grain
/** blur radius in GRAIN units — the old css `blur(10px)` was two grains wide */
const GLOW_RADIUS = 2;
const FONT_STACK = "'Sora Variable', system-ui, sans-serif";

const TOOL_DEFS: Array<{ id: number; label: string }> = [
    { id: RASP, label: "raspberry" },
    { id: AMBER, label: "amber" },
    { id: WATER, label: "water" },
    { id: WALL, label: "wall" },
    { id: EMPTY, label: "erase" },
];

/** pixel-art sky bodies; 1 = body, 2 = detail (ray / crater) */
const SUN = [
    "....2....",
    ".2.....2.",
    "...111...",
    "..11111..",
    "2.11111.2",
    "..11111..",
    "...111...",
    ".2.....2.",
    "....2....",
];
const MOON = [
    "...1111..",
    "..11111..",
    ".1112....",
    ".111.....",
    ".1121....",
    ".111.....",
    ".1111....",
    "..11121..",
    "...1111..",
];
const SKY_COLORS: Record<ThemeName, Record<string, string>> = {
    light: { "1": "oklch(0.82 0.15 80)", "2": "oklch(0.86 0.13 85)" },
    dark: { "1": "oklch(0.92 0.02 90)", "2": "oklch(0.78 0.03 90)" },
};

type Star = { x: number; y: number; base: number; phase: number };

/**
 * resolve any css color string to a packed abgr uint32, the byte order a
 * little-endian Uint32Array view over ImageData wants. the browser does the
 * oklch conversion for us — cheap, and it happens once per palette build.
 */
function packColor(scratch: CanvasRenderingContext2D, css: string, alpha = 1): number {
    scratch.clearRect(0, 0, 1, 1);
    scratch.globalAlpha = alpha;
    scratch.fillStyle = css;
    scratch.fillRect(0, 0, 1, 1);
    scratch.globalAlpha = 1;
    const [r, g, b, a] = scratch.getImageData(0, 0, 1, 1).data;
    return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

/**
 * the hero toy: "mike" written in sand, frozen until the visitor touches it.
 * the engine is imperative; react only owns the chrome around it.
 * dark mode adds stars, a pixel moon, and a blurred glow pass of the grains.
 */
export function SandHero() {
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const glowRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<SandEngine | null>(null);
    const starsRef = useRef<Array<Star>>([]);
    const rafRef = useRef(0);
    const frameRef = useRef(0);
    const awakeRef = useRef(false);
    const visibleRef = useRef(true);
    const toolRef = useRef<number>(RASP);
    const reducedRef = useRef(false);
    const themeRef = useRef<ThemeName>("light");
    const renderRef = useRef<() => void>(() => undefined);
    const spillRef = useRef<(clientX: number, clientY: number) => void>(() => undefined);
    const toggleRef = useRef<HTMLButtonElement>(null);

    const [awake, setAwake] = useState(false);
    const [tool, setTool] = useState<number>(RASP);
    const [theme, setTheme] = useState<ThemeName>("light");
    toolRef.current = tool;

    useEffect(() => {
        const wrap = wrapRef.current;
        const canvas = canvasRef.current;
        const glow = glowRef.current;
        if (!wrap || !canvas || !glow) return;
        const ctx = canvas.getContext("2d");
        const glowCtx = glow.getContext("2d");
        if (!ctx || !glowCtx) return;

        // the inline head script set this before first paint
        const initial = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
        themeRef.current = initial;
        setTheme(initial);

        reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const grain = Math.max(2, Math.round(CELL * dpr));

        // everything is composed at GRID resolution — one buffer pixel per grain —
        // and upscaled once with smoothing off. the old path issued a fillRect per
        // grain per frame, which at ~20k grains is ~20k canvas state changes; this
        // is one putImageData and one drawImage. same output, and the win is
        // largest in firefox, where each fillRect crosses into the c++ canvas
        // implementation rather than being batched the way skia batches them.
        const src = document.createElement("canvas");
        const srcCtx = src.getContext("2d");
        // 1×1 scratch used only to let the browser resolve oklch strings to bytes
        const swatch = document.createElement("canvas");
        swatch.width = 1;
        swatch.height = 1;
        const swatchCtx = swatch.getContext("2d", { willReadFrequently: true });
        if (!srcCtx || !swatchCtx) return;

        let buf = new Uint32Array(0);
        let image = new ImageData(1, 1);
        /** packed grain colors: packed[material][tint] */
        let packed: Record<number, Array<number>> = {};
        let packedSky: Record<string, number> = {};
        /** star alpha is quantised to 16 steps so twinkling reuses packed colors */
        let packedStar: Array<number> = [];

        let paletteMode: ThemeName | null = null;

        const buildPalette = (mode: ThemeName) => {
            paletteMode = mode;
            packed = {};
            for (const [material, shades] of Object.entries(PALETTES[mode])) {
                packed[Number(material)] = shades.map((c) => packColor(swatchCtx, c));
            }
            packedSky = {};
            for (const [key, css] of Object.entries(SKY_COLORS[mode])) {
                packedSky[key] = packColor(swatchCtx, css);
            }
            packedStar = Array.from({ length: 16 }, (_, i) =>
                packColor(swatchCtx, "oklch(0.92 0.015 90)", (i + 1) / 16)
            );
        };

        const drawSky = (mode: ThemeName, cols: number, rows: number) => {
            if (mode === "dark") {
                // stars twinkle only while the simulation is running
                for (const s of starsRef.current) {
                    const a = awakeRef.current
                        ? s.base + Math.sin(frameRef.current * 0.05 + s.phase) * 0.25
                        : s.base;
                    const step = Math.max(0, Math.min(15, Math.round(a * 16) - 1));
                    buf[s.y * cols + s.x] = packedStar[step];
                }
            }
            const map = mode === "dark" ? MOON : SUN;
            const px = 2; // grains per pixel-art pixel
            const w = map[0].length * px;
            const bx = Math.max(2, Math.min(Math.round(cols * 0.8), cols - w - 2));
            const by = Math.max(2, Math.round(rows * 0.1));
            for (let my = 0; my < map.length; my++) {
                for (let mx = 0; mx < map[my].length; mx++) {
                    const ch = map[my][mx];
                    if (ch === ".") continue;
                    const color = packedSky[ch];
                    for (let dy = 0; dy < px; dy++) {
                        const y = by + my * px + dy;
                        if (y < 0 || y >= rows) continue;
                        const row = y * cols;
                        for (let dx = 0; dx < px; dx++) {
                            const x = bx + mx * px + dx;
                            if (x < 0 || x >= cols) continue;
                            buf[row + x] = color;
                        }
                    }
                }
            }
        };

        const render = () => {
            const engine = engineRef.current;
            if (!engine) return;
            const mode = themeRef.current;
            if (mode !== paletteMode) buildPalette(mode);
            const { cols, rows, cells, tint } = engine;

            buf.fill(0);
            drawSky(mode, cols, rows);
            for (let i = 0; i < cells.length; i++) {
                const m = cells[i];
                if (m === EMPTY) continue;
                buf[i] = packed[m][tint[i] & 3];
            }
            srcCtx.putImageData(image, 0, 0);

            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(src, 0, 0, canvas.width, canvas.height);

            // glow pass: blur in SOURCE space, then let the upscale spread it. a
            // css blur on the full-size glow canvas costs radius work per device
            // pixel; blurring cols×rows first is ~grain² fewer pixels for the
            // same look, and firefox runs canvas blur on the cpu, so the
            // reduction is the difference between smooth and not.
            glowCtx.clearRect(0, 0, glow.width, glow.height);
            if (mode === "dark") {
                glowCtx.filter = `blur(${GLOW_RADIUS}px)`;
                glowCtx.drawImage(src, 0, 0);
                glowCtx.filter = "none";
            }
        };
        renderRef.current = render;

        const loop = () => {
            const engine = engineRef.current;
            if (!engine || !awakeRef.current || !visibleRef.current) return;
            frameRef.current++;
            engine.step();
            render();
            rafRef.current = requestAnimationFrame(loop);
        };

        const wake = () => {
            if (awakeRef.current || reducedRef.current) return;
            awakeRef.current = true;
            setAwake(true);
            rafRef.current = requestAnimationFrame(loop);
        };

        const build = () => {
            const rect = wrap.getBoundingClientRect();
            const cols = Math.max(40, Math.floor((rect.width * dpr) / grain));
            const rows = Math.max(30, Math.floor((rect.height * dpr) / grain));
            canvas.width = cols * grain;
            canvas.height = rows * grain;
            // the glow canvas keeps its small backing store and is stretched by
            // css, so the blur above is the only blur anyone pays for
            glow.width = cols;
            glow.height = rows;
            src.width = cols;
            src.height = rows;
            image = new ImageData(cols, rows);
            buf = new Uint32Array(image.data.buffer);
            buildPalette(themeRef.current);
            const engine = new SandEngine(cols, rows);
            engineRef.current = engine;
            const starCount = Math.min(90, Math.floor((cols * rows) / 350));
            starsRef.current = Array.from({ length: starCount }, () => ({
                x: Math.floor(Math.random() * cols),
                y: Math.floor(Math.random() * rows * 0.85),
                base: 0.3 + Math.random() * 0.55,
                phase: Math.random() * Math.PI * 2,
            }));
            // the variable font may still be loading on first paint; stamp after it settles
            document.fonts.ready
                .catch(() => undefined)
                .then(() => {
                    stampWord(engine, "mike", FONT_STACK);
                    render();
                });
            stampWord(engine, "mike", FONT_STACK);
            render();
        };

        const cellFromEvent = (e: PointerEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor(((e.clientX - rect.left) / rect.width) * (canvas.width / grain));
            const y = Math.floor(((e.clientY - rect.top) / rect.height) * (canvas.height / grain));
            return { x, y };
        };

        const pour = (e: PointerEvent) => {
            const engine = engineRef.current;
            if (!engine) return;
            const { x, y } = cellFromEvent(e);
            engine.pour(x, y, toolRef.current === EMPTY ? 6 : 4, toolRef.current);
            if (reducedRef.current || !awakeRef.current) render();
        };

        /**
         * drop a burst of grains into the toy from a point in page space. the
         * theme toggle uses it so flipping the lights spills sun dust or moon
         * dust out of the button instead of just recoloring the page.
         */
        const spill = (clientX: number, clientY: number) => {
            const engine = engineRef.current;
            if (!engine) return;
            const rect = canvas.getBoundingClientRect();
            const x = Math.round(((clientX - rect.left) / rect.width) * (canvas.width / grain));
            const y = Math.round(((clientY - rect.top) / rect.height) * (canvas.height / grain));
            engine.pour(x, y, 5, themeRef.current === "dark" ? INK : AMBER);
            wake();
            if (reducedRef.current || !awakeRef.current) render();
        };
        spillRef.current = spill;

        const onPointerMove = (e: PointerEvent) => {
            wake();
            if (e.buttons & 1) pour(e);
        };
        const onPointerDown = (e: PointerEvent) => {
            if (e.button !== 0) return;
            wake();
            pour(e);
        };

        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("pointerdown", onPointerDown);

        // don't burn frames while scrolled away
        const io = new IntersectionObserver(([entry]) => {
            visibleRef.current = entry.isIntersecting;
            if (entry.isIntersecting && awakeRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = requestAnimationFrame(loop);
            }
        });
        io.observe(wrap);

        let resizeTimer = 0;
        const ro = new ResizeObserver(() => {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(build, 150);
        });
        ro.observe(wrap);

        build();

        const resetListener = () => {
            cancelAnimationFrame(rafRef.current);
            awakeRef.current = false;
            setAwake(false);
            build();
        };
        wrap.addEventListener("sand-reset", resetListener);

        return () => {
            cancelAnimationFrame(rafRef.current);
            window.clearTimeout(resizeTimer);
            canvas.removeEventListener("pointermove", onPointerMove);
            canvas.removeEventListener("pointerdown", onPointerDown);
            wrap.removeEventListener("sand-reset", resetListener);
            io.disconnect();
            ro.disconnect();
        };
    }, []);

    const flipTheme = () => {
        const next: ThemeName = themeRef.current === "dark" ? "light" : "dark";
        themeRef.current = next;
        setTheme(next);
        document.documentElement.dataset.theme = next;
        try {
            localStorage.setItem("theme", next);
        } catch {
            // private mode etc., the toggle still works for this visit
        }
        renderRef.current();
        const rect = toggleRef.current?.getBoundingClientRect();
        // pour from just under the button, so the grains look like they fell out of it
        if (rect) spillRef.current(rect.left + rect.width / 2, rect.bottom + 6);
    };

    return (
        <div className="sand-hero" ref={wrapRef}>
            <canvas ref={glowRef} className="sand-glow" aria-hidden="true" />
            <canvas
                ref={canvasRef}
                className="sand-canvas"
                role="img"
                aria-label="a falling-sand toy with the word mike written in raspberry sand"
            />
            <button
                ref={toggleRef}
                type="button"
                className="theme-toggle"
                onClick={flipTheme}
                aria-label={theme === "dark" ? "switch to light mode" : "switch to dark mode"}
            >
                {theme === "dark" ? "lights on" : "lights off"}
            </button>
            <p className="sand-hint" aria-hidden="true" data-awake={awake}>
                touch the sand
            </p>
            <div className="sand-tools" role="toolbar" aria-label="sand materials">
                {TOOL_DEFS.map((t) => (
                    <button
                        key={t.label}
                        type="button"
                        className="sand-tool"
                        aria-pressed={tool === t.id}
                        onClick={() => setTool(t.id)}
                    >
                        {t.id === EMPTY ? (
                            <span className="sand-swatch sand-swatch-erase" />
                        ) : (
                            <span
                                className="sand-swatch"
                                style={{ background: PALETTES[theme][t.id][0] }}
                            />
                        )}
                        {t.label}
                    </button>
                ))}
                <button
                    type="button"
                    className="sand-tool sand-reset"
                    onClick={() => wrapRef.current?.dispatchEvent(new Event("sand-reset"))}
                >
                    reset sand
                </button>
            </div>
        </div>
    );
}
