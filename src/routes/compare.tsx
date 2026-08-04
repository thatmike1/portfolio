import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Experience } from "../components/experience";
import { ExperienceStrata } from "../components/experience-strata";
import { ExperienceRunon } from "../components/experience-runon";
import { ExperienceHandover } from "../components/experience-handover";
import "./compare.css";

export const Route = createFileRoute("/compare")({ component: Compare });

/**
 * a review-only route for picking between the work-experience variants. not
 * linked from anywhere and noindexed; delete this file and compare.css once a
 * version wins.
 */
const VARIANTS = [
    {
        id: "rows",
        label: "a · rows",
        blurb: "the same full-width rows as the projects above, one contract holding four builds, sticky left rail.",
        render: () => <Experience />,
    },
    {
        id: "strata",
        label: "b · strata",
        blurb: "the contract as sediment. band thickness is commit count, grains settle toward the bottom of each layer, click to dig in.",
        render: () => <ExperienceStrata />,
    },
    {
        id: "runon",
        label: "c · the run-on",
        blurb: "two years as one unbroken sentence with the specifics as footnotes. a vertical list reads as sequence; these four were all live at once, so the grammar carries the concurrency instead of the copy claiming it.",
        render: () => <ExperienceRunon />,
    },
    {
        id: "handover",
        label: "d · the handover",
        blurb: "sorted by how much of each build was actually his, descending — which puts the 450-commit mvp above the 900-commit app and the famous clients last. the hollow marks name what wasn't his, which is what makes the rest credible.",
        render: () => <ExperienceHandover />,
    },
];

function Compare() {
    const [active, setActive] = useState(VARIANTS[0].id);
    const current = VARIANTS.find((v) => v.id === active) ?? VARIANTS[0];

    return (
        <main className="cmp">
            <div className="cmp-bar">
                <div className="container cmp-bar-inner">
                    <p className="cmp-title">work experience · variants</p>
                    <div className="cmp-switch" role="tablist" aria-label="variant">
                        {VARIANTS.map((v) => (
                            <button
                                key={v.id}
                                type="button"
                                role="tab"
                                aria-selected={v.id === active}
                                className="cmp-tab"
                                onClick={() => setActive(v.id)}
                            >
                                {v.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <p className="container cmp-blurb">{current.blurb}</p>

            {current.render()}
        </main>
    );
}
