import posthog from "posthog-js";
import { useEffect } from "react";

// the project key is a public, write-only token by design, so it lives in source
const POSTHOG_KEY = "phc_sFy73FRtsFNE5tS7i68mK2nyS9hJBjgKSrhk2hD2WPFP";
const POSTHOG_HOST = "https://eu.i.posthog.com";

/**
 * headless chrome's default 800x600 screen, which no real device reports. the
 * scanners that hit these sites fake their user agent and hide
 * navigator.webdriver, so posthog's own bot filter lets them through.
 */
function looksHeadless(): boolean {
    return window.screen.width === 800 && window.screen.height === 600;
}

/**
 * boots posthog once on the client. memory persistence means no cookie and no
 * localStorage entry, so no consent banner; history_change counts spa route
 * changes as pageviews
 */
export function initAnalytics(): void {
    if (typeof window === "undefined" || posthog.__loaded) return;
    if (import.meta.env.DEV || POSTHOG_KEY.startsWith("__") || looksHeadless()) return;
    posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        persistence: "memory",
        capture_pageview: "history_change",
        capture_pageleave: true,
        autocapture: false,
        disable_session_recording: true,
    });
}

/** renders nothing; mounts analytics after hydration */
export function Analytics() {
    useEffect(() => {
        initAnalytics();
    }, []);
    return null;
}
