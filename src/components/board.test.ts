// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Board, BOARD_INDEX } from "./board";
import { SHOWCASE } from "../lib/showcase";
import { ageOn, isRaining } from "./sky-report";

afterEach(cleanup);

describe("the board", () => {
    it("shows every project at once, nothing behind a tab or a hidden panel", () => {
        const { container } = render(createElement(Board));
        expect(container.querySelector('[role="tab"]')).toBeNull();
        expect(container.querySelector("[hidden]")).toBeNull();
        for (const project of SHOWCASE) {
            expect(container.querySelector(`#${project.id}`)).not.toBeNull();
        }
    });

    it("has a target on the page for every entry in the masthead's index", () => {
        const { container } = render(createElement(Board));
        for (const entry of BOARD_INDEX) {
            expect(container.querySelector(`#${entry.id}`), entry.id).not.toBeNull();
        }
    });

    it("leaves the outbound arrow to css, so a link never ends in two of them", () => {
        const { container } = render(createElement(Board));
        const outbound = [...container.querySelectorAll<HTMLAnchorElement>('a[href^="http"]')];
        expect(outbound.length).toBeGreaterThan(0);
        for (const link of outbound) expect(link.textContent).not.toContain("↗");
    });
});

describe("the sky column", () => {
    it("works out sora's age the way a person says it", () => {
        expect(ageOn(new Date(2026, 9, 2))).toEqual({ years: 1, months: 2, days: 17 });
        expect(ageOn(new Date(2026, 6, 15))).toEqual({ years: 1, months: 0, days: 0 });
        expect(ageOn(new Date(2026, 7, 3))).toEqual({ years: 1, months: 0, days: 19 });
    });

    it("calls it rain only when water is arriving", () => {
        expect(isRaining([1000, 1010, 1020])).toBe(false);
        expect(isRaining([1000, 1020, 1050, 1100])).toBe(true);
        expect(isRaining([1100, 1080, 1060, 1050])).toBe(false);
    });
});
