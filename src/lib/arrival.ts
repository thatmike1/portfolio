import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

/**
 * where an element is in its one entrance. "settled" is the final state and the
 * only one the server, a visitor without javascript or one who asked for reduced
 * motion ever sees; "waiting" means it is still below the fold and may enter;
 * "arriving" is the single run of its entrance, after which it is left alone
 */
export type Arrival = "settled" | "waiting" | "arriving";

export const reducedMotion = (): boolean =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * one entrance per element, the first time it scrolls into view. an element that is
 * already on screen when the page lands never animates: it is simply there, so the
 * page is complete at first paint and nothing blinks on hydration. the ref goes on
 * the element to watch; the state goes on it as `data-arrival` for the css to read
 */
export function useArrival<T extends Element>(threshold = 0.35): [RefObject<T | null>, Arrival] {
    const ref = useRef<T>(null);
    const [state, setState] = useState<Arrival>("settled");

    useEffect(() => {
        const node = ref.current;
        if (!node || reducedMotion() || typeof IntersectionObserver === "undefined") return;
        let first = true;
        const observer = new IntersectionObserver(
            (entries) => {
                const seen = entries.some((entry) => entry.isIntersecting);
                if (first) {
                    first = false;
                    if (seen) {
                        observer.disconnect();
                        return;
                    }
                    setState("waiting");
                    return;
                }
                if (seen) {
                    setState("arriving");
                    observer.disconnect();
                }
            },
            { threshold },
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [threshold]);

    return [ref, state];
}
