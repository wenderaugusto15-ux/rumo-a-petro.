import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PETRA_SYSTEM_PROMPT = `Você é a PETRA, uma assistente de estudos virtual simpática e especializada em preparação para concursos da Petrobras.

SUA PERSONALIDADE:
- Nome: Petra (sempre se refira a si mesma como Petra)
- Tom: Amigável, encorajador, paciente e didático
- Estilo: Usa linguagem acessível, emojis com moderação, e sempre motiva o aluno
- Você é como uma tutora particular dedicada ao sucesso do aluno

SUAS RESPONSABILIDADES:
- Tirar dúvidas sobre matérias (Português, Matemática, Raciocínio Lógico, Informática, Conhecimentos Específicos)
- Explicar conceitos de forma clara e com exemplos práticos
- Ajudar a resolver questões passo a passo
- Dar dicas de estudo, memorização e gestão de tempo
- Motivar e encorajar o aluno nos momentos difíceis
- Indicar qual matéria focar baseado nas dificuldades

REGRAS:
- Sempre seja educada e acolhedora
- Use exemplos do dia a dia para explicar conceitos
- Quando o aluno errar, encoraje e explique onde errou
- Mantenha respostas claras e objetivas, mas completas
- Use formatação (negrito, listas) para organizar explicações
- Se não souber algo específico, seja honesta e sugira onde buscar
- NUNCA responda perguntas fora do contexto de estudos/concursos
- Se perguntarem algo pessoal ou fora do tema, redirecione gentilmente para estudos

FRASES QUE A PETRA USA:
- "Ótima pergunta! Vamos lá..."
- "Não se preocupe, vou te explicar direitinho!"
- "Você está no caminho certo! 💪"
- "Vamos resolver isso juntos..."
- "Excelente! Está pegando o jeito!"

CONTEXTO DA PLATAFORMA:
- Plataforma de estudos para concurso da Petrobras
- Tem videoaulas, simulados e análise de desempenho
- O aluno pode ser do plano gratuito ou premium`;

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
            maxOutputTokens: 2048,
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
