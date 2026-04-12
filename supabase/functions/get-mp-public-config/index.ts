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
      .select("id, is_active, environment, config")
      .eq("provider", "mercadopago")
      .single();

    if (error) {
      console.error("[get-mp-public-config] DB error:", error.message);
      throw error;
    }

    const gatewayId = data?.id ?? "unknown";
    const environment = data?.environment ?? "unknown";
    const isActive = Boolean(data?.is_active);
    const config = (data?.config ?? {}) as Record<string, unknown>;

    // Read from the correct field
    const publicKey = typeof config.public_key === "string"
      ? config.public_key.trim()
      : "";

    // Diagnostic logging
    const keyPrefix = publicKey ? publicKey.substring(0, 12) + "..." : "(empty)";
    console.log(`[get-mp-public-config] Gateway ID: ${gatewayId}`);
    console.log(`[get-mp-public-config] Environment: ${environment}`);
    console.log(`[get-mp-public-config] is_active: ${isActive}`);
    console.log(`[get-mp-public-config] Public key prefix: ${keyPrefix}`);
    console.log(`[get-mp-public-config] Public key length: ${publicKey.length}`);

    // Validate key format
    if (publicKey && !publicKey.startsWith("APP_USR-") && !publicKey.startsWith("TEST-")) {
      console.error(`[get-mp-public-config] Invalid key format: ${keyPrefix}`);
      return jsonResponse({
        publicKey: null,
        cardEnabled: false,
        environment,
        error: "Public key com formato inválido. Deve começar com APP_USR- ou TEST-.",
      });
    }

    // Warn about environment mismatch
    if (environment === "production" && publicKey.startsWith("TEST-")) {
      console.warn(`[get-mp-public-config] WARNING: Test key used in production environment`);
      return jsonResponse({
        publicKey: null,
        cardEnabled: false,
        environment,
        error: "Public key de teste usada em ambiente de produção. Configure uma chave APP_USR-.",
      });
    }

    if (environment === "sandbox" && publicKey.startsWith("APP_USR-")) {
      console.warn(`[get-mp-public-config] WARNING: Production key used in sandbox environment`);
    }

    if (!publicKey) {
      console.warn(`[get-mp-public-config] No public key configured`);
      return jsonResponse({
        publicKey: null,
        cardEnabled: false,
        environment,
        error: "Public key não configurada no gateway.",
      });
    }

    return jsonResponse({
      publicKey: isActive ? publicKey : null,
      cardEnabled: Boolean(isActive && publicKey),
      environment,
    });
  } catch (error) {
    console.error("[get-mp-public-config] error", error);
    return jsonResponse({ error: "Unable to load Mercado Pago config" }, 500);
  }
});
