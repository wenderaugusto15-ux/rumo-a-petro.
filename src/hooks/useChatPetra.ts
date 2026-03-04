import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAcesso } from "@/hooks/useAcesso";
import { useAuth } from "@/hooks/useAuth";

export interface PetraMessage {
  id: string;
  role: "user" | "petra";
  content: string;
  timestamp: Date;
  feedback?: "up" | "down" | null;
}

const INITIAL_MESSAGE: PetraMessage = {
  id: "initial",
  role: "petra",
  content: `Oi! 👋 Sou a Petra, sua assistente de estudos.

Pode me perguntar sobre:
• Dúvidas de matérias
• Resolução de questões
• Dicas de estudo

No que posso ajudar?`,
  timestamp: new Date(),
};

const FREE_LIMIT = 5;

function getStoredMessages(): PetraMessage[] {
  try {
    const stored = localStorage.getItem("petra_mensagens");
    if (!stored) return [INITIAL_MESSAGE];
    const parsed = JSON.parse(stored);
    return parsed.length > 0 ? parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) : [INITIAL_MESSAGE];
  } catch {
    return [INITIAL_MESSAGE];
  }
}

function getStoredLimit(): { data: string; contador: number } {
  try {
    const stored = localStorage.getItem("petra_limite");
    if (!stored) return { data: new Date().toISOString().slice(0, 10), contador: 0 };
    const parsed = JSON.parse(stored);
    const today = new Date().toISOString().slice(0, 10);
    if (parsed.data !== today) return { data: today, contador: 0 };
    return parsed;
  } catch {
    return { data: new Date().toISOString().slice(0, 10), contador: 0 };
  }
}

export function useChatPetra() {
  const { isPremium } = useAcesso();
  const { user } = useAuth();
  const [mensagens, setMensagens] = useState<PetraMessage[]>(getStoredMessages);
  const [carregando, setCarregando] = useState(false);
  const [chatAberto, setChatAberto] = useState(false);
  const [limite, setLimite] = useState(getStoredLimit);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const perguntasHoje = limite.contador;
  const limitAtingido = !isPremium && perguntasHoje >= FREE_LIMIT;

  // Persist messages
  useEffect(() => {
    const toStore = mensagens.slice(-50);
    localStorage.setItem("petra_mensagens", JSON.stringify(toStore));
  }, [mensagens]);

  // Persist limit
  useEffect(() => {
    localStorage.setItem("petra_limite", JSON.stringify(limite));
  }, [limite]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  const toggleChat = useCallback(() => setChatAberto((p) => !p), []);
  const abrirChat = useCallback(() => setChatAberto(true), []);
  const fecharChat = useCallback(() => setChatAberto(false), []);

  const limparConversa = useCallback(() => {
    setMensagens([INITIAL_MESSAGE]);
  }, []);

  const enviarMensagem = useCallback(
    async (texto: string) => {
      if (!texto.trim() || carregando) return;

      if (limitAtingido) return;

      const userMsg: PetraMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: texto.trim(),
        timestamp: new Date(),
      };

      setMensagens((prev) => [...prev, userMsg]);
      setCarregando(true);
      scrollToBottom();

      // Update limit for free users
      if (!isPremium) {
        const newLimite = { data: new Date().toISOString().slice(0, 10), contador: limite.contador + 1 };
        setLimite(newLimite);

        if (newLimite.contador >= FREE_LIMIT) {
          const limitMsg: PetraMessage = {
            id: crypto.randomUUID(),
            role: "petra",
            content: `😔 Poxa, você usou suas 5 perguntas gratuitas de hoje!

Mas não se preocupe! Com o plano **Premium** você pode conversar comigo o quanto quiser, sem limites! Além disso, você desbloqueia:

✅ Perguntas ilimitadas comigo
✅ Todas as aulas da plataforma
✅ Simulados ilimitados
✅ Análise completa de desempenho

Que tal dar um upgrade nos seus estudos? 🚀`,
            timestamp: new Date(),
          };
          setMensagens((prev) => [...prev, limitMsg]);
          setCarregando(false);
          scrollToBottom();
          return;
        }
      }

      try {
        // Build history for API (exclude initial and limit messages)
        const history = mensagens
          .filter((m) => m.id !== "initial")
          .concat(userMsg)
          .map((m) => ({ role: m.role === "user" ? "user" : "model", content: m.content }));

        const { data, error } = await supabase.functions.invoke("petra-chat", {
          body: { messages: history },
        });

        if (error) throw error;

        const petraMsg: PetraMessage = {
          id: crypto.randomUUID(),
          role: "petra",
          content: data?.reply || "Ops! Tive um probleminha. Pode tentar de novo? 😅",
          timestamp: new Date(),
        };
        setMensagens((prev) => [...prev, petraMsg]);
      } catch (err) {
        console.error("Petra chat error:", err);
        const errorMsg: PetraMessage = {
          id: crypto.randomUUID(),
          role: "petra",
          content: "Ops! Tive um probleminha. Pode tentar de novo? 😅",
          timestamp: new Date(),
        };
        setMensagens((prev) => [...prev, errorMsg]);
      } finally {
        setCarregando(false);
        scrollToBottom();
      }
    },
    [carregando, limitAtingido, isPremium, limite, mensagens, scrollToBottom]
  );

  const setFeedback = useCallback((msgId: string, feedback: "up" | "down") => {
    setMensagens((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedback: m.feedback === feedback ? null : feedback } : m))
    );
  }, []);

  return {
    mensagens,
    carregando,
    chatAberto,
    perguntasHoje,
    limitAtingido,
    isPremium,
    isLoggedIn: !!user,
    toggleChat,
    abrirChat,
    fecharChat,
    enviarMensagem,
    limparConversa,
    setFeedback,
    messagesEndRef,
  };
}
