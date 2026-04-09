import { useEffect, useRef } from "react";
import { toast } from "sonner";

const CHECK_INTERVAL = 30_000;

export function useAutoUpdate() {
  const initialHash = useRef<string | null>(null);
  const reloading = useRef(false);

  useEffect(() => {
    if (import.meta.env.DEV) return;
    try { if (window.self !== window.top) return; } catch { return; }

    let timer: ReturnType<typeof setInterval>;

    async function fetchHash() {
      if (reloading.current) return;
      try {
        const res = await fetch("/?_ts=" + Date.now(), { method: "HEAD", cache: "no-store" });
        const etag = res.headers.get("etag") || res.headers.get("last-modified") || "";
        if (!initialHash.current) { initialHash.current = etag; return; }
        if (etag && etag !== initialHash.current) {
          reloading.current = true;
          toast.info("Nova versão disponível — atualizando em 3s…", { duration: 3000 });
          setTimeout(() => window.location.reload(), 3000);
        }
      } catch { /* skip */ }
    }

    fetchHash();
    timer = setInterval(fetchHash, CHECK_INTERVAL);
    return () => clearInterval(timer);
  }, []);
}
