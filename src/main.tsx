import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

let chunkReloaded = false;
const previewCleanupKey = "midias-preview-sw-cleanup-v2";

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
  if (!("serviceWorker" in navigator) || (!isInIframe && !isPreviewHost)) return false;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  let hadCaches = false;

  if ("caches" in window) {
    const cacheKeys = await caches.keys();
    hadCaches = cacheKeys.length > 0;
    await Promise.all(cacheKeys.map((key) => caches.delete(key)));
  }

  return registrations.length > 0 || hadCaches;
};

const bootstrap = async () => {
  const url = new URL(window.location.href);

  if (url.searchParams.has("sw-cleanup")) {
    url.searchParams.delete("sw-cleanup");
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
  }

  const hadPreviewCache = await cleanupPreviewServiceWorkers();
  const hasReloadedAfterCleanup = sessionStorage.getItem(previewCleanupKey) === "1";

  if (hadPreviewCache && !hasReloadedAfterCleanup) {
    sessionStorage.setItem(previewCleanupKey, "1");
    window.location.replace(`${url.pathname}${url.search}${url.hash}`);
    return;
  }

  sessionStorage.removeItem(previewCleanupKey);

  createRoot(document.getElementById("root")!).render(<App />);
};

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

void bootstrap();
