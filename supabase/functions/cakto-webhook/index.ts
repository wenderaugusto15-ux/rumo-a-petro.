import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const webhookSecret = Deno.env.get("CAKTO_WEBHOOK_SECRET");

    const body = await req.text();
    console.log("Cakto webhook received:", body);

    // Optional signature verification if Cakto provides a secret
    if (webhookSecret) {
      const signature = req.headers.get("x-cakto-signature") || req.headers.get("x-webhook-signature");
      if (signature) {
        const { createHmac } = await import("node:crypto");
        const expected = createHmac("sha256", webhookSecret).update(body).digest("hex");
        if (signature !== expected) {
          console.error("Invalid webhook signature");
          return new Response(JSON.stringify({ error: "Invalid signature" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const event = JSON.parse(body);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine event type
    const eventType = event.type || event.event || "";
    const status = event.status || event.payment_status || event.transaction_status || "";

    // Extract user_id from multiple possible fields
    const userId =
      event.metadata?.user_id ||
      event.custom?.user_id ||
      event.client_ref ||
      event.external_reference ||
      event.customer?.metadata?.user_id;

    console.log("Parsed webhook data:", { eventType, status, userId });

    if (!userId) {
      console.error("No user_id found in webhook payload");
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- REFUND ---
    const isRefund =
      eventType === "refund" ||
      eventType === "sale_refunded" ||
      eventType === "payment.refunded" ||
      status === "refunded" ||
      status === "refund";

    if (isRefund) {
      const { error } = await supabase
        .from("subscriptions")
        .update({ plan: "free", status: "canceled", ends_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to process refund:", error);
        return new Response(JSON.stringify({ error: "Refund update failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Refund processed for user ${userId}`);
      return new Response(
        JSON.stringify({ received: true, action: "refunded", user_id: userId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- CANCELLATION ---
    const isCanceled =
      eventType === "cancellation" ||
      eventType === "sale_canceled" ||
      eventType === "subscription.canceled" ||
      eventType === "payment.canceled" ||
      status === "canceled" ||
      status === "cancelled";

    if (isCanceled) {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to process cancellation:", error);
        return new Response(JSON.stringify({ error: "Cancellation update failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Cancellation processed for user ${userId}`);
      return new Response(
        JSON.stringify({ received: true, action: "canceled", user_id: userId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- APPROVED / RENEWAL ---
    const isApproved =
      status === "approved" ||
      status === "paid" ||
      status === "completed" ||
      eventType === "payment.succeeded" ||
      eventType === "sale_approved" ||
      eventType === "renewal" ||
      eventType === "subscription.renewed";

    if (!isApproved) {
      console.log("Event not actionable, skipping:", eventType, status);
      return new Response(JSON.stringify({ received: true, action: "skipped" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const planType = event.metadata?.plan_type || event.custom?.plan_type || "pro";
    const isSemestral = planType === "semestral";

    const now = new Date();
    const endsAt = new Date(now);
    endsAt.setMonth(endsAt.getMonth() + (isSemestral ? 6 : 1));

    const { error } = await supabase
      .from("subscriptions")
      .update({
        plan: "pro",
        status: "active",
        started_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to activate subscription:", error);
      return new Response(JSON.stringify({ error: "Database update failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`PRO activated for user ${userId} until ${endsAt.toISOString()}`);
    return new Response(
      JSON.stringify({ received: true, action: "activated", user_id: userId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
