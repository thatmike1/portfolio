// @vitest-environment jsdom
import { act, createElement, Fragment } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { INDEX, ProjectEntry, RoomRail } from "./project-collection";
import { ITCHES, SHOWCASE } from "../lib/showcase";

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

const ALL = [...SHOWCASE, ...ITCHES];

/** the rail and every entry, the way the homepage lays them side by side */
const room = () =>
    createElement(
        Fragment,
        null,
        createElement(RoomRail),
        ...ALL.map((project, i) =>
            createElement(ProjectEntry, { key: project.id, project, number: i + 1 }),
        ),
    );

describe("project collection", () => {
    it("renders every project, its shot and its outbound links without javascript", () => {
        const html = renderToString(room());
        for (const project of ALL) {
            expect(html).toContain(`id="${project.id}"`);
            expect(html).toContain(`src="${project.image.src}"`);
            for (const link of project.links) expect(html).toContain(`href="${link.href}"`);
        }
        expect(html).not.toContain(' hidden=""');
    });

    it("indexes every featured project and itch, numbered in page order", () => {
        const numbered = INDEX.flatMap((chapter) => chapter.entries).filter((e) => e.number);
        expect(numbered.map((e) => e.id)).toEqual(ALL.map((p) => p.id));
        expect(numbered.map((e) => e.number)).toEqual(ALL.map((_, i) => i + 1));
    });

    it("never draws a shot past its own pixels", () => {
        const { container } = render(room());
        const figure = container.querySelector("#tally .shot") as HTMLElement;
        expect(figure.style.getPropertyValue("--native")).toBe("1440px");
    });

    it("marks the entry being read in the rail", () => {
        let report: IntersectionObserverCallback = () => {};
        vi.stubGlobal(
            "IntersectionObserver",
            class {
                constructor(callback: IntersectionObserverCallback) {
                    report = callback;
                }
                observe() {}
                disconnect() {}
            },
        );
        render(room());
        const tally = document.getElementById("tally") as HTMLElement;
        act(() =>
            report(
                [{ target: tally, isIntersecting: true } as unknown as IntersectionObserverEntry],
                {} as IntersectionObserver,
            ),
        );
        const current = screen.getByRole("link", { current: "location" });
        expect(current.getAttribute("href")).toBe("#tally");
    });
});
