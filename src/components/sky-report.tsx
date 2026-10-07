import { useEffect, useRef, useState } from "react";
import type { Hud } from "./weather-hero";
import type { Theme } from "../lib/theme";

/** how many readings the cover strip keeps: about half a minute of weather */
const KEEP = 48;

/** sora's birthday, so her age is worked out on the day and never goes stale */
const SORA_BORN = { y: 2025, m: 6, d: 15 };

/** years, months and days since a date, the way a person says an age */
export function ageOn(today: Date, born = SORA_BORN): { years: number; months: number; days: number } {
    let years = today.getFullYear() - born.y;
    let months = today.getMonth() - born.m;
    let days = today.getDate() - born.d;
    if (days < 0) {
        months -= 1;
        // the days left in the month before this one
        days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }
    if (months < 0) {
        years -= 1;
        months += 12;
    }
    return { years, months, days };
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function soraAge(today: Date): string {
    const { years, months, days } = ageOn(today);
    return `${plural(years, "year")}, ${plural(months, "month")} and ${plural(days, "day")}`;
}

/**
 * what the sky is doing, in the words a person would use for it. cover counts any
 * cell with a trace of cloud, so a normal sky sits around a third: the words are
 * pitched against that, not against zero
 */
function skyWords(cover: number): string {
    if (cover < 0.18) return "clear skies over the sand";
    if (cover < 0.3) return "a few clouds over the sand";
    if (cover < 0.42) return "cloudy over the sand";
    return "heavy cloud over the sand";
}

/** rain shows up as water arriving: the picture gaining drops over the last few readings */
export function isRaining(drops: number[]): boolean {
    if (drops.length < 4) return false;
    return drops[drops.length - 1] - drops[drops.length - 4] > 60;
}

/** the one portrait of sora: the original, not a sticker, whatever the sky is doing */
const SORA_PIC = {
    src: "/sora/sora.webp",
    alt: "sora, a curly black and white havanese, sitting up and looking right at you",
};

/** sora reads the same sky: in when it rains, asleep at night, watching otherwise */
function soraLine(theme: Theme, raining: boolean): string {
    if (raining) return "staying in until the rain stops.";
    if (theme === "dark") return "asleep. it's night up there.";
    if (theme === "dusk") return "wondering where the sun went.";
    return "watching the sand, as usual.";
}

/**
 * the hero's readings, kept for the masthead: the latest, a short history of the
 * water, and how many readings have come in all told, so a column of the strip
 * keeps its identity as it moves left
 */
export function useSky() {
    const [hud, setHud] = useState<Hud | null>(null);
    const [drops, setDrops] = useState<number[]>([]);
    const [readings, setReadings] = useState(0);
    const keep = (list: number[], value: number) =>
        list.length >= KEEP ? [...list.slice(1), value] : [...list, value];
    const onWeather = (next: Hud) => {
        setHud(next);
        setDrops((d) => keep(d, next.drops));
        setReadings((n) => n + 1);
    };
    return { hud, drops, readings, onWeather };
}

function useTheme(): Theme {
    const [theme, setTheme] = useState<Theme>("light");
    useEffect(() => {
        const read = () => {
            const t = document.documentElement.dataset.theme;
            setTheme(t === "dark" || t === "dusk" ? t : "light");
        };
        read();
        const mo = new MutationObserver(read);
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
        return () => mo.disconnect();
    }, []);
    return theme;
}

function useReduced(): boolean {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReduced(mq.matches);
        const on = () => setReduced(mq.matches);
        mq.addEventListener("change", on);
        return () => mq.removeEventListener("change", on);
    }, []);
    return reduced;
}

/**
 * the water in the picture over the last half minute, a column of grains per
 * reading and newest on the right. scaled to the window's own peak, so a shower
 * shows as the columns climbing and a dry spell as them settling. each column is
 * keyed by its reading, not its place, so a new reading's grains are new elements
 * that fall into the right edge, and the column before it turns from raspberry to
 * water where it stands
 */
function DropStrip({ drops, readings = drops.length }: { drops: number[]; readings?: number }) {
    const S = 7;
    const rows = 8;
    const width = KEEP * S - 1;
    const height = rows * S - 1;
    const offset = KEEP - drops.length;
    const base = readings - drops.length;
    const peak = Math.max(1, ...drops);
    return (
        <svg
            className="sky-strip"
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            shapeRendering="crispEdges"
            aria-hidden="true"
        >
            {Array.from({ length: KEEP }, (_, i) => (
                <rect key={`f${i}`} className="chart-floor" x={i * S} y={height - 1} width={S - 1} height={1} />
            ))}
            {drops.map((d, i) => {
                const n = Math.max(1, Math.round((d / peak) * rows));
                return Array.from({ length: n }, (_, k) => (
                    <rect
                        key={`${base + i}-${k}`}
                        className={i === drops.length - 1 ? "chart-grain" : "chart-grain chart-grain--water"}
                        style={{ "--d": k * 28 } as React.CSSProperties}
                        x={(offset + i) * S}
                        y={height - (k + 1) * S + 1}
                        width={S - 1}
                        height={S - 1}
                    />
                ));
            })}
        </svg>
    );
}

/**
 * sora under the sky: the portrait, and beside it her name as a label, what she
 * makes of the weather, and her age in the small print. when her mood changes the new line fades through; the first render
 * shows it plainly, so the page lands complete
 */
function Sora({ line, age }: { line: string; age: string | null }) {
    const first = useRef(line);
    const moved = useRef(false);
    if (line !== first.current) moved.current = true;
    return (
        <div className="sora">
            <img className="sora-pic" src={SORA_PIC.src} alt={SORA_PIC.alt} width={104} height={104} />
            <div className="sora-words">
                <p className="mast-label sora-name">
                    <span>sora</span>
                </p>
                <p key={line} className={`sora-say${moved.current ? " is-new" : ""}`}>
                    {line}
                </p>
                {/* worked out after hydration; the line holds its height meanwhile */}
                <p className="sora-age">{age ? `${age} old` : "\u00a0"}</p>
            </div>
        </div>
    );
}

/**
 * the masthead's weather column: the sky above is a real simulation, so the page
 * reports it the way a start page reports the weather outside. the hero hands its
 * readings up through onWeather; under reduced motion the sky never moves, and the
 * column says so instead of pretending
 */
export function SkyColumn({
    hud,
    drops,
    readings,
}: {
    hud: Hud | null;
    drops: number[];
    readings?: number;
}) {
    const theme = useTheme();
    const reduced = useReduced();
    const [age, setAge] = useState<string | null>(null);
    useEffect(() => setAge(soraAge(new Date())), []);
    const raining = !reduced && isRaining(drops);
    const says = soraLine(theme, raining);

    let line: React.ReactNode;
    if (reduced) {
        line = (
            <>
                the sky is holding still, <em>because you asked for less motion</em>. the sand
                still takes a click.
            </>
        );
    } else if (!hud) {
        line = <>reading the sky.</>;
    } else {
        line = raining ? (
            <>
                it's raining on the sand, and the picture holds{" "}
                <em>{hud.drops.toLocaleString("en")} drops</em> of water.
            </>
        ) : (
            <>
                {skyWords(hud.cover)}, and <em>{hud.drops.toLocaleString("en")} drops</em> of water
                are down in the picture.
            </>
        );
    }

    return (
        <section className="mast-col mast-sky" aria-labelledby="sky-heading">
            <h2 className="mast-label" id="sky-heading">
                <span>the sky up there</span>
                <span className={`mast-live${hud && !reduced ? " is-on" : ""}`}>
                    {reduced ? "still" : "live"}
                </span>
            </h2>
            {/* the sentence grows from "reading the sky." to a full one when the
                first reading lands, so the box is held open by the longest thing it
                will say, set invisibly in the same cell: the column below never moves */}
            <p className="mast-take sky-take" aria-live="off">
                <span className="sky-take-now">{line}</span>
                <span className="sky-take-room sky-take-room--live" aria-hidden="true">
                    a few clouds over the sand, and <em>88,888 drops</em> of water are down in
                    the picture.
                </span>
                <span className="sky-take-room sky-take-room--still" aria-hidden="true">
                    the sky is holding still, <em>because you asked for less motion</em>. the sand
                    still takes a click.
                </span>
            </p>
            {/* rendered either way and hidden by the media query, so a reduced-motion
                visitor does not see it drop out after hydration */}
            <div className="sky-reading">
                <DropStrip drops={reduced ? [] : drops} readings={readings} />
                <p className="sky-numbers">
                    water, last 30s · cover {hud && !reduced ? Math.round(hud.cover * 100) : "–"}% · in
                    the air {hud && !reduced ? Math.round(hud.humidity * 100) : "–"}%
                </p>
            </div>
            <p className="mast-note">
                the sand is real, go make a mess. it's a tiny cousin of{" "}
                <a href="https://github.com/thatmike1/powder-lab">powder-lab</a>. the clouds
                rain, the lake fills, the falls carry it back.
            </p>
            <Sora line={says} age={age} />
        </section>
    );
}

/**
 * the letter column's label: the day and the time where i am, the way a start page
 * opens. worked out in prague's time zone on the visitor's clock, after hydration,
 * so the server never bakes in a stale minute
 */
export function Dateline() {
    const [now, setNow] = useState<string | null>(null);
    useEffect(() => {
        const read = () => {
            const d = new Date();
            const day = d
                .toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Prague" })
                .toLowerCase()
                .replace(",", "");
            const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Prague" });
            setNow(`${day} · ${time} in czechia`);
        };
        read();
        const id = window.setInterval(read, 30_000);
        return () => window.clearInterval(id);
    }, []);
    return (
        <p className="mast-label mast-dateline">
            <span>{now ?? "czechia"}</span>
        </p>
    );
}
