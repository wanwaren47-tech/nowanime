import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import IframeShell from "./components/IframeShell.tsx";
import "./index.css";

// Apply persisted theme before render to avoid flash
try {
  const theme = localStorage.getItem("theme");
  if (theme === "light") document.documentElement.classList.add("light");
  else document.documentElement.classList.remove("light");
} catch {}

// Top-level document renders only the iframe shell; the real app runs inside it.
const isEmbedded =
  new URLSearchParams(window.location.search).get("embed") === "1" ||
  window.self !== window.top;

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>{isEmbedded ? <App /> : <IframeShell />}</HelmetProvider>
);
