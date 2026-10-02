import type { CSSProperties } from "react";
import { useArrival } from "../lib/arrival";
import { FACTS, count } from "../lib/facts";

/**
 * the board's small charts. every mark is a square grain on a whole-pixel grid,
 * the same material the sky up top is made of, so a chart reads as a handful of
 * the sand rather than a widget. they are pictures of numbers the caption says in
 * words, so each svg is hidden from assistive tech and the caption carries it.
 *
 * the first time a chart scrolls into view its grains pour in from above the
 * frame and land where they belong, bottom row first, as if the sky's sand filled
 * it; board.css has the keyframes, each grain only says when it falls. the svg's
 * box is fixed so nothing around it moves, and a chart already on screen when
 * the page lands is simply there
 */

const G = 5; // a grain: about the hero's own cell
const S = 6; // a grain and its gap

/** when a grain falls, in ms after the chart arrives */
const pour = (ms: number) => ({ "--d": ms } as CSSProperties);

const fmt = (d: Date) =>
    `${d.getUTCDate()} ${d.toLocaleString("en", { month: "short", timeZone: "UTC" }).toLowerCase()}`;

/** tally's commits per day as little piles of grains, one pile per day from the first commit on */
export function CommitPiles() {
    const { from, days } = FACTS.tally;
    const tallest = Math.max(...days);
    // a fifteen-commit day would tower over the rest; past eight grains a pile
    // stacks two to a row, which keeps the shape and halves the height
    const perRow = tallest > 8 ? 2 : 1;
    const rows = Math.ceil(tallest / perRow);
    const colW = perRow * S + 2;
    const width = days.length * colW;
    const height = rows * S + 3;
    const start = new Date(`${from}T00:00:00Z`);
    const end = new Date(start.getTime() + (days.length - 1) * 86_400_000);
    const total = days.reduce((a, b) => a + b, 0);
    const [ref, arrival] = useArrival<HTMLElement>();
    return (
        <figure className="chart chart--piles" ref={ref} data-arrival={arrival}>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                width={width}
                height={height}
                shapeRendering="crispEdges"
                aria-hidden="true"
            >
                {days.map((n, d) => {
                    const x0 = d * colW;
                    if (!n) {
                        return (
                            <rect
                                key={d}
                                className="chart-floor"
                                x={x0}
                                y={height - 1}
                                width={perRow * S - 1}
                                height={1}
                            />
                        );
                    }
                    return Array.from({ length: n }, (_, i) => (
                        <rect
                            key={`${d}-${i}`}
                            className="chart-grain"
                            x={x0 + (i % perRow) * S}
                            y={height - 3 - (Math.floor(i / perRow) + 1) * S + 1}
                            width={G}
                            height={G}
                            // the piles fill from the floor up, sweeping across the days
                            style={pour(Math.floor(i / perRow) * 55 + d * 14 + ((d * 7 + i * 3) % 4) * 9)}
                        />
                    ));
                })}
            </svg>
            <figcaption className="chart-axis">
                <span>{fmt(start)}</span>
                <span>
                    {total} commits · {days.filter(Boolean).length} days
                </span>
                <span>{fmt(end)}</span>
            </figcaption>
        </figure>
    );
}

/** the fork's diff against upstream, a grain per hundred lines */
export function DiffGrains() {
    const added = Math.round(FACTS.t3.added / 100);
    const removed = Math.max(1, Math.round(FACTS.t3.removed / 100));
    const perRow = 20;
    const all = added + removed;
    const rows = Math.ceil(all / perRow);
    const width = perRow * S - 1;
    const height = rows * S - 1;
    const [ref, arrival] = useArrival<HTMLElement>();
    return (
        <figure className="chart chart--diff" ref={ref} data-arrival={arrival}>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                width={width}
                height={height}
                shapeRendering="crispEdges"
                aria-hidden="true"
            >
                {Array.from({ length: all }, (_, i) => (
                    <rect
                        key={i}
                        className={i < added ? "chart-grain" : "chart-grain chart-grain--out"}
                        x={(i % perRow) * S}
                        y={Math.floor(i / perRow) * S}
                        width={G}
                        height={G}
                        // the bottom row lands first and each row above it settles on that
                        style={pour((rows - 1 - Math.floor(i / perRow)) * 70 + (i % perRow) * 11 + ((i * 5) % 3) * 8)}
                    />
                ))}
            </svg>
            <figcaption className="chart-axis">
                <span>
                    <b className="chart-key" /> +{count(FACTS.t3.added)} added
                </span>
                <span>
                    <b className="chart-key chart-key--out" /> −{count(FACTS.t3.removed)} removed
                </span>
                <span>a grain is 100 lines</span>
            </figcaption>
        </figure>
    );
}

/** the three decks' shape maps side by side, a grain per occupied cell */
export function FontMaps() {
    const { cols, rows } = FACTS.fonts.grid;
    const c = 2;
    const [ref, arrival] = useArrival<HTMLElement>();
    return (
        <figure className="chart chart--maps" ref={ref} data-arrival={arrival}>
            <div className="chart-maps">
                {FACTS.fonts.maps.map((map) => {
                    // the cells are two pixels each and there are hundreds, so they fall a
                    // row at a time: each row of the map is one group, floor first
                    const byRow = new Map<number, Array<[number, number]>>();
                    for (let i = 0; i < map.cells.length; i += 3) {
                        const y = map.cells[i + 1];
                        const row = byRow.get(y) ?? [];
                        row.push([map.cells[i], map.cells[i + 2]]);
                        byRow.set(y, row);
                    }
                    return (
                        <div className="chart-map" key={map.deck}>
                            <svg
                                viewBox={`0 0 ${cols * c} ${rows * c}`}
                                width={cols * c}
                                height={rows * c}
                                shapeRendering="crispEdges"
                                aria-hidden="true"
                            >
                                <rect className="chart-plate" x={0} y={0} width={cols * c} height={rows * c} />
                                {[...byRow.entries()].map(([y, row]) => (
                                    <g key={y} className="chart-row" style={pour((rows - 1 - y) * 22)}>
                                        {row.map(([x, n]) => (
                                            <rect
                                                key={x}
                                                className={n > 1 ? "chart-grain" : "chart-grain chart-grain--soft"}
                                                x={x * c}
                                                y={y * c}
                                                width={c}
                                                height={c}
                                            />
                                        ))}
                                    </g>
                                ))}
                            </svg>
                            <span className="chart-axis">
                                <span>{map.deck}</span>
                                <span>{map.fonts}</span>
                            </span>
                        </div>
                    );
                })}
            </div>
        </figure>
    );
}

/**
 * the public dial: every station a tick, every lane a group, in the dial's own
 * order from quiet to loud. the ticks are all one height on purpose: nothing here
 * measures loudness, the order is the claim
 */
export function RadioDial() {
    const gap = 7;
    let x = 0;
    const groups = FACTS.radio.lanes.map((lane) => {
        const start = x;
        x += lane.stations * S + gap;
        return { ...lane, start };
    });
    const width = x - gap;
    const height = 26;
    const [ref, arrival] = useArrival<HTMLElement>();
    return (
        <figure className="chart chart--dial" ref={ref} data-arrival={arrival}>
            <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} shapeRendering="crispEdges" aria-hidden="true">
                <rect className="chart-rule" x={0} y={height - 1} width={width} height={1} />
                {groups.map((lane, li) => (
                    <g key={lane.lane}>
                        <title>{`${lane.lane}: ${lane.stations}`}</title>
                        {Array.from({ length: lane.stations }, (_, i) => (
                            <rect
                                key={i}
                                className={li % 2 ? "chart-grain chart-grain--alt" : "chart-grain"}
                                x={lane.start + i * S}
                                y={height - 3 - 16}
                                width={G - 1}
                                height={16}
                                // the dial fills from quiet to loud, a station at a time
                                style={pour((lane.start / S + i) * 9)}
                            />
                        ))}
                    </g>
                ))}
            </svg>
            <figcaption className="chart-axis">
                <span>{FACTS.radio.lanes[0].lane}</span>
                <span>
                    {FACTS.radio.lanes.length} lanes · {FACTS.radio.stations} stations
                </span>
                <span>{FACTS.radio.lanes.at(-1)?.lane}</span>
            </figcaption>
        </figure>
    );
}

/**
 * one of the breakbeat loom's feels as it is written: a row of grains per lane, a
 * column per sixteenth, two bars with a gap between them. a loud hit is a full
 * grain, a light one (the ghosts, the soft hats) is half there, and a rest is a
 * speck on the floor of its lane. it pours a step at a time, left to right, the
 * way the loop plays, and it makes no sound
 */
export function GrooveGrains() {
    const { groove, steps } = FACTS.breakbeat;
    const half = steps / 2;
    const gap = 6; // the bar line
    const x = (step: number) => step * S + (step >= half ? gap : 0);
    const width = x(steps - 1) + G;
    const height = groove.lanes.length * S - 1;
    const [ref, arrival] = useArrival<HTMLElement>();
    return (
        <figure className="chart chart--groove" ref={ref} data-arrival={arrival}>
            <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} shapeRendering="crispEdges" aria-hidden="true">
                {groove.lanes.map((lane, row) => (
                    <g key={lane.lane}>
                        <title>{lane.lane}</title>
                        {lane.steps.map((v, step) =>
                            v ? (
                                <rect
                                    key={step}
                                    className={v >= 0.5 ? "chart-grain" : "chart-grain chart-grain--soft"}
                                    x={x(step)}
                                    y={row * S}
                                    width={G}
                                    height={G}
                                    // the loop plays left to right, and so does the pour
                                    style={pour(step * 24 + (groove.lanes.length - 1 - row) * 14)}
                                />
                            ) : (
                                <rect key={step} className="chart-floor" x={x(step) + 2} y={row * S + 2} width={1} height={1} />
                            ),
                        )}
                    </g>
                ))}
            </svg>
            <figcaption>
                <span className="chart-axis" style={{ maxWidth: width }}>
                    <span>bar 1</span>
                    <span>bar 2</span>
                </span>
                <span className="chart-axis chart-axis--under">
                    {groove.feel} as written, {groove.bpm} bpm · lanes:{" "}
                    {groove.lanes.map((lane) => lane.lane).join(", ")}
                </span>
            </figcaption>
        </figure>
    );
}
