import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import "./beadside-mini.css";

/**
 * the handoff, small: an invented backlog where an agent stopped on a decision only
 * a person can make. you answer from the composer, the bead gets flagged, and the
 * next agent session picks your note up first, answers, and clears the flag. no
 * server, no model: the agent's side is scripted, the flow is the real one.
 */

type Phase = "waiting" | "sent" | "reading" | "answered";

/** the same invented shop backlog the screenshot beside this toy shows, and its open question */
const BEAD = "r2h";
const TITLE = "vat is a cent off on baskets of three or more";

const REPLIES = [
    {
        note: "a. round per order, print the rounding line",
        answer: "going with a: vat rounds once per order, the invoice prints a rounding line, and stripe stays the source of truth. flag cleared, i'll close it when the test passes.",
    },
    {
        note: "b. round per line, send stripe the line totals",
        answer: "b it is: vat per line everywhere, and stripe gets the summed line totals, so the charge and the invoice always agree. flag cleared.",
    },
    {
        note: "ask accounting first",
        answer: "parked for accounting: the question is in the bead with both versions ready to go. flag cleared; it waits on them now, not on you.",
    },
];

const quote = (text: string) => (text.length > 48 ? `${text.slice(0, 46).trimEnd()}…` : text);

export default function BeadsideMini() {
    const [phase, setPhase] = useState<Phase>("waiting");
    const [draft, setDraft] = useState("");
    const [note, setNote] = useState("");
    const [answer, setAnswer] = useState("");
    const timers = useRef<number[]>([]);
    const field = useRef<HTMLTextAreaElement>(null);

    useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

    const send = (text: string, scripted?: string) => {
        const clean = text.trim();
        if (!clean || phase !== "waiting") return;
        setNote(clean);
        setDraft("");
        setPhase("sent");
        setAnswer(
            scripted ??
                `read your note ("${quote(clean)}"). doing it that way; i'll leave a comment here when it's in. flag cleared.`,
        );
        timers.current.push(
            window.setTimeout(() => setPhase("reading"), 1500),
            window.setTimeout(() => setPhase("answered"), 3300),
        );
    };

    const reset = () => {
        timers.current.forEach((t) => window.clearTimeout(t));
        timers.current = [];
        setPhase("waiting");
        setNote("");
        setDraft("");
        setAnswer("");
    };

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        send(draft);
    };

    const onKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            send(draft);
        }
    };

    const flagged = phase === "sent" || phase === "reading";
    const waiting = phase === "waiting";
    const done = phase === "answered";

    return (
        <div className="bs-mini" data-phase={phase}>
            <div className="bs-index" aria-hidden="true">
                <p className="bs-brand">
                    beadside <span>demo</span>
                </p>
                <p className="bs-counts">
                    <b>6</b> open / <b>{done ? 2 : 1}</b> in progress /{" "}
                    <em className={waiting ? "is-on" : ""}>{waiting ? 1 : 0} waiting on you</em> /{" "}
                    <em className={flagged ? "is-on" : ""}>{flagged ? 1 : 0} carrying your note</em>
                </p>
                {waiting ? (
                    <Section title="waiting on you" note="a decision only you can give" hot>
                        <Row id={BEAD} title={TITLE} label="needs-human" open />
                    </Section>
                ) : null}
                {flagged ? (
                    <Section title="carrying your note" note="the next session reads these first" hot>
                        <Row id={BEAD} title={TITLE} label="human-note" open />
                    </Section>
                ) : null}
                <Section title="product" note="what shoppers see">
                    <Row id="k2v.1" title="keep the cart and coupon after a declined payment" label="in progress" />
                    <Row id="k2v.3" title="webhook idempotency for payment_intent events" />
                    <Row id="q4n" title="order emails in czech and english" label="in progress" />
                </Section>
                <Section title="bugs" note="defects and regressions">
                    {done ? <Row id={BEAD} title={TITLE} label="in progress" open /> : null}
                    <Row id="b5t" title="cart badge shows 0 after login until a refresh" />
                </Section>
            </div>

            <div className="bs-detail">
                <div className="bs-meta">
                    <span className="bs-id">{BEAD}</span>
                    <span className="bs-lane">bugs</span>
                    <span>{done ? "in progress" : "open"}</span>
                    <span className={`bs-label${done ? " is-gone" : ""}`}>
                        {waiting ? "needs-human" : "human-note"}
                    </span>
                    {phase !== "waiting" ? (
                        <button type="button" className="bs-reset" onClick={reset}>
                            start over
                        </button>
                    ) : null}
                </div>
                <h4 className="bs-title">{TITLE}</h4>

                <div className="bs-thread" aria-live="polite">
                    {note ? (
                        <section className="bs-block">
                            <h5>{phase === "sent" ? "your note, still unread" : "your note"}</h5>
                            <p className="bs-comment">
                                <span className="bs-who bs-who--you">you</span>
                                <span className="bs-when">22:40</span>
                                <span className="bs-text">{note}</span>
                            </p>
                        </section>
                    ) : null}
                    <section className="bs-block">
                        <h5>{note ? "other comments" : "comments"}</h5>
                        <p className="bs-comment">
                            <span className="bs-who">claude</span>
                            <span className="bs-tag">agent</span>
                            <span className="bs-when">21:12</span>
                            <span className="bs-text">
                                found it: the invoice rounds vat per line, stripe is charged a total
                                rounded once per order, and on bigger baskets they drift by up to
                                two cents. a) round per order and print a rounding line. b) round per
                                line and send stripe the summed line totals. i'd take a, but it
                                changes what accounting sees, so it's your call.
                            </span>
                        </p>
                        {phase === "reading" ? (
                            <p className="bs-session">
                                <span className="bs-pulse" aria-hidden="true" />a new session opened{" "}
                                {BEAD} and is reading your note first
                            </p>
                        ) : null}
                        {done ? (
                            <p className="bs-comment bs-comment--new">
                                <span className="bs-who">claude</span>
                                <span className="bs-tag">agent</span>
                                <span className="bs-when">22:41</span>
                                <span className="bs-text">{answer}</span>
                            </p>
                        ) : null}
                    </section>
                </div>

                <form className="bs-composer" onSubmit={onSubmit}>
                    {waiting ? (
                        <>
                            <div className="bs-quick" role="group" aria-label="quick answers">
                                {REPLIES.map((r) => (
                                    <button
                                        type="button"
                                        key={r.note}
                                        onClick={() => send(r.note, r.answer)}
                                    >
                                        {r.note}
                                    </button>
                                ))}
                            </div>
                            <div className="bs-write">
                                <textarea
                                    ref={field}
                                    rows={2}
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={onKey}
                                    placeholder={`or write a note to the next session that opens ${BEAD}…`}
                                    aria-label={`note for the next session that opens ${BEAD}`}
                                />
                                <button type="submit" className="bs-send" disabled={!draft.trim()}>
                                    send note
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="bs-hint">
                            {done ? (
                                <>the agent answered in the thread and took the flag off. that's the loop.</>
                            ) : (
                                <>
                                    sent as a comment under your name, and the bead is labelled{" "}
                                    <code>human-note</code>, so the next session reads it first.
                                </>
                            )}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}

function Section({
    title,
    note,
    hot,
    children,
}: {
    title: string;
    note: string;
    hot?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className={`bs-section${hot ? " is-hot" : ""}`}>
            <p className="bs-section-head">
                <span>{title}</span>
                <small>{note}</small>
            </p>
            <ul>{children}</ul>
        </div>
    );
}

function Row({ id, title, label, open }: { id: string; title: string; label?: string; open?: boolean }) {
    return (
        <li className={`bs-row${open ? " is-open" : ""}`}>
            <span className="bs-row-id">{id}</span>
            <span className="bs-row-title">{title}</span>
            {label ? (
                <span className={`bs-row-label${label === "in progress" ? " is-quiet" : ""}`}>{label}</span>
            ) : null}
        </li>
    );
}
