import FACTS from "./board-facts.json";

/**
 * the numbers the page states, as scripts/board-facts.mjs last read them off the
 * projects. every section carries the day it was read, so a sentence can say how
 * old its number is instead of pretending it is live
 */
export { FACTS };

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** "2026-09-29" as the page says dates: "29 sep 2026", or "29 sep" when the year goes without saying */
export function day(iso: string, withYear = true): string {
    const [y, m, d] = iso.split("-").map(Number);
    return `${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ""}`;
}

/** 6757 as "6,757" */
export const count = (n: number) => n.toLocaleString("en");
