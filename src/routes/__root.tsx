import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import appCss from "../styles.css?url";

const TITLE = "mike pšenčík · i make stuff";
const DESCRIPTION =
    "frontend dev in czechia. falling-sand toys, claude code skills, a git time-tracker, and landing pages with personality. sometimes it works, sometimes it doesn't.";

// runs before first paint so the saved theme never flashes the wrong colors
const THEME_INIT = `(function(){try{var t=localStorage.getItem('theme');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}})()`;

export const Route = createRootRoute({
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { title: TITLE },
            { name: "description", content: DESCRIPTION },
            { property: "og:title", content: TITLE },
            { property: "og:description", content: DESCRIPTION },
            { property: "og:type", content: "website" },
            { name: "twitter:card", content: "summary" },
        ],
        links: [
            { rel: "stylesheet", href: appCss },
            { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
        ],
        scripts: [{ children: THEME_INIT }],
    }),
    shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* two media-scoped theme-colors; HeadContent dedupes by name, so they live here */}
                <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
                <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1c1418" />
                <HeadContent />
            </head>
            <body>
                {children}
                <TanStackDevtools
                    config={{ position: "bottom-right" }}
                    plugins={[
                        {
                            name: "Tanstack Router",
                            render: <TanStackRouterDevtoolsPanel />,
                        },
                    ]}
                />
                <Scripts />
            </body>
        </html>
    );
}
