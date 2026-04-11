import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type ApiDiagnostics = Record<string, unknown>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function success(data: Record<string, unknown>) {
  return jsonResponse({ ok: true, ...data });
}

function failure(error: string, details?: string, diagnostics?: ApiDiagnostics) {
  return jsonResponse({ ok: false, error, details, diagnostics });
}

function getMercadoPagoErrorMessage(mpData: Record<string, any>): string {
  const detailedErrors = Array.isArray(mpData.errors)
    ? mpData.errors
        .flatMap((entry: Record<string, unknown>) => {
          const details = Array.isArray(entry?.details)
            ? entry.details.filter((detail): detail is string => typeof detail === "string")
            : [];

          if (details.length > 0) return details;
          if (typeof entry?.message === "string" && entry.message.trim()) return [entry.message.trim()];
          if (typeof entry?.code === "string" && entry.code.trim()) return [entry.code.trim()];
          return [];
        })
        .filter(Boolean)
    : [];

  return (
    detailedErrors[0] ||
    mpData.message ||
    mpData.error ||
    mpData.cause?.[0]?.description ||
    mpData.details ||
    "Falha ao criar a cobrança no Mercado Pago."
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return failure("Unauthorized", "Faça login para continuar.");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return failure("Invalid token", "Sua sessão expirou. Entre novamente e tente de novo.");
    }

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")?.trim();
    if (!accessToken) {
      return failure("MercadoPago not configured", "O token privado do Mercado Pago não está configurado no backend.");
    }

    const body = await req.json();
    const {
      productId,
      variantId,
      quantity,
      paymentMethod,
      cardToken,
      installments,
      payerEmail,
      paymentMethodId,
      identificationType,
      identificationNumber,
    } = body;

    const quantityValue = Number(quantity);
    if (!productId || !Number.isInteger(quantityValue) || quantityValue < 1 || !paymentMethod) {
      return failure("Missing required fields", "Envie productId, quantity e paymentMethod corretamente.");
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: product, error: productError } = await adminClient
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("is_active", true)
      .single();

    if (productError || !product) {
      return failure("Product not found", "Produto não encontrado ou inativo.");
    }

    let unitPrice = Number(product.base_price);

    if (variantId) {
      const { data: variant, error: variantError } = await adminClient
        .from("product_variants")
        .select("*")
        .eq("id", variantId)
        .eq("product_id", productId)
        .single();

      if (variantError || !variant) {
        return failure("Variant not found", "A variante selecionada não foi encontrada para este produto.");
      }

      if (variant.stock < quantityValue) {
        return failure("Insufficient stock", "Estoque insuficiente para a quantidade selecionada.");
      }

      unitPrice = Number(variant.price) || unitPrice;
    }

    const totalAmountValue = Number((unitPrice * quantityValue).toFixed(2));
    const totalAmount = totalAmountValue.toFixed(2);
    const email = String(payerEmail || user.email || "").trim().toLowerCase();

    if (!email) {
      return failure("Missing payer email", "Informe um e-mail válido para continuar.");
    }

    const localOrderId = crypto.randomUUID();
    const notificationUrl = `${Deno.env.get("SUPABASE_URL")!}/functions/v1/mp-webhook`;
    const payer: Record<string, unknown> = { email };

    if (paymentMethod === "credit_card") {
      if (!identificationType || !identificationNumber) {
        return failure("Missing payer identification", "Informe o tipo e o número do documento do titular.");
      }

      payer.identification = {
        type: String(identificationType),
        number: String(identificationNumber).replace(/\D/g, ""),
      };
    }

    const orderPayload: Record<string, unknown> = {
      type: "online",
      processing_mode: "automatic",
      total_amount: totalAmount,
      external_reference: localOrderId,
      payer,
      transactions: {
        payments: [] as Record<string, unknown>[],
      },
    };

    const payments = (orderPayload.transactions as Record<string, unknown>).payments as Record<string, unknown>[];

    if (paymentMethod === "pix") {
      payments.push({
        amount: totalAmount,
        payment_method: {
          id: "pix",
          type: "bank_transfer",
        },
      });
    } else if (paymentMethod === "credit_card") {
      const brand = String(paymentMethodId || "").trim();

      if (!cardToken || !brand) {
        return failure(
          "Card tokenization failed",
          "Não foi possível identificar os dados obrigatórios do cartão. Recarregue o formulário e tente novamente.",
        );
      }

      payments.push({
        amount: totalAmount,
        payment_method: {
          id: brand,
          type: "credit_card",
          token: String(cardToken),
          installments: Number(installments) || 1,
          statement_descriptor: "PeptLabs",
        },
      });
    } else {
      return failure("Invalid payment method", "Use 'pix' ou 'credit_card'.");
    }

    console.log(
      "create-mp-checkout request",
      JSON.stringify({
        productId,
        variantId,
        quantity: quantityValue,
        paymentMethod,
        externalReference: localOrderId,
      }),
    );

    const mpResponse = await fetch("https://api.mercadopago.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(orderPayload),
    });

    const rawResponse = await mpResponse.text();
    let mpData: Record<string, any> = {};

    try {
      mpData = rawResponse ? JSON.parse(rawResponse) : {};
    } catch {
      mpData = { raw: rawResponse };
    }

    if (!mpResponse.ok) {
      console.error("MercadoPago Orders API error:", JSON.stringify(mpData));

      return failure("Payment processing failed", getMercadoPagoErrorMessage(mpData), {
        mpStatus: mpResponse.status,
        paymentMethod,
        externalReference: localOrderId,
        notificationUrl,
      });
    }

    const payment = Array.isArray(mpData.transactions?.payments)
      ? mpData.transactions.payments[0]
      : undefined;

    const paymentStatus = mpData.status === "processed"
      ? "approved"
      : payment?.status === "approved"
        ? "approved"
        : "pending";

    const { error: insertError } = await adminClient.from("orders").insert({
      id: localOrderId,
      user_id: user.id,
      product_id: productId,
      variant_id: variantId || null,
      quantity: quantityValue,
      total_amount: totalAmountValue,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      mp_order_id: mpData.id,
      metadata: {
        external_reference: localOrderId,
        mp_status: mpData.status,
        mp_status_detail: mpData.status_detail,
      },
    });

    if (insertError) {
      console.error("orders insert error:", insertError);
      return failure("Order persistence failed", "A cobrança foi criada, mas não conseguimos salvar o pedido localmente.", {
        externalReference: localOrderId,
        mpOrderId: mpData.id,
      });
    }

    await adminClient.from("billing_events").insert({
      user_id: user.id,
      event_type: "store_order_created",
      provider: "mercadopago",
      payload: {
        orderId: mpData.id,
        localOrderId,
        productId,
        variantId,
        quantity: quantityValue,
        totalAmount: totalAmountValue,
        paymentMethod,
        status: mpData.status,
      },
    });

    const responseData: Record<string, unknown> = {
      orderId: mpData.id,
      localOrderId,
      status: mpData.status,
      statusDetail: mpData.status_detail,
      paymentStatus: payment?.status,
    };

    if (paymentMethod === "pix" && payment?.payment_method) {
      responseData.pix = {
        qrCode: payment.payment_method.qr_code,
        qrCodeBase64: payment.payment_method.qr_code_base64,
        ticketUrl: payment.payment_method.ticket_url,
      };
    }

    if (paymentMethod === "credit_card" && payment) {
      responseData.card = {
        status: payment.status,
        statusDetail: payment.status_detail,
        authorizationCode: payment.authorization_code,
      };
    }

    return success(responseData);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("create-mp-checkout error:", err);
    return failure("Unexpected error", err instanceof Error ? err.message : "Erro interno ao processar o checkout.");
  }
});
