import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

export function FacebookPixel() {
  const location = useLocation();

  const { data: pixelId } = useQuery({
    queryKey: ["facebook-pixel-id"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings" as any)
        .select("value")
        .eq("key", "facebook_pixel_id")
        .maybeSingle();
      return (data as any)?.value as string | null ?? "";
    },
    staleTime: 1000 * 60 * 30,
  });

  // Inject pixel script once
  useEffect(() => {
    if (!pixelId) return;
    if (document.getElementById("fb-pixel-script")) return;

    const script = document.createElement("script");
    script.id = "fb-pixel-script";
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
  }, [pixelId]);

  // Track page views on route change
  useEffect(() => {
    if (pixelId && typeof (window as any).fbq === "function") {
      (window as any).fbq("track", "PageView");
    }
  }, [location.pathname, pixelId]);

  return null;
}
