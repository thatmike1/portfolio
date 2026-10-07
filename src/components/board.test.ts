// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Board, BOARD_INDEX } from "./board";
import { ARCHIVE, SHELF, SHOWCASE, SUPPORTING } from "../lib/showcase";
import { FACTS } from "../lib/facts";
import { ageOn, nextSky, rainingAfter, SkyColumn, skyBandAfter } from "./sky-report";
import type { Sky } from "./sky-report";
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
        expect(html).toContain(`${FACTS.breakbeat.combinations} combinations a feel`);
    });
});

describe("the sky column", () => {
    it("works out sora's age the way a person says it", () => {
        expect(ageOn(new Date(2026, 9, 2))).toEqual({ years: 1, months: 2, days: 17 });
        expect(ageOn(new Date(2026, 6, 15))).toEqual({ years: 1, months: 0, days: 0 });
        expect(ageOn(new Date(2026, 7, 3))).toEqual({ years: 1, months: 0, days: 19 });
    });

    it("shows sora's own portrait, never a sticker, whatever the sky is doing", () => {
        vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
        for (const theme of ["light", "dusk", "dark"]) {
            document.documentElement.dataset.theme = theme;
            render(createElement(SkyColumn, {}));
            const pic = screen.getByRole("img", { name: /^sora/ });
            expect(pic.getAttribute("src")).toBe("/sora/sora.webp");
            cleanup();
        }
        vi.unstubAllGlobals();
        delete document.documentElement.dataset.theme;
    });

    it("calls it rain from what the clouds let go, and holds the call through a patchy shower", () => {
        expect(rainingAfter(false, [40, 40, 40])).toBe(false);
        expect(rainingAfter(false, [0, 0, 0, 0, 0, 0])).toBe(false);
        expect(rainingAfter(false, [20, 25, 30, 22, 18, 26])).toBe(true);
        // a lull that would not start the rain does not stop it either
        expect(rainingAfter(true, [8, 6, 9, 7, 5, 8])).toBe(true);
        expect(rainingAfter(false, [8, 6, 9, 7, 5, 8])).toBe(false);
        expect(rainingAfter(true, [3, 2, 1, 0, 2, 1])).toBe(false);
    });

    it("holds still on readings that used to flap it every second", () => {
        // a minute of a real shower at 1440, with its gusts and gaps
        const fell = [16, 22, 16, 18, 24, 22, 21, 16, 32, 25, 9, 6, 4, 11, 30, 40, 31, 29, 32, 25, 16, 30];
        const cover = [0.29, 0.31, 0.3, 0.32, 0.28, 0.32, 0.31, 0.3, 0.29, 0.31, 0.32, 0.3, 0.31, 0.29, 0.32];
        let sky: Sky = { hud: null, drops: [], fell: [], readings: 0, raining: false, band: null };
        const said: string[] = [];
        fell.forEach((f, i) => {
            sky = nextSky(sky, { humidity: 0.5, cover: cover[i % cover.length], drops: 900 + (i % 3) * 40, fell: f });
            said.push(`${sky.raining}/${sky.band}`);
        });
        const changes = said.filter((s, i) => i > 0 && s !== said[i - 1]);
        // it starts raining once, and the cover wobbling round a cut never moves the words
        expect(changes).toEqual(["true/1"]);
    });

    it("moves the sky words only once the cover is clearly in the next band", () => {
        expect(skyBandAfter(null, 0.31)).toBe(2);
        expect(skyBandAfter(1, 0.31)).toBe(1);
        expect(skyBandAfter(1, 0.34)).toBe(2);
        expect(skyBandAfter(2, 0.29)).toBe(2);
        expect(skyBandAfter(2, 0.26)).toBe(1);
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
