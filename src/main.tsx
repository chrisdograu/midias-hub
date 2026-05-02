import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

let chunkReloaded = false;

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovable.app") ||
  window.location.hostname.includes("lovableproject.com");

const cleanupPreviewServiceWorkers = async () => {
  if (!("serviceWorker" in navigator) || (!isInIframe && !isPreviewHost)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((key) => caches.delete(key)));
  }
};

void cleanupPreviewServiceWorkers();

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

createRoot(document.getElementById("root")!).render(<App />);
