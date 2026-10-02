// @vitest-environment jsdom
import { createElement } from "react";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectCollection } from "./project-collection";
import { SHOWCASE } from "../lib/showcase";
import { parse } from "./minis/nakup-parse";
import TallyMini from "./minis/tally-mini";
import BeadsideMini from "./minis/beadside-mini";

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

describe("project collection", () => {
    it("puts every featured project on the page at once, with no tabs to hide any of them", () => {
        const html = renderToString(createElement(ProjectCollection));
        for (const project of SHOWCASE) {
            expect(html).toContain(`id="${project.id}"`);
            expect(html).toContain(`href="#${project.id}"`);
            for (const link of project.links) expect(html).toContain(`href="${link.href}"`);
        }
        expect(html).not.toContain('role="tab"');
        expect(html).not.toContain(" hidden=");
    });

    it("leaves the toys out of the server render, so they cost nothing until someone gets near", () => {
        const html = renderToString(createElement(ProjectCollection));
        expect(html).toContain("mini-wait");
        expect(html).not.toContain("tally-chart");
        expect(html).not.toContain("bs-composer");
    });
});

describe("nákup's quantity parser", () => {
    it("reads a leading or trailing count and a unit, and files the thing by aisle", () => {
        expect(parse("2x bananas")).toEqual({ name: "Bananas", qty: "2×", aisle: "fruit and veg" });
        expect(parse("eggs 6×")).toEqual({ name: "Eggs", qty: "6×", aisle: "dairy and eggs" });
        expect(parse("flour 1kg")).toEqual({ name: "Flour", qty: "1 kg", aisle: "pantry" });
        expect(parse("a new kettle")).toEqual({
            name: "A new kettle",
            qty: undefined,
            aisle: "other",
        });
        expect(parse("   ")).toBeNull();
    });
});

describe("tally miniature", () => {
    it("scrubs the block by keyboard and comes back to now on escape", () => {
        render(createElement(TallyMini));
        const chart = screen.getByRole("slider");
        expect(chart.getAttribute("aria-valuenow")).toBe("54");
        fireEvent.keyDown(chart, { key: "Home" });
        expect(chart.getAttribute("aria-valuenow")).toBe("0");
        fireEvent.keyDown(chart, { key: "ArrowRight" });
        expect(chart.getAttribute("aria-valuetext")).toMatch(/^20:27: 2%/);
        fireEvent.keyDown(chart, { key: "Escape" });
        expect(chart.getAttribute("aria-valuenow")).toBe("54");
    });
});

describe("beadside miniature", () => {
    it("flags the bead with your note, then lets the next session answer and clear the flag", () => {
        vi.useFakeTimers();
        render(createElement(BeadsideMini));
        fireEvent.click(screen.getByRole("button", { name: "iso. it sorts." }));
        expect(screen.getByText("your note, still unread")).toBeTruthy();
        act(() => {
            vi.advanceTimersByTime(4000);
        });
        expect(screen.getByText(/going with iso/)).toBeTruthy();
        expect(screen.queryByText("your note, still unread")).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "start over" }));
        expect(screen.getByRole("button", { name: "iso. it sorts." })).toBeTruthy();
    });
});
