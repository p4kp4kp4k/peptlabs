import { useEffect, useRef } from "react";

const CHECK_INTERVAL = 30_000; // 30s

export function useAutoUpdate() {
  const initialHash = useRef<string | null>(null);

  useEffect(() => {
    // Skip in dev / iframe preview
    if (import.meta.env.DEV) return;
    try {
      if (window.self !== window.top) return;
    } catch { return; }

    let timer: ReturnType<typeof setInterval>;

    async function fetchHash() {
      try {
        const res = await fetch("/?_ts=" + Date.now(), { method: "HEAD", cache: "no-store" });
        const etag = res.headers.get("etag") || res.headers.get("last-modified") || "";
        if (!initialHash.current) {
          initialHash.current = etag;
          return;
        }
        if (etag && etag !== initialHash.current) {
          // New version detected — reload seamlessly
          window.location.reload();
        }
      } catch {
        // Network error, skip
      }
    }

    fetchHash();
    timer = setInterval(fetchHash, CHECK_INTERVAL);
    return () => clearInterval(timer);
  }, []);
}
