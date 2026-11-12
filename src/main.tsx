import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { initMotion } from "./lib/motion";

initMotion();

// Open on the product website; deep links (any #/route) go straight where they point.
if (!window.location.hash) window.location.replace("#/welcome");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
