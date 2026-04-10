import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RateLimitConfig {
  endpoint: string;
  maxRequests: number;
  windowSeconds: number;
}

const LIMITS: Record<string, RateLimitConfig> = {
  "engine-ai": { endpoint: "engine-ai", maxRequests: 10, windowSeconds: 60 },
  "calculator": { endpoint: "calculator", maxRequests: 20, windowSeconds: 60 },
  "default": { endpoint: "default", maxRequests: 60, windowSeconds: 60 },
  "login": { endpoint: "login", maxRequests: 5, windowSeconds: 60 },
};

const VALID_ENDPOINTS = Object.keys(LIMITS);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify JWT - rate-limit-guard must authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ allowed: false, reason: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ allowed: false, reason: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    const body = await req.json().catch(() => ({}));
    const endpoint = typeof body.endpoint === "string" && VALID_ENDPOINTS.includes(body.endpoint)
      ? body.endpoint
      : "default";

    const config = LIMITS[endpoint];
    const windowStart = new Date(Date.now() - config.windowSeconds * 1000).toISOString();

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Count recent requests from history
    const { count, error } = await adminClient
      .from("history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("kind", "security")
      .gte("created_at", windowStart)
      .like("metadata->>table", `rate_limit_${endpoint}%`);

    const currentCount = count ?? 0;

    if (currentCount >= config.maxRequests) {
      // Log the rate limit hit
      await adminClient.from("history").insert({
        user_id: userId,
        kind: "security" as any,
        metadata: {
          table: `rate_limit_${endpoint}_blocked`,
          operation: "RATE_LIMIT_EXCEEDED",
          endpoint,
          count: currentCount,
          limit: config.maxRequests,
          window: config.windowSeconds,
          timestamp: new Date().toISOString(),
        },
      });

      // Check if user should be flagged (10+ blocks in 10 minutes)
      const flagWindowStart = new Date(Date.now() - 600_000).toISOString();
      const { count: blockCount } = await adminClient
        .from("history")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("kind", "security")
        .gte("created_at", flagWindowStart)
        .like("metadata->>operation", "RATE_LIMIT_EXCEEDED");

      if ((blockCount ?? 0) >= 10) {
        await adminClient
          .from("profiles")
          .update({ flagged_at: new Date().toISOString() })
          .eq("user_id", userId);
      }

      return new Response(
        JSON.stringify({
          allowed: false,
          reason: `Rate limit exceeded: ${config.maxRequests} requests per ${config.windowSeconds}s`,
          retry_after: config.windowSeconds,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log this request
    await adminClient.from("history").insert({
      user_id: userId,
      kind: "security" as any,
      metadata: {
        table: `rate_limit_${endpoint}`,
        operation: "RATE_CHECK",
        endpoint,
        count: currentCount + 1,
        limit: config.maxRequests,
        timestamp: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({ allowed: true, remaining: config.maxRequests - currentCount - 1 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
