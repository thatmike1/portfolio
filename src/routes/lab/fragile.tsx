import { createFileRoute } from "@tanstack/react-router";
import "./fragile.css";

export const Route = createFileRoute("/lab/fragile")({ component: Page });

function Page() {
    return <main>placeholder: fragile</main>;
}
