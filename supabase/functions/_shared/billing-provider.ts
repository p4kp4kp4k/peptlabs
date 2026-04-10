/**
 * _shared/billing-provider.ts
 * ═══════════════════════════
 * Provider interface + factory for payment gateways.
 */

export interface CheckoutParams {
  userId: string;
  email: string;
  planId: "pro_monthly" | "pro_lifetime";
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  url: string;
  sessionId?: string;
  preferenceId?: string;
}

export interface WebhookResult {
  event: string;
  userId?: string;
  subscriptionId?: string;
  status?: string;
  planId?: string;
  provider: string;
  raw: Record<string, unknown>;
}

export interface BillingProvider {
  name: string;
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  parseWebhook(req: Request): Promise<WebhookResult>;
}

/* ── Stripe Provider ── */
export class StripeProvider implements BillingProvider {
  name = "stripe";

  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const STRIPE_SECRET = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET) throw new Error("STRIPE_SECRET_KEY not configured");

    const isLifetime = params.planId === "pro_lifetime";
    const priceId = isLifetime
      ? Deno.env.get("STRIPE_PRICE_LIFETIME")
      : Deno.env.get("STRIPE_PRICE_MONTHLY");

    if (!priceId) throw new Error(`Stripe price ID not configured for ${params.planId}`);

    const body = new URLSearchParams({
      "customer_email": params.email,
      "mode": isLifetime ? "payment" : "subscription",
      "success_url": params.successUrl,
      "cancel_url": params.cancelUrl,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "metadata[user_id]": params.userId,
      "metadata[plan_id]": params.planId,
      "client_reference_id": params.userId,
    });

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Stripe error: ${JSON.stringify(data)}`);

    return { url: data.url, sessionId: data.id };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const STRIPE_SECRET = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET) throw new Error("STRIPE_SECRET_KEY not configured");

    const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${STRIPE_SECRET}` },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(`Stripe cancel error: ${JSON.stringify(data)}`);
    }
  }

  async parseWebhook(req: Request): Promise<WebhookResult> {
    const body = await req.json();
    const event = body.type;
    const obj = body.data?.object;

    return {
      event,
      userId: obj?.metadata?.user_id || obj?.client_reference_id,
      subscriptionId: obj?.subscription || obj?.id,
      status: obj?.status,
      planId: obj?.metadata?.plan_id,
      provider: "stripe",
      raw: body,
    };
  }
}

/* ── Mercado Pago Provider ── */
export class MercadoPagoProvider implements BillingProvider {
  name = "mercadopago";

  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const MP_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MP_TOKEN) throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");

    const isLifetime = params.planId === "pro_lifetime";
    const price = isLifetime ? 397.00 : 59.90;
    const title = isLifetime ? "PeptiLab PRO Vitalício" : "PeptiLab PRO Mensal";

    const preference: Record<string, unknown> = {
      items: [{
        title,
        quantity: 1,
        currency_id: "BRL",
        unit_price: price,
      }],
      payer: { email: params.email },
      back_urls: {
        success: params.successUrl,
        failure: params.cancelUrl,
        pending: params.cancelUrl,
      },
      auto_return: "approved",
      external_reference: JSON.stringify({
        user_id: params.userId,
        plan_id: params.planId,
      }),
      metadata: {
        user_id: params.userId,
        plan_id: params.planId,
      },
    };

    // For monthly, create a preapproval (subscription)
    if (!isLifetime) {
      const preapproval = {
        reason: title,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: price,
          currency_id: "BRL",
        },
        payer_email: params.email,
        back_url: params.successUrl,
        external_reference: JSON.stringify({
          user_id: params.userId,
          plan_id: params.planId,
        }),
      };

      const res = await fetch("https://api.mercadopago.com/preapproval", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${MP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preapproval),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(`MP preapproval error: ${JSON.stringify(data)}`);
      return { url: data.init_point, preferenceId: data.id };
    }

    // One-time payment for lifetime
    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`MP preference error: ${JSON.stringify(data)}`);
    return { url: data.init_point, preferenceId: data.id };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const MP_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MP_TOKEN) throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");

    const res = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${MP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "cancelled" }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(`MP cancel error: ${JSON.stringify(data)}`);
    }
  }

  async parseWebhook(req: Request): Promise<WebhookResult> {
    const body = await req.json();
    const type = body.type || body.action;

    let externalRef: Record<string, string> = {};
    try {
      if (body.data?.external_reference) {
        externalRef = JSON.parse(body.data.external_reference);
      }
    } catch { /* ignore */ }

    return {
      event: type,
      userId: externalRef.user_id || body.data?.metadata?.user_id,
      subscriptionId: body.data?.id,
      status: body.data?.status,
      planId: externalRef.plan_id || body.data?.metadata?.plan_id,
      provider: "mercadopago",
      raw: body,
    };
  }
}

/* ── Provider Factory ── */
export function getProvider(name: string): BillingProvider {
  switch (name) {
    case "stripe": return new StripeProvider();
    case "mercadopago": return new MercadoPagoProvider();
    default: throw new Error(`Unknown billing provider: ${name}`);
  }
}
