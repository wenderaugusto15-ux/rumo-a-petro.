import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PETRA_SYSTEM_PROMPT = `Você é a PETRA, assistente de estudos para concursos da Petrobras.

REGRA PRINCIPAL: Seja BREVE e DIRETA. Máximo 3-4 frases por resposta.

ESTILO DE RESPOSTA:
- Vá direto ao ponto, sem enrolação
- Use bullet points para organizar
- Máximo 100 palavras por resposta
- Só expanda se o aluno pedir "explica mais" ou "detalha"
- Um emoji por mensagem, no máximo

FORMATO PADRÃO:
1. Resposta direta (1-2 frases)
2. Se necessário: lista com pontos-chave (máx 3 itens)
3. Opcional: "Quer que eu explique mais?"

O QUE EVITAR:
- Explicações longas não solicitadas
- Múltiplos parágrafos
- Repetir informações
- Introduções desnecessárias como "Ótima pergunta! Então, veja bem..."

QUANDO EXPANDIR:
- Apenas se o aluno pedir: "explica mais", "não entendi", "detalha", "como assim?"
- Aí pode dar resposta mais completa (máx 150 palavras)

PERSONALIDADE:
- Simpática mas eficiente
- Tom: professora prática que vai direto ao assunto
- Sempre oferece aprofundar se necessário
- NUNCA responda perguntas fora do contexto de estudos/concursos
- Se perguntarem algo fora do tema, redirecione gentilmente para estudos`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GOOGLE_GEMINI_API_KEY not configured");

    // Build Gemini API request
    const contents = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: PETRA_SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            maxOutputTokens: 512,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "Erro ao consultar a IA", details: errText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui gerar uma resposta.";

    return new Response(JSON.stringify({ reply: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("petra-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
