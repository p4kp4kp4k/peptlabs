/**
 * kiwify-webhook/index.ts
 * ═══════════════════════
 * Handles Kiwify payment webhooks.
 *
 * Flow:
 *   1. Validate the Kiwify signature token
 *   2. Parse event (order_approved, subscription_active, subscription_canceled, order_refunded, etc.)
 *   3. Resolve user by email — create if not found
 *   4. Update entitlements and subscription based on plan
 *   5. Send magic-link email so the buyer can set their password and log in
 *
 * Webhook URL to configure in Kiwify:
 *   https://<project-ref>.supabase.co/functions/v1/kiwify-webhook
 *
 * Environment variables required:
 *   KIWIFY_WEBHOOK_TOKEN   — the token you set in Kiwify dashboard
 *   SUPABASE_URL           — auto-injected by Supabase
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, handleCors, jsonResponse } from "../_shared/cors.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KiwifyBuyer {
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
}

interface KiwifyProduct {
  id: string;
  name?: string;
}

interface KiwifySubscription {
  id?: string;
  recurrence_type?: string; // "M" | "Y" | null
  status?: string;
}

interface KiwifyPayload {
  /** Event type sent by Kiwify */
  event?: string;
  /** Webhook security token — must match KIWIFY_WEBHOOK_TOKEN */
  token?: string;
  /** Kiwify puts order data inside `data` for newer versions */
  data?: {
    id?: string;
    buyer?: KiwifyBuyer;
    product?: KiwifyProduct;
    subscription?: KiwifySubscription;
    Recurrence?: { type?: string };
  };
  /** Older Kiwify format puts data at top level */
  buyer?: KiwifyBuyer;
  product?: KiwifyProduct;
  order_id?: string;
  subscription?: KiwifySubscription;
  Recurrence?: { type?: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/** Normalise Kiwify payload regardless of format version */
function normalise(body: KiwifyPayload) {
  const buyer: KiwifyBuyer | undefined = body.data?.buyer ?? body.buyer;
  const product: KiwifyProduct | undefined = body.data?.product ?? body.product;
  const subscription: KiwifySubscription | undefined = body.data?.subscription ?? body.subscription;
  const recurrence = body.data?.Recurrence ?? body.Recurrence;
  const orderId: string | undefined = body.data?.id ?? body.order_id;
  const event: string = body.event ?? "unknown";
  const token: string | undefined = body.token;

  return { event, token, buyer, product, subscription, recurrence, orderId };
}

/** Whether this event means "grant/activate access" */
function isApprovalEvent(event: string) {
  return (
    event === "order_approved" ||
    event === "subscription_active" ||
    event === "subscription_activated" ||
    event === "checkout.complete"
  );
}

/** Whether this event means "revoke access" */
function isRevocationEvent(event: string) {
  return (
    event === "order_refunded" ||
    event === "subscription_canceled" ||
    event === "subscription_expired" ||
    event === "subscription_inactive"
  );
}

/** Determine if the purchase is a subscription (monthly) or one-time (lifetime) */
function detectBillingType(
  subscription?: KiwifySubscription,
  recurrence?: { type?: string },
): "monthly" | "lifetime" {
  // Subscription with a recurrence type → monthly
  if (subscription?.id && subscription.id.trim() !== "") return "monthly";
  if (recurrence?.type) return "monthly";
  return "lifetime";
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const rawBody = await req.text();
    let body: KiwifyPayload;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    // ── 1. Validate token ──────────────────────────────────────────────────
    const expectedToken = Deno.env.get("KIWIFY_WEBHOOK_TOKEN");
    if (expectedToken) {
      // Kiwify can send the token in the body OR as a query param
      const url = new URL(req.url);
      const receivedToken = body.token ?? url.searchParams.get("token");
      if (!receivedToken || receivedToken !== expectedToken) {
        console.error("Kiwify: invalid webhook token");
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
    } else {
      console.warn("KIWIFY_WEBHOOK_TOKEN not set — skipping token validation");
    }

    const { event, buyer, product, subscription, recurrence, orderId } = normalise(body);

    console.log(`Kiwify webhook: event=${event} product=${product?.id} orderId=${orderId}`);

    if (!buyer?.email) {
      console.warn("Kiwify webhook: no buyer email — ignoring");
      return jsonResponse({ status: "no_email" });
    }

    const adminClient = getAdminClient();

    // ── 2. Idempotency ─────────────────────────────────────────────────────
    const eventId = orderId ?? `${event}-${buyer.email}-${Date.now()}`;
    const { data: existing } = await adminClient
      .from("webhook_events")
      .select("id")
      .eq("provider_event_id", eventId)
      .eq("provider", "kiwify")
      .maybeSingle();

    if (existing) {
      return jsonResponse({ status: "already_processed" });
    }

    // Store webhook event for auditability
    const { data: webhookRecord } = await adminClient
      .from("webhook_events")
      .insert({
        provider: "kiwify",
        event_type: event,
        provider_event_id: eventId,
        payload: body as Record<string, unknown>,
      })
      .select("id")
      .single();

    // ── 3. Resolve plan from Kiwify product_id → plan_links table ──────────
    let planId: "pro_monthly" | "pro_lifetime" = "pro_monthly"; // safe default

    if (product?.id) {
      const { data: planLink } = await adminClient
        .from("plan_links")
        .select("plan_id")
        .eq("kiwify_product_id", product.id)
        .maybeSingle();

      if (planLink?.plan_id) {
        planId = planLink.plan_id === "pro_lifetime" ? "pro_lifetime" : "pro_monthly";
      } else {
        // Fallback: try to infer from recurrence / subscription
        const billing = detectBillingType(subscription, recurrence);
        planId = billing === "lifetime" ? "pro_lifetime" : "pro_monthly";
      }
    }

    const isLifetime = planId === "pro_lifetime";
    const billingType: "monthly" | "lifetime" = isLifetime ? "lifetime" : "monthly";

    // ── 4. Resolve (or create) Supabase user ───────────────────────────────
    const email = buyer.email.trim().toLowerCase();
    const displayName = buyer.name
      ?? `${buyer.first_name ?? ""} ${buyer.last_name ?? ""}`.trim()
      || undefined;

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email,
    );

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      userId = existingUser.id;
      console.log(`Kiwify: found existing user ${userId} for email ${email}`);
    } else {
      // Create a new user without password — they will use a magic link to log in
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        email_confirm: true, // mark email as confirmed immediately
        user_metadata: {
          display_name: displayName,
          source: "kiwify",
          plan: planId,
        },
      });

      if (createError || !newUser?.user) {
        console.error("Kiwify: failed to create user", createError);
        return jsonResponse({ error: "Failed to create user", details: createError?.message }, 500);
      }

      userId = newUser.user.id;
      isNewUser = true;
      console.log(`Kiwify: created new user ${userId} for email ${email}`);

      // Create profile row
      await adminClient.from("profiles").upsert({
        user_id: userId,
        display_name: displayName ?? email.split("@")[0],
      }, { onConflict: "user_id" });
    }

    let processed = false;

    // ── 5. Handle event ────────────────────────────────────────────────────
    if (isApprovalEvent(event)) {
      const periodEnd = isLifetime
        ? null
        : new Date(Date.now() + 30 * 86_400_000).toISOString();

      // Upsert entitlements
      await adminClient
        .from("entitlements")
        .upsert(
          {
            user_id: userId,
            plan: "pro",
            billing_type: billingType,
            is_active: true,
            limits: {
              max_protocols_month: 9999,
              compare_limit: 9999,
              history_days: 9999,
              export_level: "premium",
              calc_limit: 9999,
              stack_limit: isLifetime ? 9999 : 10,
              template_limit: 9999,
              interaction_limit: 9999,
            },
            current_period_end: periodEnd,
          },
          { onConflict: "user_id" },
        );

      // Upsert subscription
      await adminClient
        .from("subscriptions")
        .upsert(
          {
            user_id: userId,
            status: isLifetime ? "lifetime" : "active",
            plan_id: planId,
            payment_provider: "kiwify",
            current_period_end: periodEnd,
          },
          { onConflict: "user_id" },
        );

      // Log billing event
      await adminClient.from("billing_events").insert({
        user_id: userId,
        event_type: isLifetime ? "lifetime_activated" : "subscription_activated",
        provider: "kiwify",
        payload: { planId, orderId, productId: product?.id },
      });

      // ── Send magic-link email so the buyer can access the platform ────────
      if (isNewUser) {
        const siteUrl = Deno.env.get("SITE_URL") ?? "https://peptlabs.com.br";
        await adminClient.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: { redirectTo: `${siteUrl}/app/dashboard` },
        }).then(async ({ data: linkData, error: linkError }) => {
          if (linkError) {
            console.error("Kiwify: failed to generate magic link", linkError);
            return;
          }

          // Use Supabase auth to send a recovery email (sets up password)
          await adminClient.auth.admin.generateLink({
            type: "recovery",
            email,
            options: { redirectTo: `${siteUrl}/reset-password` },
          });

          console.log(`Kiwify: magic link generated for ${email}`, linkData?.properties?.action_link);
        });

        // Also trigger a regular recovery (password reset) email via standard flow
        // This sends a branded email from Supabase Auth templates
        await adminClient.auth.resetPasswordForEmail(email, {
          redirectTo: `${Deno.env.get("SITE_URL") ?? "https://peptlabs.com.br"}/reset-password`,
        }).catch((e) => console.warn("Kiwify: resetPasswordForEmail warn:", e));
      }

      processed = true;
    } else if (isRevocationEvent(event)) {
      // Downgrade to free plan
      await adminClient
        .from("entitlements")
        .update({
          plan: "free",
          billing_type: "monthly",
          is_active: true,
          limits: {
            max_protocols_month: 1,
            compare_limit: 1,
            history_days: 0,
            export_level: "basic",
            calc_limit: 1,
            stack_limit: 1,
            template_limit: 1,
            interaction_limit: 1,
          },
          current_period_end: null,
        })
        .eq("user_id", userId);

      await adminClient
        .from("subscriptions")
        .update({ status: "canceled", plan_id: "free" })
        .eq("user_id", userId);

      await adminClient.from("billing_events").insert({
        user_id: userId,
        event_type: "subscription_canceled",
        provider: "kiwify",
        payload: { orderId, reason: event },
      });

      processed = true;
    } else {
      console.log(`Kiwify: unhandled event type "${event}" — recorded but not processed`);
    }

    // Mark webhook as processed
    if (webhookRecord) {
      await adminClient
        .from("webhook_events")
        .update({ processed, processed_at: new Date().toISOString() })
        .eq("id", webhookRecord.id);
    }

    return jsonResponse({ status: "ok", processed, userId, planId });
  } catch (err) {
    console.error("kiwify-webhook error:", err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
