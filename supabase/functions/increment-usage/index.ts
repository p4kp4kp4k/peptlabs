import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type CounterField = "protocols_created" | "comparisons_made" | "exports_made" | "calcs_made" | "stacks_viewed" | "templates_used" | "interactions_checked";

const FEATURE_MAP: Record<string, CounterField> = {
  create_protocol: "protocols_created",
  compare: "comparisons_made",
  export: "exports_made",
  calculator: "calcs_made",
  stack_builder: "stacks_viewed",
  template: "templates_used",
  interaction_check: "interactions_checked",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify JWT properly
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    const body = await req.json().catch(() => ({}));
    const feature = body.feature as string;
    const field = FEATURE_MAP[feature];

    if (!field) {
      return new Response(JSON.stringify({ error: `Invalid feature. Must be one of: ${Object.keys(FEATURE_MAP).join(", ")}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const month = new Date().toISOString().slice(0, 7);

    // Upsert usage counter
    const { data: existing } = await admin
      .from("usage_counters")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month)
      .single();

    if (existing) {
      await admin
        .from("usage_counters")
        .update({ [field]: ((existing as any)[field] ?? 0) + 1, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("month", month);
    } else {
      await admin
        .from("usage_counters")
        .insert({ user_id: userId, month, [field]: 1 });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
