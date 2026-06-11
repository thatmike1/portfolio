import { useEffect, useRef, useState } from "react";
import {
    AMBER,
    EMPTY,
    PALETTES,
    RASP,
    SandEngine,
    WALL,
    WATER,
    stampWord,
} from "../lib/sand-engine";
import type { ThemeName } from "../lib/sand-engine";

const CELL = 5; // css pixels per grain
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

        const drawSky = (mode: ThemeName) => {
            const engine = engineRef.current;
            if (!engine) return;
            const { cols, rows } = engine;
            if (mode === "dark") {
                // stars twinkle only while the simulation is running
                for (const s of starsRef.current) {
                    const a = awakeRef.current
                        ? s.base + Math.sin(frameRef.current * 0.05 + s.phase) * 0.25
                        : s.base;
                    ctx.fillStyle = `oklch(0.92 0.015 90 / ${Math.max(0.15, Math.min(1, a))})`;
                    ctx.fillRect(s.x * grain, s.y * grain, grain, grain);
                }
            }
            const map = mode === "dark" ? MOON : SUN;
            const colors = SKY_COLORS[mode];
            const px = 2; // grains per pixel-art pixel
            const w = map[0].length * px;
            const bx = Math.max(2, Math.min(Math.round(cols * 0.8), cols - w - 2));
            const by = Math.max(2, Math.round(rows * 0.1));
            for (let my = 0; my < map.length; my++) {
                for (let mx = 0; mx < map[my].length; mx++) {
                    const ch = map[my][mx];
                    if (ch === ".") continue;
                    ctx.fillStyle = colors[ch];
                    ctx.fillRect(
                        (bx + mx * px) * grain,
                        (by + my * px) * grain,
                        px * grain,
                        px * grain
                    );
                }
            }
        };

        const render = () => {
            const engine = engineRef.current;
            if (!engine) return;
            const mode = themeRef.current;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawSky(mode);
            const { cols, rows, cells, tint } = engine;
            const palette = PALETTES[mode];
            for (let y = 0; y < rows; y++) {
                const row = y * cols;
                for (let x = 0; x < cols; x++) {
                    const m = cells[row + x];
                    if (m === EMPTY) continue;
                    ctx.fillStyle = palette[m][tint[row + x] & 3];
                    ctx.fillRect(x * grain, y * grain, grain, grain);
                }
            }
            // glow pass: the blurred copy is the lighting, css does the blur on gpu
            glowCtx.clearRect(0, 0, glow.width, glow.height);
            if (mode === "dark") glowCtx.drawImage(canvas, 0, 0);
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
            glow.width = cols * grain;
            glow.height = rows * grain;
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
