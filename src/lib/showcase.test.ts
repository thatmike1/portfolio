import { describe, expect, it } from "vitest";
import { ARCHIVE, HIRE_PICKS, SHELF, SHOWCASE, SUPPORTING } from "./showcase";

const PROJECTS = [...SHOWCASE, ...SUPPORTING];
const SMALL = [...SHELF, ...ARCHIVE];

/** every piece of copy a project carries, links' labels included, minus urls and images */
function copyOf(value: unknown): string[] {
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) return value.flatMap(copyOf);
    if (value && typeof value === "object") {
        return Object.entries(value).flatMap(([key, field]) =>
            key === "href" || key === "image" ? [] : copyOf(field),
        );
    }
    return [];
}

describe("project copy", () => {
    it("is lowercase all the way through, names and alt text included", () => {
        // code keeps its own case: appendChild is a function name, not shouting
        const CODE = /\b[a-z]+(?:[A-Z][a-z]*)+\b/g;
        const shouting = [...PROJECTS, ...SMALL]
            .flatMap(copyOf)
            .filter((text) => text.replace(CODE, "") !== text.replace(CODE, "").toLowerCase());
        expect(shouting).toEqual([]);
    });

    it("gives every project a picture with words for people who can't see it", () => {
        for (const project of PROJECTS) {
            expect(project.shots.length, project.id).toBeGreaterThan(0);
            for (const shot of project.shots) expect(shot.alt.length, project.id).toBeGreaterThan(20);
        }
    });

    it("keeps ids unique across the page, since each one is a fragment", () => {
        const ids = [...PROJECTS, ...SMALL].map((item) => item.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("sends outbound links over https only", () => {
        const links = [...PROJECTS, ...SMALL].flatMap((item) => [
            ...item.links.map((link) => link.href),
            ...("href" in item && item.href ? [item.href] : []),
        ]);
        for (const href of links) expect(href).toMatch(/^(https:\/\/|\/)/);
    });

    it("leads /hire with the tools first and the product last", () => {
        expect(HIRE_PICKS.map((project) => project.id)).toEqual([
            "beadside",
            "tally",
            "font-tinder",
            "t3-code",
            "diskzokej",
            "model-map",
            "good-cookie",
        ]);
    });
});
