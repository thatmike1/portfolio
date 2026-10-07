import { useEffect, useState } from "react";
import type { SoraSays } from "./sky-report";

/*
 * TEMP, remove before merge: lets the pr preview switch between the masthead
 * layouts and sora's lines under review. ?mast= and ?sora= pick one, the panel in
 * the corner flips them, ?clean hides the panel for screenshots
 */

export const MASTS = {
    now: "the pr as it was: the board keeps its own, wider edge",
    edge: "one text edge: the board pulls in to the line the masthead's letter starts on",
    grid: "one edge, and every shelf headline splits where the masthead's columns split",
    index: "one edge, and the index leaves the masthead to open the board as its own strip",
} as const;
export type Mast = keyof typeof MASTS;

const SAYS: Record<SoraSays, string> = {
    quiet: "no line, the small print says whose dog",
    font: "a fixed line about the typeface",
    sky: "a line that names what she's reacting to",
};

const pick = <T extends string>(value: string | null, from: Record<T, string>, fallback: T): T =>
    value && value in from ? (value as T) : fallback;

export function usePreview() {
    const [mast, setMast] = useState<Mast>("edge");
    const [sora, setSora] = useState<SoraSays>("quiet");
    const [clean, setClean] = useState(true);
    useEffect(() => {
        const q = new URLSearchParams(window.location.search);
        setMast(pick(q.get("mast"), MASTS, "edge"));
        setSora(pick(q.get("sora"), SAYS, "quiet"));
        setClean(q.has("clean"));
    }, []);
    const set = (key: "mast" | "sora", value: string) => {
        const url = new URL(window.location.href);
        url.searchParams.set(key, value);
        window.history.replaceState(null, "", url);
        if (key === "mast") setMast(value as Mast);
        else setSora(value as SoraSays);
    };
    return { mast, sora, clean, set };
}

export function PreviewSwitch({ preview }: { preview: ReturnType<typeof usePreview> }) {
    if (preview.clean) return null;
    return (
        <aside className="preview-switch" aria-label="preview options">
            <p>layout</p>
            {(Object.keys(MASTS) as Mast[]).map((m) => (
                <button key={m} type="button" title={MASTS[m]} aria-pressed={preview.mast === m} onClick={() => preview.set("mast", m)}>
                    {m}
                </button>
            ))}
            <p>sora</p>
            {(Object.keys(SAYS) as SoraSays[]).map((s) => (
                <button key={s} type="button" title={SAYS[s]} aria-pressed={preview.sora === s} onClick={() => preview.set("sora", s)}>
                    {s}
                </button>
            ))}
            <p className="preview-switch-why">{MASTS[preview.mast]}</p>
        </aside>
    );
}
