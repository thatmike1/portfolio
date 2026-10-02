import { useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import "./tally-mini.css";

/**
 * tally's question in miniature: the meter says 59%, so what ate it? three invented
 * agent sessions share a synthetic five-hour block. the chart stacks each session's
 * cumulative share, so the band thickness at "now" is the answer, and scrubbing back
 * through the block shows who was running when the meter moved.
 */

type Session = {
    id: "a" | "b" | "c";
    title: string;
    model: string;
    tokens: string;
    /** meter points this session moved, per five-minute sample since the block opened */
    steps: number[];
};

/** the same invented morning the screenshot beside this toy shows: a block since 09:00, now 11:30 */
const SESSIONS: Session[] = [
    {
        id: "a",
        title: "keep the cart and coupon when a card is declined",
        model: "opus 5.5 · xhigh",
        tokens: "20.2M tokens · 206 requests",
        steps: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 2, 2, 1, 2, 2, 1, 1, 1, 0],
    },
    {
        id: "b",
        title: "port settings to the new form components",
        model: "fable 5.1 · medium",
        tokens: "4.2M tokens · 56 requests",
        steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 1, 2, 1, 1, 1, 1, 1],
    },
    {
        id: "c",
        title: "map tiles go blank on a fast zoom-out",
        model: "opus 5.5 · high",
        tokens: "7.4M tokens · 76 requests",
        steps: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
];

const BLOCK_START = 9 * 60;
const BLOCK_MINUTES = 300;
const STEP_MINUTES = 5;
const SAMPLES = SESSIONS[0].steps.length;
const NOW_MINUTES = SAMPLES * STEP_MINUTES;

const clock = (minutesIntoBlock: number) => {
    const total = Math.round(BLOCK_START + minutesIntoBlock) % (24 * 60);
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/** cumulative points per session at each sample boundary, 0..SAMPLES */
function cumulative(steps: number[]) {
    const out = [0];
    for (const step of steps) out.push(out[out.length - 1] + step);
    return out;
}

const W = 600;
const H = 200;
const x = (minutes: number) => (minutes / BLOCK_MINUTES) * W;
const y = (percent: number) => H - (percent / 100) * H;

export default function TallyMini() {
    const series = useMemo(() => SESSIONS.map((s) => cumulative(s.steps)), []);
    const totals = series.map((s) => s[SAMPLES]);
    const used = totals.reduce((a, b) => a + b, 0);
    const pace = used / NOW_MINUTES;
    const fullAt = NOW_MINUTES + (100 - used) / pace;

    // the sample the reader is looking at; null means "now"
    const [cursor, setCursor] = useState<number | null>(null);
    const [focus, setFocus] = useState<Session["id"] | null>(null);
    const chart = useRef<HTMLDivElement>(null);

    const sample = cursor ?? SAMPLES;
    const at = (i: number) => series.reduce((sum, s) => sum + s[i], 0);
    const meter = at(sample);

    // the stacked bands: each one is the area between the sessions below it and itself
    const bands = useMemo(() => {
        const floors = new Array(SAMPLES + 1).fill(0);
        return SESSIONS.map((session, k) => {
            const top = floors.map((f, i) => f + series[k][i]);
            let d = `M${x(0)},${y(floors[0])}`;
            for (let i = 0; i <= SAMPLES; i++) d += `L${x(i * STEP_MINUTES)},${y(top[i])}`;
            for (let i = SAMPLES; i >= 0; i--) d += `L${x(i * STEP_MINUTES)},${y(floors[i])}`;
            d += "Z";
            for (let i = 0; i <= SAMPLES; i++) floors[i] = top[i];
            return { id: session.id, d };
        });
    }, [series]);

    const meterLine = useMemo(() => {
        let d = "";
        for (let i = 0; i <= SAMPLES; i++) {
            const total = series.reduce((sum, s) => sum + s[i], 0);
            d += `${i ? "L" : "M"}${x(i * STEP_MINUTES)},${y(total)}`;
        }
        return d;
    }, [series]);

    const running = SESSIONS.filter((s) => sample > 0 && s.steps[sample - 1] > 0);
    const projecting = cursor !== null && cursor > SAMPLES;
    const projected = projecting
        ? Math.min(100, Math.round(used + pace * (cursor * STEP_MINUTES - NOW_MINUTES)))
        : meter;

    const pick = (clientX: number) => {
        const rect = chart.current?.getBoundingClientRect();
        if (!rect) return;
        const minutes = ((clientX - rect.left) / rect.width) * BLOCK_MINUTES;
        const i = Math.round(minutes / STEP_MINUTES);
        setCursor(Math.max(0, Math.min(BLOCK_MINUTES / STEP_MINUTES, i)));
    };

    const onPointer = (event: PointerEvent<HTMLDivElement>) => {
        if (event.pointerType === "touch" && event.type === "pointermove" && !event.buttons) return;
        pick(event.clientX);
    };

    const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
        const last = BLOCK_MINUTES / STEP_MINUTES;
        const current = cursor ?? SAMPLES;
        let next: number | null = null;
        if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = Math.max(0, current - 1);
        if (event.key === "ArrowRight" || event.key === "ArrowUp")
            next = Math.min(last, current + 1);
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = last;
        if (event.key === "Escape") {
            setCursor(null);
            return;
        }
        if (next === null) return;
        event.preventDefault();
        setCursor(next);
    };

    const cursorMinutes = sample * STEP_MINUTES;
    const share = (k: number) => Math.round((totals[k] / used) * 100);

    return (
        <div className="tally-mini" data-focus={focus ?? undefined}>
            <div className="tally-head">
                <p className="tally-big" aria-live="polite">
                    <span className="tally-num">{projecting ? projected : meter}</span>
                    <span className="tally-pct">%</span>
                </p>
                <div className="tally-say">
                    {cursor === null ? (
                        <>
                            <p className="tally-when">
                                of the 5-hour block since {clock(0)} · resets {clock(BLOCK_MINUTES)}
                            </p>
                            <p className="tally-forecast">
                                <strong>100% at {clock(fullAt)}</strong>, before the reset.
                            </p>
                        </>
                    ) : projecting ? (
                        <>
                            <p className="tally-when">at {clock(cursorMinutes)}, if the pace holds</p>
                            <p className="tally-forecast">
                                {projected >= 100 ? (
                                    <strong>out of block. nothing left until {clock(BLOCK_MINUTES)}.</strong>
                                ) : (
                                    <>a guess, drawn dotted. tally keeps measured and estimated apart.</>
                                )}
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="tally-when">at {clock(cursorMinutes)}</p>
                            <p className="tally-forecast">
                                {running.length === 0
                                    ? "nothing running yet."
                                    : running.length === SESSIONS.length
                                      ? "all three sessions were moving it."
                                      : `${running.map((s) => s.title).join(" + ")} moved it.`}
                            </p>
                        </>
                    )}
                </div>
            </div>

            <div
                className="tally-chart"
                ref={chart}
                tabIndex={0}
                role="slider"
                aria-label="scrub through the block"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={projecting ? projected : meter}
                aria-valuetext={`${clock(cursorMinutes)}: ${projecting ? projected : meter}% of the block`}
                onPointerMove={onPointer}
                onPointerDown={onPointer}
                onPointerLeave={(event) => {
                    if (event.pointerType !== "touch") setCursor(null);
                }}
                onKeyDown={onKey}
                onBlur={() => setCursor(null)}
            >
                <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
                    {[25, 50, 75].map((p) => (
                        <line key={p} className="tally-grid" x1={0} x2={W} y1={y(p)} y2={y(p)} />
                    ))}
                    {bands.map((band) => (
                        <path key={band.id} className={`tally-band tally-band--${band.id}`} d={band.d} />
                    ))}
                    <path className="tally-line" d={meterLine} />
                    <line
                        className="tally-forecast-line"
                        x1={x(NOW_MINUTES)}
                        y1={y(used)}
                        x2={x(Math.min(fullAt, BLOCK_MINUTES))}
                        y2={y(Math.min(100, used + pace * (Math.min(fullAt, BLOCK_MINUTES) - NOW_MINUTES)))}
                    />
                    <line className="tally-ceiling" x1={0} x2={W} y1={y(100)} y2={y(100)} />
                </svg>
                <span className="tally-now" style={{ left: `${(NOW_MINUTES / BLOCK_MINUTES) * 100}%` }}>
                    now
                </span>
                <span
                    className="tally-full"
                    style={{ left: `${(Math.min(fullAt, BLOCK_MINUTES) / BLOCK_MINUTES) * 100}%` }}
                >
                    100%
                </span>
                {cursor !== null ? (
                    <span
                        className="tally-cursor"
                        style={{ left: `${(cursorMinutes / BLOCK_MINUTES) * 100}%` }}
                        aria-hidden="true"
                    />
                ) : null}
            </div>
            <div className="tally-axis" aria-hidden="true">
                <span>{clock(0)}</span>
                <span>{clock(BLOCK_MINUTES / 2)}</span>
                <span>{clock(BLOCK_MINUTES)}</span>
            </div>

            <ul className="tally-sessions">
                {SESSIONS.map((session, k) => (
                    <li key={session.id}>
                        <button
                            type="button"
                            className={`tally-session tally-session--${session.id}`}
                            aria-pressed={focus === session.id}
                            onPointerEnter={(event) => {
                                if (event.pointerType === "mouse") setFocus(session.id);
                            }}
                            onPointerLeave={(event) => {
                                if (event.pointerType === "mouse") setFocus(null);
                            }}
                            onFocus={() => setFocus(session.id)}
                            onBlur={() => setFocus(null)}
                            onClick={() => setFocus((f) => (f === session.id ? null : session.id))}
                        >
                            <span className="tally-swatch" aria-hidden="true" />
                            <span className="tally-session-title">{session.title}</span>
                            <span className="tally-session-share">{share(k)}%</span>
                            <span className="tally-session-meta">
                                ~{totals[k]} pts · {session.model} · {session.tokens}
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
