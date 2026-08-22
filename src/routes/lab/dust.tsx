import { createFileRoute } from "@tanstack/react-router";
import "./dust.css";

export const Route = createFileRoute("/lab/dust")({ component: Page });

function Page() {
    return <main>placeholder: dust</main>;
}
