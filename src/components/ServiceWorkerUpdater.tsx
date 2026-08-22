"use client";

import { useEffect, useState } from "react";

/**
 * Watches for a newer service worker and offers a one-tap reload.
 *
 * Without this an installed PWA can keep running a previous build against a
 * newly deployed server — which is exactly how an error message that no longer
 * exists in the source can still appear on screen.
 */
export default function ServiceWorkerUpdater() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let cancelled = false;

    const wire = (reg: ServiceWorkerRegistration) => {
      if (cancelled) return;

      if (reg.waiting) setWaiting(reg.waiting);

      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          // "installed" with an existing controller means an update is ready.
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            setWaiting(installing);
          }
        });
      });
    };

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      wire(reg);
      // Catch updates published while the app is already open.
      reg.update().catch(() => {});
    });

    // The new worker takes over -> reload once to run the new code.
    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  if (!waiting) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10001,
        background: "#0f172a",
        color: "#fff",
        padding: "10px 16px",
        borderRadius: 10,
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        fontSize: 13,
        fontWeight: 600,
        maxWidth: "92vw",
      }}
    >
      <span>A new version of this app is available.</span>
      <button
        onClick={() => waiting.postMessage({ type: "SKIP_WAITING" })}
        style={{
          background: "#3b82f6",
          border: "none",
          color: "#fff",
          borderRadius: 6,
          padding: "6px 14px",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Reload
      </button>
    </div>
  );
}
