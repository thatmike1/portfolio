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

const CELL = 5; // css pixels per grain
const FONT_STACK = "'Sora Variable', system-ui, sans-serif";

const TOOLS: Array<{ id: number; label: string; swatch?: string }> = [
    { id: RASP, label: "raspberry", swatch: PALETTES[RASP][0] },
    { id: AMBER, label: "amber", swatch: PALETTES[AMBER][0] },
    { id: WATER, label: "water", swatch: PALETTES[WATER][0] },
    { id: WALL, label: "wall", swatch: PALETTES[WALL][0] },
    { id: EMPTY, label: "erase" },
];

/**
 * the hero toy: "mike" written in sand, frozen until the visitor touches it.
 * the engine is imperative; react only owns the chrome around it.
 */
export function SandHero() {
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<SandEngine | null>(null);
    const rafRef = useRef(0);
    const awakeRef = useRef(false);
    const visibleRef = useRef(true);
    const toolRef = useRef<number>(RASP);
    const reducedRef = useRef(false);

    const [awake, setAwake] = useState(false);
    const [tool, setTool] = useState<number>(RASP);
    toolRef.current = tool;

    useEffect(() => {
        const wrap = wrapRef.current;
        const canvas = canvasRef.current;
        if (!wrap || !canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const grain = Math.max(2, Math.round(CELL * dpr));

        const render = () => {
            const engine = engineRef.current;
            if (!engine) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const { cols, rows, cells, tint } = engine;
            for (let y = 0; y < rows; y++) {
                const row = y * cols;
                for (let x = 0; x < cols; x++) {
                    const m = cells[row + x];
                    if (m === EMPTY) continue;
                    const shades = PALETTES[m];
                    ctx.fillStyle = shades[tint[row + x] & 3];
                    ctx.fillRect(x * grain, y * grain, grain, grain);
                }
            }
        };

        const loop = () => {
            const engine = engineRef.current;
            if (!engine || !awakeRef.current || !visibleRef.current) return;
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
            const engine = new SandEngine(cols, rows);
            engineRef.current = engine;
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

    return (
        <div className="sand-hero" ref={wrapRef}>
            <canvas
                ref={canvasRef}
                className="sand-canvas"
                role="img"
                aria-label="a falling-sand toy with the word mike written in raspberry sand"
            />
            <p className="sand-hint" aria-hidden="true" data-awake={awake}>
                touch the sand
            </p>
            <div className="sand-tools" role="toolbar" aria-label="sand materials">
                {TOOLS.map((t) => (
                    <button
                        key={t.label}
                        type="button"
                        className="sand-tool"
                        aria-pressed={tool === t.id}
                        onClick={() => setTool(t.id)}
                    >
                        {t.swatch ? (
                            <span className="sand-swatch" style={{ background: t.swatch }} />
                        ) : (
                            <span className="sand-swatch sand-swatch-erase" />
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
