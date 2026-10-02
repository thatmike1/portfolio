import SNAPSHOT from "./model-map-points.json";
import { day } from "../../lib/facts";

/**
 * the current-tier operating points on models.thatmike1.dev, as scripts/board-facts.mjs
 * last read them off the live page (artificial analysis intelligence index). one row per
 * model and reasoning effort: [model, vendor, effort, intel index, $ per task, thousand
 * output tokens per task]. an empty effort means the vendor has no dial. it lives in the
 * toy's own chunk, so the page doesn't carry it until the toy loads
 */
export type ModelPoint = [string, string, string, number, number, number];

export const POINTS = SNAPSHOT.points as ModelPoint[];

export const SNAPSHOT_DATE = day(SNAPSHOT.refreshed);

/** the map's own vendor colours, so a dot here is the same colour as on the site */
export const VENDOR_COLOR: Record<string, string> = {
    Anthropic: "#d97757",
    OpenAI: "#5b9cf0",
    Google: "#34b37f",
    SpaceXAI: "#a78bfa",
    Kimi: "#f472b6",
    "Z AI": "#d4b13a",
    Alibaba: "#22c3c3",
    DeepSeek: "#8c8ff5",
    MiniMax: "#f59e0b",
};

/** which version of the artificial analysis index the scores come from */
export const VERSION = SNAPSHOT.version;
