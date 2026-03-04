import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, ThumbsUp, ThumbsDown, Copy, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useChatPetra, PetraMessage } from "@/hooks/useChatPetra";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const SUGGESTIONS = [
  "📚 Como estudar melhor?",
  "🧮 Explica regra de três",
  "📝 Dicas de português",
  "🎯 O que mais cai na prova?",
  "💪 Preciso de motivação",
];

export default function ChatPetra() {
  const {
    mensagens, carregando, chatAberto, perguntasHoje, limitAtingido,
    isPremium, isLoggedIn, toggleChat, fecharChat, enviarMensagem,
    limparConversa, setFeedback, messagesEndRef,
  } = useChatPetra();

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (chatAberto) inputRef.current?.focus();
  }, [chatAberto]);

  const handleSend = () => {
    if (!input.trim() || carregando || limitAtingido) return;
    enviarMensagem(input);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Resposta copiada!" });
  };

  const limitColor = perguntasHoje <= 3 ? "text-green-400" : perguntasHoje <= 4 ? "text-yellow-400" : "text-red-400";

  return (
    <>
      {/* Floating Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={toggleChat}
            className="fixed bottom-6 right-6 z-[9998] flex flex-col items-center gap-1"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 8 }}
          >
            <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#0D47A1] to-[#1565C0] flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow text-white text-xl font-bold">
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-semibold text-foreground/70">Petra IA</span>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Olá! Sou a Petra, sua assistente de estudos 💬</p>
        </TooltipContent>
      </Tooltip>

      {/* Chat Panel */}
      <AnimatePresence>
        {chatAberto && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-[9999] w-[400px] h-[550px] max-sm:w-full max-sm:h-[80vh] max-sm:bottom-0 max-sm:right-0 max-sm:rounded-none rounded-2xl shadow-2xl flex flex-col overflow-hidden bg-[#F8FAFC] border border-border"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0D47A1] to-[#1976D2] p-4 flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                P
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">Petra</span>
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-white/70">Online</span>
                </div>
                <span className="text-xs text-white/60">Sua assistente de estudos ✨</span>
              </div>
              {!isPremium && isLoggedIn && (
                <span className={`text-xs font-medium ${limitColor}`}>
                  💬 {perguntasHoje}/5
                </span>
              )}
              {isPremium && (
                <span className="text-xs text-amber-300">✨ Ilimitado</span>
              )}
              <div className="flex gap-1">
                <button onClick={limparConversa} className="text-white/60 hover:text-white p-1" title="Limpar conversa">
                  <Trash2 className="h-4 w-4" />
                </button>
                <button onClick={fecharChat} className="text-white/60 hover:text-white p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {mensagens.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  onFeedback={setFeedback}
                  onCopy={handleCopy}
                  onUpgrade={() => navigate("/app/upgrade")}
                />
              ))}
              {carregando && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0D47A1] to-[#1565C0] flex items-center justify-center text-white text-xs font-bold shrink-0">P</div>
                  <div className="bg-white border border-border rounded-2xl rounded-bl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {!limitAtingido && !carregando && mensagens.length <= 2 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => enviarMensagem(s)}
                    className="text-xs border border-[#1565C0]/30 text-[#0D47A1] bg-white rounded-full px-3 py-1.5 hover:bg-[#0D47A1]/5 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border bg-white shrink-0">
              {limitAtingido ? (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">Limite atingido - Volta à meia-noite ⏰</p>
                  <button
                    onClick={() => navigate("/app/upgrade")}
                    className="text-xs font-medium text-amber-600 hover:text-amber-700"
                  >
                    🚀 Desbloquear perguntas ilimitadas
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Pergunte algo para a Petra..."
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565C0]/30 max-h-24"
                    disabled={carregando}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || carregando}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D47A1] to-[#1565C0] flex items-center justify-center text-white disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MessageBubble({
  msg,
  onFeedback,
  onCopy,
  onUpgrade,
}: {
  msg: PetraMessage;
  onFeedback: (id: string, fb: "up" | "down") => void;
  onCopy: (text: string) => void;
  onUpgrade: () => void;
}) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-[#1565C0] text-white rounded-2xl rounded-br px-4 py-2.5 max-w-[80%] text-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  const isLimitMsg = msg.content.includes("5 perguntas gratuitas");

  return (
    <div className="flex gap-2 items-start">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0D47A1] to-[#1565C0] flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1">
        P
      </div>
      <div className="max-w-[85%]">
        <div className="bg-white border border-border rounded-2xl rounded-bl px-4 py-2.5 shadow-sm text-sm prose prose-sm max-w-none [&_p]:mb-1 [&_ul]:mb-1 [&_li]:mb-0">
          <ReactMarkdown>{msg.content}</ReactMarkdown>
          {isLimitMsg && (
            <button
              onClick={onUpgrade}
              className="mt-2 inline-block bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              🚀 Ver Planos
            </button>
          )}
        </div>
        {msg.id !== "initial" && !isLimitMsg && (
          <div className="flex gap-2 mt-1 ml-1">
            <button
              onClick={() => onFeedback(msg.id, "up")}
              className={`p-1 rounded hover:bg-muted transition-colors ${msg.feedback === "up" ? "text-green-600" : "text-muted-foreground/40"}`}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onFeedback(msg.id, "down")}
              className={`p-1 rounded hover:bg-muted transition-colors ${msg.feedback === "down" ? "text-red-500" : "text-muted-foreground/40"}`}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onCopy(msg.content)}
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground/40"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
