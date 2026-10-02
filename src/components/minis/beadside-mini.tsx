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

const BEAD = "wait-3";

const REPLIES = [
    {
        note: "iso. it sorts.",
        answer: "going with iso: the export writes 2026-10-02 and the column header says so. flag cleared, i'll close it when the test passes.",
    },
    {
        note: "local, people open it in excel",
        answer: "local it is: 2. 10. 2026 in the visible column, iso kept in a hidden one so sorting still works. flag cleared.",
    },
    {
        note: "make it a setting, default iso",
        answer: "added an export setting, iso by default, local one click away in the dialog. flag cleared.",
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
                        <Row id={BEAD} title="date format for the csv export" label="needs-human" open />
                    </Section>
                ) : null}
                {flagged ? (
                    <Section title="carrying your note" note="the next session reads these first" hot>
                        <Row id={BEAD} title="date format for the csv export" label="human-note" open />
                    </Section>
                ) : null}
                <Section title="product" note="customer-facing features">
                    {done ? (
                        <Row id={BEAD} title="date format for the csv export" label="in progress" open />
                    ) : null}
                    <Row id="prod-4" title="offline queue retries twice" label="in progress" />
                    <Row id="prod-6" title="keyboard shortcut cheat-sheet" />
                    <Row id="prod-7" title="empty state for a new workspace" />
                </Section>
                <Section title="bugs" note="defects and regressions">
                    <Row id="bug-2" title="toast hides the undo button" />
                </Section>
            </div>

            <div className="bs-detail">
                <div className="bs-meta">
                    <span className="bs-id">{BEAD}</span>
                    <span className="bs-lane">product</span>
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
                <h4 className="bs-title">date format for the csv export</h4>

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
                                stopped here. iso dates (2026-10-02) sort, local ones (2. 10. 2026)
                                read better in excel. both are a one-line change, but it's your call
                                which one people see.
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
