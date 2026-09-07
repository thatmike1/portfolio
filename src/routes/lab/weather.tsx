import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { WeatherHero } from "../../components/weather-hero";
import type { Ground } from "../../components/weather-hero";
import { HeroCopy } from "../../components/hero-copy";
import "./weather.css";

/**
 * weather — the front page's hero, with the lab's readout and a soak button.
 *
 * the simulation graduated to the front page, so this route renders the same
 * component with the lab chrome switched on: the drop count in the readout, a
 * soak button that lifts every drop back into the air, and the dev-only `__wx`
 * probes the acceptance checks read the lake through. tuning happens in
 * src/components/weather-hero.tsx and lands on both pages at once.
 *
 * the ground toggle is a prototype of mike's idea from 2026-09-04: below the
 * hero the island's rock carries on as the page's background, so the page is
 * the ground the island sits in instead of the colour it dissolves into. "rock"
 * is the keel's own tones, "washed" the same tile lifted most of the way to the
 * page. the two questions it exists to answer are whether the copy stays
 * legible and whether a still texture next to a live one reads as deliberate.
 */

const GROUNDS: Ground[] = ["off", "rock", "washed"];

const TITLE = "weather · lab · mike pšenčík";

export const Route = createFileRoute("/lab/weather")({
    component: Page,
    head: () => ({
        meta: [{ title: TITLE }, { name: "robots", content: "noindex" }],
    }),
});

function Page() {
    const [ground, setGround] = useState<Ground>("off");
    const cycle = () => setGround((g) => GROUNDS[(GROUNDS.indexOf(g) + 1) % GROUNDS.length]);

    return (
        <main className={`wx${ground === "off" ? "" : " is-ground"}`}>
            <WeatherHero
                lab
                ground={ground}
                overlay={
                    <div className="wx-words">
                        <p className="wx-crumb">
                            <Link to="/lab">← the lab</Link>
                        </p>
                        <h1>weather</h1>
                        <p className="wx-lede">
                            clouds are fractal noise snapped to the sand grid. dense cells rain,
                            rain fills the lake, the lake runs off both ends of the island and
                            falls past the page. nothing here is animated. it is one loop feeding
                            itself. the three looks are the site's three themes.
                        </p>
                    </div>
                }
            >
                <HeroCopy />
            </WeatherHero>

            <div className="wx-after" aria-hidden="true">
                <span>the rest of the page starts here</span>
            </div>

            <button type="button" className="wx-toggle" onClick={cycle}>
                ground: {ground}
            </button>
        </main>
    );
}
