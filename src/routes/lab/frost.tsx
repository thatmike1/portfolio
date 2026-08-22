import { createFileRoute } from "@tanstack/react-router";
import "./frost.css";

export const Route = createFileRoute("/lab/frost")({ component: Page });

function Page() {
    return <main>placeholder: frost</main>;
}
