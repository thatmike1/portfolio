import { FACTS, count } from "../lib/facts";

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
    const added = Math.round(FACTS.t3.added / 100);
    const removed = Math.max(1, Math.round(FACTS.t3.removed / 100));
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
    return (
        <figure className="chart chart--maps">
            <div className="chart-maps">
                {FACTS.fonts.maps.map((map) => {
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
    const groups = FACTS.radio.lanes.map((lane) => {
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
                <span>{FACTS.radio.lanes[0].lane}</span>
                <span>
                    {FACTS.radio.lanes.length} lanes · {FACTS.radio.stations} stations
                </span>
                <span>{FACTS.radio.lanes.at(-1)?.lane}</span>
            </figcaption>
        </figure>
    );
}
