import { COMMIT_DAYS, FONT_MAPS, FONT_MAP_GRID, MODEL_POINTS, RADIO_LANES, T3_DIFF } from "../lib/board-data";

/**
 * the board's small charts. every mark is a square grain on a whole-pixel grid,
 * the same material the sky up top is made of, so a chart reads as a handful of
 * the sand rather than a widget. they are pictures of numbers the caption says in
 * words, so each svg is hidden from assistive tech and the caption carries it
 */

const G = 5; // a grain: about the hero's own cell
const S = 6; // a grain and its gap

const fmt = (d: Date) =>
    `${d.getUTCDate()} ${d.toLocaleString("en", { month: "short", timeZone: "UTC" }).toLowerCase()}`;

/** commits per day as little piles of grains, one pile per day from the first commit on */
export function CommitPiles({ repo }: { repo: keyof typeof COMMIT_DAYS }) {
    const { from, days } = COMMIT_DAYS[repo];
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
    return (
        <figure className="chart chart--piles">
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
    const added = Math.round(T3_DIFF.added / 100);
    const removed = Math.max(1, Math.round(T3_DIFF.removed / 100));
    const perRow = 20;
    const all = added + removed;
    const rows = Math.ceil(all / perRow);
    const width = perRow * S - 1;
    const height = rows * S - 1;
    return (
        <figure className="chart chart--diff">
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
                    />
                ))}
            </svg>
            <figcaption className="chart-axis">
                <span>
                    <b className="chart-key" /> +{T3_DIFF.added.toLocaleString("en")} added
                </span>
                <span>
                    <b className="chart-key chart-key--out" /> −{T3_DIFF.removed} removed
                </span>
                <span>a grain is 100 lines</span>
            </figcaption>
        </figure>
    );
}

/** cost per task against the intelligence index, the frontier lit and stepped */
export function ModelScatter() {
    const W = 300;
    const H = 150;
    const [x0, x1] = [-2.4, 1];
    const [y0, y1] = [0, 60];
    const px = (v: number) => Math.round(((v - x0) / (x1 - x0)) * (W - G));
    const py = (v: number) => Math.round(H - G - ((v - y0) / (y1 - y0)) * (H - G));
    const frontier = MODEL_POINTS.filter((p) => p[2]).sort((a, b) => a[0] - b[0]);
    // the frontier as a staircase: across at the old score, then up to the new one
    let path = "";
    frontier.forEach(([c, s], i) => {
        const x = px(c) + G / 2;
        const y = py(s) + G / 2;
        path += i === 0 ? `M${x} ${y}` : ` H${x} V${y}`;
    });
    return (
        <figure className="chart chart--scatter">
            <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} shapeRendering="crispEdges" aria-hidden="true">
                {[0, 20, 40, 60].map((v) => (
                    <rect key={v} className="chart-rule" x={0} y={py(v) + G / 2} width={W} height={1} />
                ))}
                <path className="chart-step" d={path} />
                {MODEL_POINTS.filter((p) => !p[2]).map(([c, s], i) => (
                    <rect key={i} className="chart-grain chart-grain--dim" x={px(c)} y={py(s)} width={G} height={G} />
                ))}
                {frontier.map(([c, s], i) => (
                    <rect key={`f${i}`} className="chart-grain" x={px(c)} y={py(s)} width={G} height={G} />
                ))}
            </svg>
            <figcaption className="chart-axis">
                <span>$0.004 a task</span>
                <span>cost, log scale →</span>
                <span>$8.75</span>
            </figcaption>
        </figure>
    );
}

/** the three decks' shape maps side by side, a grain per occupied cell */
export function FontMaps() {
    const { cols, rows } = FONT_MAP_GRID;
    const c = 2;
    return (
        <figure className="chart chart--maps">
            <div className="chart-maps">
                {FONT_MAPS.map((map) => {
                    const cells: Array<[number, number, number]> = [];
                    for (let i = 0; i < map.cells.length; i += 3) {
                        cells.push([map.cells[i], map.cells[i + 1], map.cells[i + 2]]);
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
                                {cells.map(([x, y, n]) => (
                                    <rect
                                        key={`${x}-${y}`}
                                        className={n > 1 ? "chart-grain" : "chart-grain chart-grain--soft"}
                                        x={x * c}
                                        y={y * c}
                                        width={c}
                                        height={c}
                                    />
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
    const groups = RADIO_LANES.map((lane) => {
        const start = x;
        x += lane.stations * S + gap;
        return { ...lane, start };
    });
    const width = x - gap;
    const height = 26;
    return (
        <figure className="chart chart--dial">
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
                            />
                        ))}
                    </g>
                ))}
            </svg>
            <figcaption className="chart-axis">
                <span>drift</span>
                <span>8 lanes · 60 stations</span>
                <span>loud</span>
            </figcaption>
        </figure>
    );
}
