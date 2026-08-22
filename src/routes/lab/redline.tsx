import { createFileRoute } from "@tanstack/react-router";
import "./redline.css";

export const Route = createFileRoute("/lab/redline")({ component: Page });

function Page() {
    return <main>placeholder: redline</main>;
}
