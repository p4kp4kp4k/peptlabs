import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { handleCors, jsonResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await admin
      .from("gateway_settings")
      .select("is_active, environment, config")
      .eq("provider", "mercadopago")
      .single();

    if (error) {
      throw error;
    }

    const config = (data?.config ?? {}) as Record<string, unknown>;
    const publicKey = typeof config.public_key === "string"
      ? config.public_key.trim()
      : "";
    const isActive = Boolean(data?.is_active);

    return jsonResponse({
      publicKey: isActive && publicKey ? publicKey : null,
      cardEnabled: Boolean(isActive && publicKey),
      environment: data?.environment ?? null,
    });
  } catch (error) {
    console.error("get-mp-public-config error", error);
    return jsonResponse({ error: "Unable to load Mercado Pago config" }, 500);
  }
});
