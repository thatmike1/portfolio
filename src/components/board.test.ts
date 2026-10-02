// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Board, BOARD_INDEX } from "./board";
import { ARCHIVE, SHELF, SHOWCASE, SUPPORTING } from "../lib/showcase";
import { FACTS } from "../lib/facts";
import { ageOn, isRaining } from "./sky-report";
import { parse } from "./minis/nakup-parse";
import TallyMini from "./minis/tally-mini";
import BeadsideMini from "./minis/beadside-mini";

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

describe("the board", () => {
    it("shows every project at once, nothing behind a tab or a hidden panel", () => {
        const html = renderToString(createElement(Board));
        expect(html).not.toContain('role="tab"');
        expect(html).not.toContain(" hidden=");
        for (const item of [...SHOWCASE, ...SUPPORTING, ...SHELF]) {
            expect(html, item.id).toContain(`id="${item.id}"`);
        }
        for (const item of ARCHIVE) expect(html).toContain(item.text);
    });

    it("has a target on the page for every entry in the masthead's index, in page order", () => {
        const html = renderToString(createElement(Board));
        const positions = BOARD_INDEX.map((entry) => html.indexOf(`id="${entry.id}"`));
        expect(positions.every((p) => p > -1)).toBe(true);
        expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    });

    it("leaves the toys out of the server render, so they cost nothing until someone gets near", () => {
        const html = renderToString(createElement(Board));
        expect(html).toContain("mini-wait");
        expect(html).not.toContain("tally-chart");
        expect(html).not.toContain("bs-composer");
        expect(html).not.toContain("nk-sheet");
    });

    it("states the numbers the facts file holds, not ones typed into the copy", () => {
        const html = renderToString(createElement(Board));
        expect(html).toContain(`${FACTS.tally.commits} commits`);
        expect(html).toContain(`${FACTS.radio.stations} stations`);
        expect(html).toContain(`${FACTS.models.points} operating points`);
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

describe("nákup's quantity parser", () => {
    it("reads a leading or trailing count and a unit, and files the thing by aisle", () => {
        expect(parse("2x bananas")).toEqual({ name: "Bananas", qty: "2×", aisle: "fruit and veg" });
        expect(parse("eggs 6×")).toEqual({ name: "Eggs", qty: "6×", aisle: "dairy and eggs" });
        expect(parse("flour 1kg")).toEqual({ name: "Flour", qty: "1 kg", aisle: "pantry" });
        expect(parse("a new kettle")).toEqual({ name: "A new kettle", qty: undefined, aisle: "other" });
        expect(parse("   ")).toBeNull();
    });
});

describe("tally miniature", () => {
    it("scrubs the block by keyboard and comes back to now on escape", () => {
        render(createElement(TallyMini));
        const chart = screen.getByRole("slider");
        expect(chart.getAttribute("aria-valuenow")).toBe("59");
        fireEvent.keyDown(chart, { key: "Home" });
        expect(chart.getAttribute("aria-valuenow")).toBe("0");
        fireEvent.keyDown(chart, { key: "ArrowRight" });
        fireEvent.keyDown(chart, { key: "ArrowRight" });
        expect(chart.getAttribute("aria-valuetext")).toMatch(/^09:10: 1%/);
        fireEvent.keyDown(chart, { key: "Escape" });
        expect(chart.getAttribute("aria-valuenow")).toBe("59");
    });
});

describe("beadside miniature", () => {
    it("flags the bead with your note, then lets the next session answer and clear the flag", () => {
        vi.useFakeTimers();
        render(createElement(BeadsideMini));
        fireEvent.click(screen.getByRole("button", { name: /^a\. round per order/ }));
        expect(screen.getByText("your note, still unread")).toBeTruthy();
        act(() => {
            vi.advanceTimersByTime(4000);
        });
        expect(screen.getByText(/going with a/)).toBeTruthy();
        expect(screen.queryByText("your note, still unread")).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "start over" }));
        expect(screen.getByRole("button", { name: /^a\. round per order/ })).toBeTruthy();
    });
});
