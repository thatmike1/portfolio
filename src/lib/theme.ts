import type { ThemeName } from "./sand-engine";

/**
 * the page's three times of day. light and dark are the ends a system setting can
 * pick; dusk only exists because the visitor chose it.
 */
export type Theme = "light" | "dusk" | "dark";

export const THEMES: ReadonlyArray<Theme> = ["light", "dusk", "dark"];

export const isTheme = (v: unknown): v is Theme =>
    v === "light" || v === "dusk" || v === "dark";

/** the theme the pre-paint head script put on the root; light if it is missing */
export function readTheme(): Theme {
    if (typeof document === "undefined") return "light";
    const t = document.documentElement.dataset.theme;
    return isTheme(t) ? t : "light";
}

/** set the theme on the root and remember it for the next visit */
export function applyTheme(theme: Theme): void {
    document.documentElement.dataset.theme = theme;
    try {
        localStorage.setItem("theme", theme);
    } catch {
        // private mode etc., the toggle still works for this visit
    }
}

/**
 * which grain palette a theme draws with. dusk sits on a dark ground, so its grains
 * are the night's brighter shades: the light set goes muddy on anything but white.
 */
export const paletteFor = (theme: Theme): ThemeName => (theme === "light" ? "light" : "dark");
