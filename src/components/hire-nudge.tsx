import { useEffect, useState } from "react";

/** the section whose reading the nudge accompanies; it is hidden everywhere else on the page */
const SECTION_ID = "things-i-made";
const STORAGE_KEY = "hire-nudge-collapsed";

/**
 * a small card pinned bottom-left that offers the recruiter door while the reader is
 * in the side-project section — the stretch where someone hiring is most likely to
 * decide this page is all toys and leave. it stays out of the hero (the sand owns
 * that), and once the reader reaches the paid work it has nothing left to say, so
 * it goes.
 *
 * dismissing folds the card down to a small tab at the edge rather than removing it,
 * the way a cookie banner leaves a fingerprint behind: the offer stays reachable,
 * it just stops taking up room. the folded state lasts the browser tab.
 */
export function HireNudge() {
    const [inSection, setInSection] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    // read storage after hydration so server and first client render agree
    useEffect(() => {
        try {
            setCollapsed(sessionStorage.getItem(STORAGE_KEY) === "1");
        } catch {
            // no storage: start open
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

    const open = inSection && !collapsed;
    const folded = inSection && collapsed;

    const fold = (next: boolean) => {
        setCollapsed(next);
        try {
            sessionStorage.setItem(STORAGE_KEY, next ? "1" : "0");
        } catch {
            // private mode or storage full: the state still flips for this render
        }
    };

    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") fold(true);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    return (
        <aside
            className={`hire-nudge${open ? " is-visible" : ""}${folded ? " is-folded" : ""}`}
            aria-label="hiring?"
            aria-hidden={inSection ? undefined : "true"}
        >
            <button
                type="button"
                className="hire-nudge-tab"
                onClick={() => fold(false)}
                aria-expanded={open}
                tabIndex={folded ? undefined : -1}
            >
                hiring?
                <span className="hire-nudge-caret" aria-hidden="true" />
            </button>
            <p className="hire-nudge-title">not here for the sand?</p>
            <p className="hire-nudge-body">
                there's a page for people who are hiring: the paid work, the stack, the dates,
                none of the toys.
            </p>
            <p className="hire-nudge-actions">
                <a className="hire-nudge-cta" href="/hire" tabIndex={open ? undefined : -1}>
                    see the hire page
                    <span className="arrow" aria-hidden="true">
                        {"→"}
                    </span>
                </a>
                <button
                    type="button"
                    className="hire-nudge-dismiss"
                    onClick={() => fold(true)}
                    tabIndex={open ? undefined : -1}
                >
                    i'm fine with the sand
                </button>
            </p>
        </aside>
    );
}
