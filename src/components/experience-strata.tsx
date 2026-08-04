import { PRIOR, ROLES } from "../data/experience";
import "./experience-strata.css";

/**
 * variant b — "two years, in layers".
 *
 * the hero of this site is a falling-sand toy, so the paid work is rendered as
 * sediment: one band per client build, thickness set by commit count, grains
 * settling toward the bottom edge of each layer the way settled sand does.
 * newest on top, which is both sediment logic and reverse-chronological order.
 *
 * the grains are dots ON the surface rather than a fill, so body text keeps its
 * contrast against --bg and raspberry stays an accent (DESIGN.md: the color
 * works grainy, not flat).
 *
 * disclosure is a native <details>, so it opens with no javascript, works from
 * the keyboard, and prints expanded.
 */

/** visual weight per build: band height and grain hue, keyed off the data */
const SEDIMENT: Record<string, { band: string; grain: string; grainDark: string }> = {
    "job marketplace, ios + android": {
        band: "clamp(8.5rem, 17vw, 11.5rem)",
        grain: "oklch(0.6 0.21 357)",
        grainDark: "oklch(0.66 0.21 357)",
    },
    "internal tools for an energy group": {
        band: "clamp(6rem, 12vw, 7.5rem)",
        grain: "oklch(0.64 0.13 250)",
        grainDark: "oklch(0.68 0.13 250)",
    },
    "staffing marketplace mvp": {
        band: "clamp(5.25rem, 10.5vw, 6.5rem)",
        /* amber has to sit lower than the canvas palette to hold up on white */
        grain: "oklch(0.68 0.14 75)",
        grainDark: "oklch(0.8 0.14 75)",
    },
    "and the shorter ones": {
        band: "clamp(4rem, 8vw, 4.75rem)",
        grain: "oklch(0.45 0.02 357)",
        grainDark: "oklch(0.62 0.015 357)",
    },
};

const FALLBACK = {
    band: "clamp(4rem, 8vw, 4.75rem)",
    grain: "oklch(0.45 0.02 357)",
    grainDark: "oklch(0.62 0.015 357)",
};

export function ExperienceStrata() {
    const [atreo] = ROLES;

    return (
        <section className="strata" aria-labelledby="strata-heading">
            <div className="container">
                <h2 id="strata-heading">two years, in layers</h2>
                <p className="section-sub">
                    one contract, several clients at once. thicker band, more commits. open a layer
                    to see what was actually in it.
                </p>

                <p className="strata-role">
                    <span className="strata-role-when">{atreo.when}</span>
                    {atreo.org} · {atreo.note}
                </p>

                <div className="strata-stack">
                    {atreo.engagements?.map((eng) => {
                        const s = SEDIMENT[eng.what] ?? FALLBACK;
                        return (
                            <details
                                className="strata-band"
                                key={eng.what}
                                style={
                                    {
                                        "--band": s.band,
                                        "--grain": s.grain,
                                        "--grain-dark": s.grainDark,
                                    } as React.CSSProperties
                                }
                            >
                                <summary className="strata-summary">
                                    <span className="strata-name">{eng.what}</span>
                                    <span className="strata-meta">
                                        {eng.metric ? (
                                            <span className="strata-metric">{eng.metric}</span>
                                        ) : null}
                                        <span className="strata-toggle" aria-hidden="true" />
                                    </span>
                                </summary>
                                <div className="strata-detail">
                                    <p className="strata-client">{eng.client}</p>
                                    <p className="strata-body">{eng.body}</p>
                                    <p className="strata-tech">{eng.stack}</p>
                                </div>
                            </details>
                        );
                    })}
                    <p className="strata-bedrock">
                        <span className="strata-role-when">{PRIOR.when}</span>
                        {PRIOR.body}
                    </p>
                </div>

                <p className="strata-availability">
                    the atreo contract ends in august 2026, so from september i'm looking — contract
                    or full-time, remote, and happy to talk specifics that aren't on this page.{" "}
                    <a href="mailto:misa.psencik@gmail.com">misa.psencik@gmail.com</a>.
                </p>
            </div>
        </section>
    );
}
