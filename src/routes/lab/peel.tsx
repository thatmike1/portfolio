import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { WeatherHero } from "../../components/weather-hero";
import { HeroCopy } from "../../components/hero-copy";
import "./weather.css";
import "./peel.css";

/**
 * peel — the same weather hero, with its time-of-day pills moved underneath the
 * picture instead of floating over it.
 *
 * everywhere else the three looks are glass pills on top of the canvas: chrome
 * over a picture, which is what every hero on the web does. this prototype asks
 * whether they can live *behind* the canvas and be revealed, by peeling the
 * top-right corner of the sim back like the corner of a sticker.
 *
 * two moves do it, both from this route's stylesheet so weather-hero.tsx and
 * styles.css are untouched: the pills drop to a negative z-index so the canvas
 * covers them, and the canvas gets a clip-path that bites a corner off. the bite
 * is a staircase of 6px squares — the sim's own CELL — because a smooth diagonal
 * in a world drawn at grain resolution reads as a different piece of software.
 *
 * a clip-path alone only makes a hole. the flap is the second half of the idea:
 * the removed triangle mirrored back across the fold, filled with four quantised
 * tones off the theme's own --bg/--ink and a hard one-cell shadow, so the corner
 * reads as lifted material rather than as missing material. the toggle turns it
 * off, which is the comparison this page exists to make.
 */

const TITLE = "peel · lab · mike pšenčík";

export const Route = createFileRoute("/lab/peel")({
    component: Page,
    head: () => ({
        meta: [{ title: TITLE }, { name: "robots", content: "noindex" }],
    }),
});

function Page() {
    const [flap, setFlap] = useState(true);
    // phone only: the steep strip down the right edge, or the desktop's corner shrunk
    const [square, setSquare] = useState(false);

    return (
        <div className={`peel${square ? " is-square" : ""}`}>
            <main className="wx">
                <WeatherHero
                    lab
                    overlay={
                        <div className="wx-words">
                            <p className="wx-crumb">
                                <Link to="/lab">← the lab</Link>
                            </p>
                            <h1>peel</h1>
                            <p className="wx-lede">
                                the three looks are behind the sky, not on it. the canvas is
                                clipped back from the corner in 6px steps and the flap is the
                                piece that came away, folded down over the picture. round two:
                                the looks run down the hypotenuse, a step down and right each,
                                so a diagonal stack fits a diagonal hole.
                            </p>
                        </div>
                    }
                >
                    <HeroCopy />
                </WeatherHero>

                <div className="wx-after" aria-hidden="true">
                    <span>the rest of the page starts here</span>
                </div>
            </main>

            {flap ? <div className="peel-flap" aria-hidden="true" /> : null}

            <div className="peel-toggles">
                <button
                    type="button"
                    className="peel-toggle"
                    onClick={() => setFlap((v) => !v)}
                    aria-pressed={flap}
                >
                    flap {flap ? "on" : "off"}
                </button>
                <button
                    type="button"
                    className="peel-toggle"
                    onClick={() => setSquare((v) => !v)}
                    aria-pressed={square}
                    title="phone only: the strip down the edge, or the corner shrunk"
                >
                    phone fold: {square ? "corner" : "strip"}
                </button>
            </div>
        </div>
    );
}
