/**
 * _shared/auth-guard.ts
 * ═════════════════════
 * Reusable JWT validation + user extraction for Edge Functions.
 */
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export interface AuthResult {
  userId: string;
  userClient: SupabaseClient;
  adminClient: SupabaseClient;
}

export function getAdminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

/**
 * Validates the Authorization header, extracts the user,
 * and returns both user-scoped and admin clients.
 * Throws a Response on failure — caller should catch and return it.
 */
export async function requireAuth(req: Request, corsHeaders: Record<string, string>): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) {
    throw new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return {
    userId: user.id,
    userClient,
    adminClient: getAdminClient(),
  };
}
