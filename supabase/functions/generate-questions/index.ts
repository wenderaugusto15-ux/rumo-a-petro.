import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const adminClient = createClient(supabaseUrl, serviceKey);
      const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Admin only" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { subject_id, subject_name, level = "medium", batch_num = 1 } = await req.json();

    if (!subject_id || !subject_name) {
      return new Response(JSON.stringify({ error: "subject_id and subject_name required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const levelPt = level === "easy" ? "FÁCIL" : level === "hard" ? "DIFÍCIL" : "MÉDIO";

    const count = 10;
    const prompt = `Você é um especialista em elaboração de questões para concursos públicos da banca CESGRANRIO, especificamente para o concurso da Petrobras.

MATÉRIA OBRIGATÓRIA: "${subject_name}"
NÍVEL: ${levelPt}
LOTE: ${batch_num}

REGRA CRÍTICA: TODAS as ${count} questões DEVEM ser EXCLUSIVAMENTE sobre "${subject_name}". 
- NÃO gere questões de outras matérias, áreas ou disciplinas.
- Cada questão DEVE abordar um tópico/conceito específico de "${subject_name}".
- O enunciado, as alternativas e a explicação devem estar 100% dentro do escopo de "${subject_name}".
- Se a matéria for "Segurança do Trabalho", as questões devem ser sobre NRs, EPIs, CIPA, riscos ocupacionais, etc.
- Se a matéria for "Língua Portuguesa", as questões devem ser sobre gramática, interpretação de texto, etc.
- NUNCA misture conteúdos de outras disciplinas.

FORMATO:
- Enunciado contextualizado no estilo CESGRANRIO (situações práticas, casos, textos base quando aplicável)
- 5 alternativas (A-E), apenas uma correta
- Gabarito e explicação detalhada
- Varie os tópicos DENTRO da matéria "${subject_name}"

Retorne APENAS um JSON array válido, sem texto adicional:
[{"statement":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","option_e":"...","correct_option":"A","explanation":"..."}]`;

    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.95 },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error:", errText);
      return new Response(JSON.stringify({ error: "AI error", details: errText }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    let content = aiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let questions: any[];
    try {
      questions = JSON.parse(content);
    } catch {
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        questions = JSON.parse(match[0]);
      } else {
        return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const rows = questions.filter((q: any) => q.statement && q.option_a).map((q: any) => ({
      statement: q.statement,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      option_e: q.option_e,
      correct_option: (q.correct_option || "A").charAt(0).toUpperCase(),
      explanation: q.explanation || "",
      subject_id,
      level,
      tags: ["CESGRANRIO", "2024", "Petrobras", "gerado-ia"],
      active: true,
    }));

    const { error } = await supabase.from("questions").insert(rows);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, subject: subject_name, level, batch: batch_num, inserted: rows.length 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
