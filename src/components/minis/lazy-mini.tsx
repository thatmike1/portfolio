import { Suspense, useEffect, useRef, useState } from "react";
import type { ComponentType, LazyExoticComponent, ReactNode } from "react";
import { useArrival } from "../../lib/arrival";
import "./lazy-mini.css";

type LazyMiniProps = {
    /** a React.lazy component, created once at module level so its import only fires on first render */
    toy: LazyExoticComponent<ComponentType>;
    /** what the toy is, for the slot's label and for anyone who never gets the javascript */
    label: string;
    /** reserved height while the toy loads, so nothing under it jumps */
    minHeight: string;
    /** the line under the toy: what you can do with it, and what it is not */
    caption: ReactNode;
    className?: string;
};

/**
 * a working miniature that only loads when the reader gets near it. the server and
 * a visitor without javascript get the quiet placeholder; everyone else gets the toy
 * about a screen before it scrolls into view, so it is ready by the time it is seen.
 */
export function LazyMini({ toy: Toy, label, minHeight, caption, className }: LazyMiniProps) {
    const slot = useRef<HTMLDivElement>(null);
    const [near, setNear] = useState(false);
    // the grain before "try it" drops in once when the caption scrolls into view
    const [mark, markArrival] = useArrival<HTMLSpanElement>(1);

    useEffect(() => {
        const node = slot.current;
        if (!node) return;
        if (typeof IntersectionObserver === "undefined") {
            setNear(true);
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setNear(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "900px 0px 900px 0px" },
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    const placeholder = (
        <div className="mini-wait" aria-hidden="true">
            <span className="mini-wait-grain" />
        </div>
    );

    return (
        <figure className={`mini${className ? ` ${className}` : ""}`} aria-label={label}>
            {/* the instruction comes first: a reader should know it is a toy before touching it */}
            <figcaption className="mini-caption">
                <span className="toy-mark" ref={mark} data-arrival={markArrival} aria-hidden="true" />
                <span>{caption}</span>
            </figcaption>
            <div className="mini-stage" ref={slot} style={{ minHeight }}>
                {near ? <Suspense fallback={placeholder}>{<Toy />}</Suspense> : placeholder}
            </div>
        </figure>
    );
}
