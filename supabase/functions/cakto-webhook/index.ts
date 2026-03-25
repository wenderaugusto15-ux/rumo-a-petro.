import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

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

    const body = await req.text();
    console.log("=== CAKTO WEBHOOK RECEBIDO ===");
    console.log("Body:", body);

    const event = JSON.parse(body);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Evento completo:", JSON.stringify(event, null, 2));

    const eventType = event.type || event.event || event.evento || "";
    const status = event.status || event.payment_status || event.transaction_status || "";

    const email = (
      event.customer?.email ||
      event.email ||
      event.buyer?.email ||
      event.client?.email ||
      event.data?.customer?.email ||
      event.data?.email ||
      event.subscriber?.email ||
      ""
    ).toLowerCase().trim();

    console.log("Dados extraídos:", { eventType, status, email });

    if (!email) {
      console.error("Email não encontrado no payload");
      return new Response(
        JSON.stringify({ received: true, error: "Email não encontrado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Buscando usuário pelo email:", email);

    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error("Erro ao buscar usuários:", userError);
      return new Response(
        JSON.stringify({ received: true, error: "Erro ao buscar usuário" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = userData.users.find(
      (u: any) => u.email?.toLowerCase() === email
    );

    if (!user) {
      console.log("Usuário não cadastrado ainda:", email);
      return new Response(
        JSON.stringify({ 
          received: true, 
          action: "user_not_found",
          email: email,
          message: "Usuário precisa se cadastrar primeiro"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log("Usuário encontrado:", userId);

    const isRefund =
      eventType.includes("refund") ||
      eventType.includes("reembolso") ||
      status === "refunded" ||
      status === "refund";

    if (isRefund) {
      await supabase
        .from("subscriptions")
        .update({ 
          plan: "free", 
          status: "canceled", 
          ends_at: new Date().toISOString() 
        })
        .eq("user_id", userId);

      console.log("Reembolso processado:", userId);
      return new Response(
        JSON.stringify({ received: true, action: "refunded", user_id: userId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isCanceled =
      eventType.includes("cancel") ||
      eventType.includes("cancelada") ||
      status === "canceled" ||
      status === "cancelled";

    if (isCanceled) {
      await supabase
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("user_id", userId);

      console.log("Cancelamento processado:", userId);
      return new Response(
        JSON.stringify({ received: true, action: "canceled", user_id: userId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isApproved =
      status === "approved" ||
      status === "paid" ||
      status === "completed" ||
      status === "APPROVED" ||
      eventType.includes("approved") ||
      eventType.includes("aprovada") ||
      eventType.includes("succeeded") ||
      eventType.includes("renewal");

    if (!isApproved) {
      console.log("Evento ignorado:", eventType, status);
      return new Response(
        JSON.stringify({ received: true, action: "skipped" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const productName = (event.product?.name || event.plan || "").toLowerCase();
    const isSemestral = productName.includes("semestral") || productName.includes("6 meses");

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
      console.error("Erro ao ativar:", error);
      return new Response(
        JSON.stringify({ error: "Falha ao ativar", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("PRO ATIVADO:", userId, "até", endsAt.toISOString());
    return new Response(
      JSON.stringify({ 
        received: true, 
        action: "activated", 
        user_id: userId,
        plan: "pro",
        ends_at: endsAt.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("ERRO:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", message: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
