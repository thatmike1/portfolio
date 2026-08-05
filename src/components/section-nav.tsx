import { useEffect, useRef, useState } from "react";

/**
 * the page's sections, in document order. every label is the section's own heading,
 * so the nav never says anything the page doesn't already say.
 */
const SECTIONS = [
    { id: "top", label: "i make stuff" },
    { id: "things-i-made", label: "things i made" },
    { id: "what-was-mine", label: "what was actually mine" },
    { id: "smaller-things", label: "smaller things" },
    { id: "say-hi", label: "say hi" },
] as const;

/**
 * a table of contents pinned in the right margin that tracks where you are.
 * one observer watches every section against a thin band across the middle of the
 * viewport: whatever crosses that band is what you are reading.
 */
export function SectionNav() {
    const [active, setActive] = useState<string>(SECTIONS[0].id);
    // the band's current occupants, kept outside react — the observer only ever
    // reports what changed, so the full picture has to survive between callbacks
    const inBand = useRef(new Set<string>());

    useEffect(() => {
        const targets = SECTIONS.map(({ id }) => document.getElementById(id)).filter(
            (el): el is HTMLElement => el !== null
        );
        if (!targets.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) inBand.current.add(entry.target.id);
                    else inBand.current.delete(entry.target.id);
                }
                // ties go to the earlier section, so the nav moves down only once the
                // next one has properly taken the band
                const next = SECTIONS.find(({ id }) => inBand.current.has(id));
                if (next) setActive(next.id);
            },
            // a sliver of viewport rather than the whole thing: with the full height
            // three sections can be "visible" at once and the answer is ambiguous
            { rootMargin: "-45% 0px -50% 0px" }
        );

        for (const target of targets) observer.observe(target);
        return () => observer.disconnect();
    }, []);

    return (
        <nav className="section-nav" aria-label="sections">
            <ul>
                {SECTIONS.map(({ id, label }) => {
                    const isActive = id === active;
                    return (
                        <li key={id}>
                            <a
                                className={`section-nav-link${isActive ? " is-active" : ""}`}
                                href={`#${id}`}
                                aria-current={isActive ? "true" : undefined}
                            >
                                <span className="section-nav-mark" aria-hidden="true" />
                                {label}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
