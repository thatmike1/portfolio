import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AISLES, parse } from "./nakup-parse";
import type { Aisle } from "./nakup-parse";
import "./nakup-mini.css";

/**
 * nákup in miniature: one shared list printed as a two-colour riso job, one ink per
 * person. pick whose phone you are holding, tick things off, add something. where
 * one person ticks what the other added, the two inks overprint into green, which is
 * the whole idea. the people and the groceries are invented; the look is the real
 * app's, down to the grain and the plates printed slightly off register.
 */

type Who = "bara" | "tomas";
type Item = {
    id: number;
    name: string;
    qty?: string;
    aisle: Aisle;
    by: Who;
    doneBy?: Who;
    fresh?: boolean;
};
const PEOPLE: Record<Who, { name: string; initial: string }> = {
    bara: { name: "Bára", initial: "B" },
    tomas: { name: "Tomáš", initial: "T" },
};
const other = (who: Who): Who => (who === "bara" ? "tomas" : "bara");

const START: Item[] = [
    { id: 1, name: "Tomatoes", qty: "500 g", aisle: "fruit and veg", by: "bara" },
    { id: 2, name: "Lemons", qty: "3×", aisle: "fruit and veg", by: "tomas", doneBy: "bara" },
    { id: 3, name: "Sourdough", aisle: "bakery", by: "bara" },
    { id: 4, name: "Milk", qty: "2×", aisle: "dairy and eggs", by: "tomas" },
    { id: 5, name: "Butter", aisle: "dairy and eggs", by: "bara" },
];

/** what the other phone adds a moment after you first add something */
const ECHO: Record<Who, { name: string; aisle: Aisle; qty?: string }> = {
    bara: { name: "Coffee", aisle: "pantry" },
    tomas: { name: "Limes", aisle: "fruit and veg", qty: "2×" },
};

const QUICK = ["Eggs", "2× Oat milk", "Pasta"];

export default function NakupMini() {
    const [me, setMe] = useState<Who>("tomas");
    const [items, setItems] = useState<Item[]>(START);
    const [draft, setDraft] = useState("");
    const [toast, setToast] = useState<string | null>(null);
    const nextId = useRef(10);
    const echoed = useRef(false);
    const timers = useRef<number[]>([]);
    const list = useRef<HTMLDivElement>(null);
    // the newest row, so the list can scroll itself to it: the sheet keeps its height
    // the way the real app does, and only the list moves
    const [landed, setLanded] = useState<number | null>(null);

    useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

    useEffect(() => {
        const box = list.current;
        if (landed === null || !box) return;
        const row = box.querySelector<HTMLElement>(`[data-id="${landed}"]`);
        if (!row) return;
        const top = row.offsetTop;
        const bottom = top + row.offsetHeight;
        if (top < box.scrollTop) box.scrollTop = top - 40;
        else if (bottom > box.scrollTop + box.clientHeight)
            box.scrollTop = bottom - box.clientHeight + 64;
    }, [landed]);

    const tick = (id: number) =>
        setItems((rows) =>
            rows.map((item) =>
                item.id === id ? { ...item, doneBy: item.doneBy ? undefined : me, fresh: false } : item,
            ),
        );

    const add = (raw: string) => {
        const parsed = parse(raw);
        if (!parsed) return;
        const id = nextId.current++;
        setItems((rows) => [...rows, { id, ...parsed, by: me }]);
        setLanded(id);
        setDraft("");
        if (echoed.current) return;
        echoed.current = true;
        const them = other(me);
        timers.current.push(
            window.setTimeout(() => {
                const id = nextId.current++;
                setItems((rows) => [...rows, { id, ...ECHO[them], by: them, fresh: true }]);
                setLanded(id);
                setToast(`${PEOPLE[them].name} added ${ECHO[them].name.toLowerCase()}`);
            }, 1800),
            window.setTimeout(() => setToast(null), 5200),
        );
    };

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        add(draft);
    };

    const open = items.filter((i) => !i.doneBy).length;
    const them = other(me);

    return (
        <div className="nk-wrap">
            <div className="nk-holder" role="group" aria-label="whose phone you are holding">
                <span className="nk-holder-label">whose phone</span>
                {(["bara", "tomas"] as Who[]).map((who) => (
                    <button
                        type="button"
                        key={who}
                        aria-pressed={me === who}
                        className="nk-holder-pick"
                        data-ink={who}
                        onClick={() => setMe(who)}
                    >
                        <Stamp who={who} mini />
                        {PEOPLE[who].name}
                    </button>
                ))}
            </div>

            <div className="nk-sheet" data-me={me}>
                <header className="nk-mast">
                    <span className="nk-mast-ink" aria-hidden="true" />
                    <span className="nk-mast-edge" aria-hidden="true" />
                    <p className="nk-hello">Good evening, {PEOPLE[me].name}</p>
                    <p className="nk-word">Nákup</p>
                    <p className="nk-status">
                        {open === 0 ? "Nothing left, go home" : `${open} ${open === 1 ? "thing" : "things"} on the list`}
                    </p>
                    <span className="nk-them" aria-hidden="true" data-ink={them}>
                        <Stamp who={them} big />
                    </span>
                </header>

                <div className="nk-list" ref={list}>
                    {AISLES.map((aisle) => {
                        const rows = items.filter((i) => i.aisle === aisle);
                        if (!rows.length) return null;
                        return (
                            <section className="nk-aisle" key={aisle}>
                                <h5 className="nk-aisle-head">
                                    {aisle}
                                    <span>{rows.length > 1 ? rows.length : ""}</span>
                                </h5>
                                <ul>
                                    {rows.map((item) => (
                                        <li
                                            key={item.id}
                                            data-id={item.id}
                                            className="nk-row"
                                            data-done={item.doneBy ? "true" : "false"}
                                        >
                                            {item.fresh ? (
                                                <span className="nk-flash" data-ink={item.by} aria-hidden="true" />
                                            ) : null}
                                            <button
                                                type="button"
                                                className="nk-row-card"
                                                aria-pressed={Boolean(item.doneBy)}
                                                onClick={() => tick(item.id)}
                                            >
                                                <span className="nk-tick" aria-hidden="true">
                                                    {item.doneBy ? (
                                                        <>
                                                            <span className="nk-tick-ink nk-tick-ink--under" data-ink={item.by} />
                                                            <span className="nk-tick-ink" data-ink={item.doneBy} />
                                                        </>
                                                    ) : null}
                                                    <span className="nk-tick-ring" />
                                                    {item.doneBy ? (
                                                        <svg className="nk-tick-check" viewBox="0 0 24 24">
                                                            <path d="M5 12.5l4.2 4.2L19 7" />
                                                        </svg>
                                                    ) : null}
                                                </span>
                                                <span className="nk-name">
                                                    <span className="nk-band nk-band--under" data-ink={item.doneBy ?? me} />
                                                    <span className="nk-band" data-ink={item.doneBy ?? me} />
                                                    <span className="nk-name-text">{item.name}</span>
                                                </span>
                                                {item.qty ? <span className="nk-qty">{item.qty}</span> : null}
                                                <Stamp who={item.by} mini />
                                                <span className="nk-sr">
                                                    {item.doneBy
                                                        ? `, ticked by ${PEOPLE[item.doneBy].name}`
                                                        : ""}
                                                    , added by {PEOPLE[item.by].name}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        );
                    })}
                </div>

                <form className="nk-dock" onSubmit={onSubmit}>
                    <div className="nk-usuals">
                        {QUICK.map((q) => (
                            <button type="button" key={q} className="nk-chip" onClick={() => add(q)}>
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                {q}
                            </button>
                        ))}
                    </div>
                    <div className="nk-add">
                        <input
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder="Eggs, 2× yogurt, flour 1 kg…"
                            aria-label="add to the list"
                            maxLength={40}
                        />
                        <button type="submit" className="nk-send" aria-label="add" data-ink={me}>
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M12 19V5M6 11l6-6 6 6" />
                            </svg>
                        </button>
                    </div>
                    <p className={`nk-toast${toast ? " is-on" : ""}`} role="status">
                        {toast ?? ""}
                    </p>
                </form>
            </div>
        </div>
    );
}

function Stamp({ who, mini, big }: { who: Who; mini?: boolean; big?: boolean }) {
    return (
        <span
            className={`nk-stamp${mini ? " nk-stamp--mini" : ""}${big ? " nk-stamp--big" : ""}`}
            data-ink={who}
            aria-hidden="true"
        >
            <span className="nk-stamp-ink" />
            <span className="nk-stamp-ring" />
            <span className="nk-stamp-letter">{PEOPLE[who].initial}</span>
        </span>
    );
}
