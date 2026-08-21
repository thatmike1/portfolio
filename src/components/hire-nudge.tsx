import { useEffect, useState } from "react";

/** the section whose reading the nudge accompanies; it is hidden everywhere else on the page */
const SECTION_ID = "things-i-made";
const STORAGE_KEY = "hire-nudge-dismissed";

/**
 * a small card pinned bottom-left that offers the recruiter door while the reader is
 * in the side-project section — the stretch where someone hiring is most likely to
 * decide this page is all toys and leave. it stays out of the hero (the sand owns
 * that), and once the reader reaches the paid work it has nothing left to say, so
 * it goes.
 *
 * one dismissal lasts the tab: the card is an offer, not a nag.
 */
export function HireNudge() {
    const [inSection, setInSection] = useState(false);
    const [dismissed, setDismissed] = useState(true);

    // read storage after hydration so server and first client render agree
    useEffect(() => {
        try {
            setDismissed(sessionStorage.getItem(STORAGE_KEY) === "1");
        } catch {
            setDismissed(false);
        }
    }, []);

    useEffect(() => {
        const section = document.getElementById(SECTION_ID);
        if (!section) return;
        // the band is the middle of the viewport, the same trick the section nav uses:
        // the card shows while the projects occupy what the reader is looking at
        const observer = new IntersectionObserver(
            ([entry]) => setInSection(entry.isIntersecting),
            { rootMargin: "-35% 0px -35% 0px" }
        );
        observer.observe(section);
        return () => observer.disconnect();
    }, []);

    const visible = inSection && !dismissed;

    const dismiss = () => {
        setDismissed(true);
        try {
            sessionStorage.setItem(STORAGE_KEY, "1");
        } catch {
            // private mode or storage full: the card still goes for this render
        }
    };

    useEffect(() => {
        if (!visible) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") dismiss();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [visible]);

    return (
        <aside
            className={`hire-nudge${visible ? " is-visible" : ""}`}
            aria-label="hiring?"
            aria-hidden={visible ? undefined : "true"}
        >
            <p className="hire-nudge-title">not here for the sand?</p>
            <p className="hire-nudge-body">
                there's a page for people who are hiring: the paid work, the stack, the dates,
                none of the toys.
            </p>
            <p className="hire-nudge-actions">
                <a className="hire-nudge-cta" href="/hire" tabIndex={visible ? undefined : -1}>
                    see the hire page
                    <span className="arrow" aria-hidden="true">
                        {"→"}
                    </span>
                </a>
                <button
                    type="button"
                    className="hire-nudge-dismiss"
                    onClick={dismiss}
                    tabIndex={visible ? undefined : -1}
                >
                    i'm fine with the sand
                </button>
            </p>
        </aside>
    );
}
