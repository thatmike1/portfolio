import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

import viteReact from "@vitejs/plugin-react";

const config = defineConfig({
    resolve: { tsconfigPaths: true },
    // nitro() is what makes the build deployable: it auto-detects the host
    // (vercel in CI, node-server locally) and emits the right output format.
    plugins: [devtools(), tanstackStart(), nitro(), viteReact()],
});

export default config;
