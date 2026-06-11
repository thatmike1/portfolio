import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import appCss from "../styles.css?url";

const TITLE = "mike pšenčík · i make stuff";
const DESCRIPTION =
    "frontend dev in czechia. falling-sand toys, claude code skills, a git time-tracker, and landing pages with personality. sometimes it works, sometimes it doesn't.";

export const Route = createRootRoute({
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { title: TITLE },
            { name: "description", content: DESCRIPTION },
            { name: "theme-color", content: "#c2185b" },
            { property: "og:title", content: TITLE },
            { property: "og:description", content: DESCRIPTION },
            { property: "og:type", content: "website" },
            { name: "twitter:card", content: "summary" },
        ],
        links: [
            { rel: "stylesheet", href: appCss },
            { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
        ],
    }),
    shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
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
