import { useState } from "react";
import type { AnimationEvent } from "react";

/**
 * the intro block under the sky. shared by the front page and the weather lab,
 * so the falls are always measured against the words they actually run past. the
 * front page asks for the wide version: the heading and the words beside it rather
 * than under it, across the island instead of down a column.
 */
export function HeroCopy({ wide = false }: { wide?: boolean }) {
    // the hop owns itself once it starts: hovering again mid-flight is ignored, so the
    // grain always finishes the arc it is on instead of snapping back to the start
    const [hopping, setHopping] = useState(false);
    const endHop = (event: AnimationEvent<HTMLSpanElement>) => {
        if (event.animationName.includes("hero-stop-hop")) setHopping(false);
    };
    // under reduced motion the hop animation is switched off, so nothing would ever fire
    // animationend to clear the flag — the state would stick and the grain would hop the
    // moment the reader turned the setting back off. so never start it in the first place
    const startHop = () => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        setHopping(true);
    };

    return (
        <div className={`container hero-copy${wide ? " hero-copy--wide" : ""}`}>
            <h1 onMouseEnter={startHop}>
                i make stuff
                <span
                    className={`hero-stop${hopping ? " is-hopping" : ""}`}
                    onAnimationEnd={endHop}
                >
                    .
                </span>
            </h1>
            <div className="hero-copy-side">
                <p className="lede">
                    i'm mike, a full-stack product engineer in czechia. react and typescript on top,
                    node underneath, and i'd rather own the whole slice than half of it. i do stuff,
                    sometimes it works and sometimes it doesn't, but give me enough time and i'll
                    make it work. <em>probably.</em>
                </p>
                <p className="hero-doors">
                    <a href="#things-i-made">the things i made ↓</a>
                    <a href="/hire">hiring? the short version →</a>
                </p>
                <p className="hero-note">
                    the sand up there is real, go make a mess. it's a tiny cousin of{" "}
                    <a href="https://github.com/thatmike1/powder-lab">powder-lab</a>. the weather is
                    real too: the clouds rain, the lake fills, the falls carry it back.
                </p>
            </div>
        </div>
    );
}
