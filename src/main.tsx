import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

let chunkReloaded = false;
createRoot(document.getElementById("root")!).render(<App />);

window.addEventListener("vite:preloadError", () => {
  if (chunkReloaded) return;
  chunkReloaded = true;
  window.location.reload();
});

window.addEventListener("error", (event) => {
  const message = event.error?.message || event.message || "";
  if (!chunkReloaded && /Failed to fetch dynamically imported module|Importing a module script failed/i.test(message)) {
    chunkReloaded = true;
    window.location.reload();
  }
});
