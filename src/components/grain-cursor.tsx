import { useEffect } from "react";
import { PALETTES, RASP } from "../lib/sand-engine";
import type { ThemeName } from "../lib/sand-engine";

/** css pixels the pointer must travel before another grain is shed */
const SPACING = 20;
const MAX_GRAINS = 90;
const GRAIN = 3; // css px per grain, square like the ones in the toy
const GRAVITY = 0.34;
const LIFE = 52; // frames

type Grain = { x: number; y: number; vx: number; vy: number; life: number; shade: number };

/**
 * the pointer sheds sand. a fixed, pointer-events-none canvas over the page
 * spawns a raspberry grain every ~20px of travel and lets it fall and fade,
 * so the falling-sand idea in the hero follows the visitor down the page.
 *
 * the native cursor is never hidden — this is additive only. skipped entirely
 * on coarse pointers and under prefers-reduced-motion, where grains that fall
 * on their own have no honest still equivalent.
 */
export function GrainCursor() {
    useEffect(() => {
        const fine = window.matchMedia("(pointer: fine)");
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (!fine.matches || reduced.matches) return;

        const canvas = document.createElement("canvas");
        canvas.className = "grain-cursor";
        canvas.setAttribute("aria-hidden", "true");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        document.body.appendChild(canvas);

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const resize = () => {
            canvas.width = Math.floor(window.innerWidth * dpr);
            canvas.height = Math.floor(window.innerHeight * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();

        const grains: Array<Grain> = [];
        let last: { x: number; y: number } | null = null;
        let carried = 0;
        let raf = 0;

        const shades = () => {
            const mode: ThemeName =
                document.documentElement.dataset.theme === "dark" ? "dark" : "light";
            return PALETTES[mode][RASP];
        };
        let palette = shades();

        const frame = () => {
            raf = 0;
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            for (let i = grains.length - 1; i >= 0; i--) {
                const g = grains[i];
                g.vy += GRAVITY;
                g.vx *= 0.98;
                g.x += g.vx;
                g.y += g.vy;
                g.life--;
                if (g.life <= 0 || g.y > window.innerHeight + GRAIN) {
                    grains.splice(i, 1);
                    continue;
                }
                ctx.globalAlpha = Math.min(1, g.life / 14) * 0.85;
                ctx.fillStyle = palette[g.shade];
                ctx.fillRect(Math.round(g.x), Math.round(g.y), GRAIN, GRAIN);
            }
            ctx.globalAlpha = 1;
            if (grains.length) raf = requestAnimationFrame(frame);
        };

        const onMove = (e: PointerEvent) => {
            if (e.pointerType !== "mouse") return;
            const point = { x: e.clientX, y: e.clientY };
            if (!last) {
                last = point;
                return;
            }
            const dx = point.x - last.x;
            const dy = point.y - last.y;
            carried += Math.hypot(dx, dy);
            last = point;
            if (carried < SPACING) return;
            // fast strokes shed a couple of grains, but never a stream
            const count = Math.min(2, Math.floor(carried / SPACING));
            carried = 0;
            for (let i = 0; i < count; i++) {
                if (grains.length >= MAX_GRAINS) grains.shift();
                grains.push({
                    x: point.x + (Math.random() - 0.5) * 6,
                    y: point.y + (Math.random() - 0.5) * 6,
                    vx: dx * 0.06 + (Math.random() - 0.5) * 0.5,
                    vy: dy * 0.04,
                    life: LIFE - Math.floor(Math.random() * 14),
                    shade: (Math.random() * palette.length) | 0,
                });
            }
            if (!raf) raf = requestAnimationFrame(frame);
        };

        const onLeave = () => {
            last = null;
            carried = 0;
        };

        const onHidden = () => {
            if (!document.hidden) return;
            grains.length = 0;
            cancelAnimationFrame(raf);
            raf = 0;
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        };

        // the theme toggle changes which raspberry the grains are made of
        const themeWatch = new MutationObserver(() => {
            palette = shades();
        });
        themeWatch.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme"],
        });

        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("resize", resize);
        document.addEventListener("pointerleave", onLeave);
        document.addEventListener("visibilitychange", onHidden);

        return () => {
            cancelAnimationFrame(raf);
            themeWatch.disconnect();
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("resize", resize);
            document.removeEventListener("pointerleave", onLeave);
            document.removeEventListener("visibilitychange", onHidden);
            canvas.remove();
        };
    }, []);

    return null;
}
