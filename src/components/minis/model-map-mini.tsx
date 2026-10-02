import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { POINTS, SNAPSHOT_DATE, VENDOR_COLOR, VERSION } from "./model-map-data";
import "./model-map-mini.css";

/**
 * the frontier chart from the model map, small: every current model at every
 * reasoning effort, intelligence against what one benchmark task costs. pointing at a
 * dot lights up the same model's other efforts, which is the whole argument of the
 * map in one gesture: the effort dial moves the cost more than the model choice does.
 */

type Point = {
    key: string;
    model: string;
    vendor: string;
    effort: string;
    intel: number;
    cost: number;
    tokens: number;
};

const EFFORT_ORDER = ["off", "low", "medium", "high", "xhigh", "max"];

const DATA: Point[] = POINTS.map(([model, vendor, effort, intel, cost, tokens]) => ({
    key: `${model}·${effort}`,
    model,
    vendor,
    effort,
    intel,
    cost,
    tokens,
}));

const BY_COST = DATA.slice().sort((a, b) => a.cost - b.cost);

/** the best score reachable at or below each cost: nothing in the set beats these on both axes */
const FRONTIER = (() => {
    const out: Point[] = [];
    let best = -Infinity;
    for (const p of BY_COST) {
        if (p.intel > best) {
            best = p.intel;
            out.push(p);
        }
    }
    return out;
})();
const ON_FRONTIER = new Set(FRONTIER.map((p) => p.key));

const family = (p: Point) =>
    DATA.filter((q) => q.model === p.model).sort(
        (a, b) => EFFORT_ORDER.indexOf(a.effort) - EFFORT_ORDER.indexOf(b.effort),
    );

const shortName = (model: string) => model.replace(/^Claude /, "");
const money = (v: number) => (v < 0.1 ? `$${v.toFixed(3)}` : `$${v.toFixed(2)}`);
const named = (p: Point) => `${shortName(p.model)}${p.effort ? ` ${p.effort}` : ""}`;

const X_LO = Math.log10(0.003);
const X_HI = Math.log10(11);
const Y_LO = 15;
const Y_HI = 60;
const PAD = { l: 34, r: 14, t: 14, b: 26 };

const VENDORS = [...new Set(DATA.map((p) => p.vendor))];
const START = DATA.find((p) => p.model === "Claude Opus 5.5" && p.effort === "high") ?? DATA[0];

export default function ModelMapMini() {
    const box = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ w: 560, h: 340 });
    const [active, setActive] = useState<Point>(START);

    useEffect(() => {
        const node = box.current;
        if (!node) return;
        const measure = () => {
            const w = node.clientWidth;
            setSize({ w, h: Math.round(Math.max(240, Math.min(420, w * 0.62))) });
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    const { w, h } = size;
    const X = (cost: number) =>
        PAD.l + ((Math.log10(cost) - X_LO) / (X_HI - X_LO)) * (w - PAD.l - PAD.r);
    const Y = (intel: number) => PAD.t + (1 - (intel - Y_LO) / (Y_HI - Y_LO)) * (h - PAD.t - PAD.b);

    const frontierPath = FRONTIER.map((p, i) => {
        const px = X(p.cost).toFixed(1);
        const py = Y(p.intel).toFixed(1);
        return i ? `H${px}V${py}` : `M${px},${py}`;
    }).join("");

    const ladder = family(active);
    const lo = ladder[0];
    const hi = ladder[ladder.length - 1];
    const ladderPath = ladder
        .map((p, i) => `${i ? "L" : "M"}${X(p.cost).toFixed(1)},${Y(p.intel).toFixed(1)}`)
        .join("");

    // label the ends of the effort ladder and the lit dot, and nudge a label down a line
    // when it would sit on top of the one before it
    const labelled: { p: Point; x: number; y: number; right: boolean }[] = [];
    for (const p of ladder) {
        if (p !== lo && p !== hi && p.key !== active.key) continue;
        const right = X(p.cost) < w - 80;
        const x = X(p.cost) + (right ? 11 : -11);
        let y = Y(p.intel) + 3.5;
        for (const other of labelled) {
            if (Math.abs(other.x - x) < 70 && Math.abs(other.y - y) < 12) y = other.y + 13;
        }
        labelled.push({ p, x, y, right });
    }

    const pickNearest = (event: PointerEvent<HTMLDivElement>) => {
        const rect = box.current?.getBoundingClientRect();
        if (!rect) return;
        const px = event.clientX - rect.left;
        const py = event.clientY - rect.top;
        let best: Point | null = null;
        let bestD = event.pointerType === "touch" ? 44 ** 2 : 30 ** 2;
        for (const p of DATA) {
            const d = (X(p.cost) - px) ** 2 + (Y(p.intel) - py) ** 2;
            if (d < bestD) {
                bestD = d;
                best = p;
            }
        }
        if (best && best.key !== active.key) setActive(best);
    };

    const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
        let next: Point | undefined;
        const i = BY_COST.findIndex((p) => p.key === active.key);
        const j = ladder.findIndex((p) => p.key === active.key);
        if (event.key === "ArrowRight") next = BY_COST[Math.min(BY_COST.length - 1, i + 1)];
        if (event.key === "ArrowLeft") next = BY_COST[Math.max(0, i - 1)];
        if (event.key === "ArrowUp") next = ladder[Math.min(ladder.length - 1, j + 1)];
        if (event.key === "ArrowDown") next = ladder[Math.max(0, j - 1)];
        if (event.key === "Home") next = BY_COST[0];
        if (event.key === "End") next = BY_COST[BY_COST.length - 1];
        if (!next) return;
        event.preventDefault();
        setActive(next);
    };

    const beatenBy = ON_FRONTIER.has(active.key)
        ? null
        : DATA.filter((p) => p.cost <= active.cost && p.intel > active.intel).sort(
              (a, b) => b.intel - a.intel || a.cost - b.cost,
          )[0];

    const xTicks = [0.01, 0.1, 1, 10];
    const yTicks = [20, 30, 40, 50, 60];

    return (
        <div className="mm-mini">
            <div className="mm-readout" aria-live="polite">
                <p className="mm-name">
                    <span className="mm-dot" style={{ background: VENDOR_COLOR[active.vendor] }} />
                    {shortName(active.model)}
                    {active.effort ? <span className="mm-effort">{active.effort}</span> : null}
                </p>
                <p className="mm-figures">
                    <strong>{active.intel.toFixed(1)}</strong> intel for{" "}
                    <strong>{money(active.cost)}</strong> a benchmark task ·{" "}
                    {active.tokens.toFixed(0)}k output tokens
                </p>
                <p className="mm-verdict">
                    {ladder.length > 1 ? (
                        <>
                            the same model from {lo.effort} to {hi.effort}: {money(lo.cost)} →{" "}
                            {money(hi.cost)} a task.{" "}
                        </>
                    ) : null}
                    {beatenBy ? (
                        <>
                            off the frontier: {named(beatenBy)} scores {beatenBy.intel.toFixed(1)} for{" "}
                            {money(beatenBy.cost)}.
                        </>
                    ) : (
                        <>on the frontier: nothing cheaper scores higher.</>
                    )}
                </p>
            </div>

            <div
                className="mm-chart"
                ref={box}
                style={{ height: h }}
                tabIndex={0}
                role="application"
                aria-roledescription="chart"
                aria-label="intelligence against cost per task. arrow keys walk the points: left and right by cost, up and down through the same model's efforts"
                onPointerMove={pickNearest}
                onPointerDown={pickNearest}
                onKeyDown={onKey}
            >
                <svg width={w} height={h} aria-hidden="true">
                    <g className="mm-grid">
                        {xTicks.map((t) => (
                            <line key={t} x1={X(t)} x2={X(t)} y1={PAD.t} y2={h - PAD.b} />
                        ))}
                        {yTicks.map((t) => (
                            <line key={t} x1={PAD.l} x2={w - PAD.r} y1={Y(t)} y2={Y(t)} />
                        ))}
                    </g>
                    <g className="mm-axis">
                        {xTicks.map((t) => (
                            <text key={t} x={X(t)} y={h - PAD.b + 16} textAnchor="middle">
                                ${t}
                            </text>
                        ))}
                        {yTicks.map((t) => (
                            <text key={t} x={PAD.l - 8} y={Y(t) + 3.5} textAnchor="end">
                                {t}
                            </text>
                        ))}
                    </g>
                    <path className="mm-frontier" d={frontierPath} />
                    <g>
                        {DATA.map((p) => (
                            <circle
                                key={p.key}
                                className={`mm-pt${p.model === active.model ? " is-kin" : ""}`}
                                cx={X(p.cost)}
                                cy={Y(p.intel)}
                                r={p.model === active.model ? 5 : 4}
                                fill={VENDOR_COLOR[p.vendor] ?? "#999"}
                            />
                        ))}
                    </g>
                    {ladder.length > 1 ? (
                        <path
                            className="mm-ladder"
                            d={ladderPath}
                            stroke={VENDOR_COLOR[active.vendor]}
                        />
                    ) : null}
                    {labelled.map(({ p, x, y, right }) => (
                        <text
                            key={p.key}
                            className={`mm-ladder-label${p.key === active.key ? " is-active" : ""}`}
                            x={x}
                            y={y}
                            textAnchor={right ? "start" : "end"}
                        >
                            {p.effort || shortName(p.model)}
                        </text>
                    ))}
                    {/* positioned by transform rather than cx/cy so css can glide it between dots */}
                    <circle
                        className="mm-active"
                        cx={0}
                        cy={0}
                        r={8.5}
                        style={{ transform: `translate(${X(active.cost).toFixed(1)}px, ${Y(active.intel).toFixed(1)}px)` }}
                    />
                </svg>
            </div>
            <div className="mm-foot">
                <p className="mm-legend" aria-hidden="true">
                    {VENDORS.map((v) => (
                        <span key={v}>
                            <i style={{ background: VENDOR_COLOR[v] }} />
                            {v}
                        </span>
                    ))}
                </p>
                <p className="mm-source">
                    x: $ per benchmark task, log · y: intelligence index v{VERSION} · dashed: the frontier ·{" "}
                    {DATA.length} current operating points, snapshot {SNAPSHOT_DATE}
                </p>
            </div>
        </div>
    );
}
