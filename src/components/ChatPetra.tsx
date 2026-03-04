import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, ThumbsUp, ThumbsDown, Copy, Trash2, Minus, Maximize2, Minimize2 } from "lucide-react";
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

type Corner = "bottom-right" | "bottom-left" | "top-right" | "top-left";

interface PetraPrefs {
  corner: Corner;
  width: number;
  height: number;
  minimized: boolean;
}

const DEFAULT_PREFS: PetraPrefs = {
  corner: "bottom-right",
  width: 380,
  height: 500,
  minimized: false,
};

const MIN_W = 320, MIN_H = 400, MAX_W = 500, MAX_H = 700;
const EXPANDED_W = 500, EXPANDED_H = 700;

function loadPrefs(): PetraPrefs {
  try {
    const s = localStorage.getItem("petra_prefs");
    if (!s) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(s) };
  } catch { return DEFAULT_PREFS; }
}

function savePrefs(p: Partial<PetraPrefs>) {
  const current = loadPrefs();
  localStorage.setItem("petra_prefs", JSON.stringify({ ...current, ...p }));
}

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return mobile;
}

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
  const isMobile = useIsMobile();

  // Prefs state
  const [prefs, setPrefs] = useState<PetraPrefs>(loadPrefs);
  const [minimized, setMinimized] = useState(prefs.minimized);
  const [expanded, setExpanded] = useState(false);
  const [panelSize, setPanelSize] = useState({ w: prefs.width, h: prefs.height });

  // Drag state
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; bx: number; by: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dragReady, setDragReady] = useState(false);

  // Panel drag state
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null);
  const panelDragging = useRef(false);
  const panelDragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);

  // Resize state
  const resizing = useRef(false);
  const resizeStart = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  // Save prefs on changes
  useEffect(() => { savePrefs({ corner: prefs.corner }); }, [prefs.corner]);
  useEffect(() => { savePrefs({ width: panelSize.w, height: panelSize.h }); }, [panelSize]);
  useEffect(() => { savePrefs({ minimized }); }, [minimized]);

  // Reset panel free position when chat closes
  useEffect(() => { if (!chatAberto) setPanelPos(null); }, [chatAberto]);

  useEffect(() => {
    if (chatAberto && !minimized) inputRef.current?.focus();
  }, [chatAberto, minimized]);

  // Corner positions for the button
  const getButtonStyle = useCallback((): React.CSSProperties => {
    if (isMobile || dragging && dragPos) {
      if (dragPos && !isMobile) return { position: "fixed", left: dragPos.x, top: dragPos.y, zIndex: 9998 };
    }
    const c = prefs.corner;
    const base: React.CSSProperties = { position: "fixed", zIndex: 9998 };
    if (c.includes("bottom")) base.bottom = 24; else base.top = 24;
    if (c.includes("right")) base.right = 24; else base.left = 24;
    return base;
  }, [prefs.corner, isMobile, dragging, dragPos]);

  // Panel position relative to button corner
  const getPanelStyle = useCallback((): React.CSSProperties => {
    if (isMobile) return {
      position: "fixed", bottom: 0, right: 0, left: 0, top: 0,
      width: "100%", height: "100%", zIndex: 9999, borderRadius: 0,
    };
    const w = expanded ? EXPANDED_W : panelSize.w;
    const h = minimized ? 56 : (expanded ? EXPANDED_H : panelSize.h);
    const style: React.CSSProperties = {
      position: "fixed", zIndex: 9999, width: w, height: h,
      transition: panelDragging.current ? "none" : "width 200ms ease, height 200ms ease",
    };
    if (panelPos) {
      style.left = panelPos.x;
      style.top = panelPos.y;
    } else {
      const c = prefs.corner;
      const gap = 80;
      if (c.includes("bottom")) style.bottom = gap; else style.top = gap;
      if (c.includes("right")) style.right = 24; else style.left = 24;
    }
    return style;
  }, [isMobile, panelSize, prefs.corner, minimized, expanded, panelPos]);

  // Panel header drag handlers
  const handleHeaderPointerDown = useCallback((e: React.PointerEvent) => {
    if (isMobile) return;
    // Don't drag if clicking buttons
    if ((e.target as HTMLElement).closest("button")) return;
    const panel = (e.currentTarget as HTMLElement).closest("[data-petra-panel]") as HTMLElement;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    panelDragging.current = true;
    panelDragStart.current = { mx: e.clientX, my: e.clientY, px: rect.left, py: rect.top };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [isMobile]);

  const handleHeaderPointerMove = useCallback((e: React.PointerEvent) => {
    if (!panelDragging.current || !panelDragStart.current) return;
    const dx = e.clientX - panelDragStart.current.mx;
    const dy = e.clientY - panelDragStart.current.my;
    const newX = Math.max(0, Math.min(window.innerWidth - 200, panelDragStart.current.px + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 56, panelDragStart.current.py + dy));
    setPanelPos({ x: newX, y: newY });
  }, []);

  const handleHeaderPointerUp = useCallback(() => {
    panelDragging.current = false;
    panelDragStart.current = null;
  }, []);

  // Drag handlers (desktop only)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isMobile) return;
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    dragStart.current = { x: e.clientX, y: e.clientY, bx: rect.left, by: rect.top };
    longPressTimer.current = setTimeout(() => {
      setDragReady(true);
      setDragging(true);
      setDragPos({ x: rect.left, y: rect.top });
      el.setPointerCapture(e.pointerId);
    }, 400);
  }, [isMobile]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setDragPos({ x: dragStart.current.bx + dx, y: dragStart.current.by + dy });
  }, [dragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (!dragging) {
      setDragReady(false);
      return;
    }
    // Snap to nearest corner
    const cx = e.clientX;
    const cy = e.clientY;
    const midX = window.innerWidth / 2;
    const midY = window.innerHeight / 2;
    const corner: Corner = `${cy < midY ? "top" : "bottom"}-${cx < midX ? "left" : "right"}` as Corner;
    setPrefs(p => ({ ...p, corner }));
    setDragging(false);
    setDragPos(null);
    setDragReady(false);
    dragStart.current = null;
  }, [dragging]);

  // Resize handlers
  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = true;
    resizeStart.current = { x: e.clientX, y: e.clientY, w: panelSize.w, h: panelSize.h };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [panelSize]);

  const handleResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!resizing.current || !resizeStart.current) return;
    const c = prefs.corner;
    const dx = (c.includes("right") ? -1 : 1) * (e.clientX - resizeStart.current.x);
    const dy = (c.includes("bottom") ? -1 : 1) * (e.clientY - resizeStart.current.y);
    const newW = Math.min(MAX_W, Math.max(MIN_W, resizeStart.current.w + dx));
    const newH = Math.min(MAX_H, Math.max(MIN_H, resizeStart.current.h + dy));
    setPanelSize({ w: newW, h: newH });
  }, [prefs.corner]);

  const handleResizePointerUp = useCallback(() => {
    resizing.current = false;
    resizeStart.current = null;
  }, []);

  const handleSend = () => {
    if (!input.trim() || carregando || limitAtingido) return;
    enviarMensagem(input);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Resposta copiada!" });
  };

  const toggleMinimize = () => {
    setMinimized(m => !m);
    if (expanded) setExpanded(false);
  };

  const toggleExpand = () => {
    if (minimized) setMinimized(false);
    setExpanded(e => !e);
  };

  const limitColor = perguntasHoje <= 3 ? "text-green-400" : perguntasHoje <= 4 ? "text-yellow-400" : "text-red-400";

  return (
    <>
      {/* Floating Button */}
      {!chatAberto && (
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={() => { if (!dragging) toggleChat(); }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={getButtonStyle()}
              className="flex flex-col items-center gap-1 touch-none"
              animate={dragging ? { scale: 0.9, opacity: 0.7 } : dragReady ? { scale: 1.1 } : { y: [0, -6, 0] }}
              transition={dragging ? { duration: 0.1 } : { duration: 2, repeat: Infinity, repeatDelay: 8 }}
            >
              <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#0D47A1] to-[#1565C0] flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow text-white text-xl font-bold select-none">
                <Sparkles className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-semibold text-foreground/70 select-none">Petra IA</span>
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side={prefs.corner.includes("right") ? "left" : "right"}>
            <p>{isMobile ? "Olá! Sou a Petra 💬" : "Segure e arraste para mover • Clique para abrir"}</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Chat Panel */}
      <AnimatePresence>
        {chatAberto && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={getPanelStyle()}
            data-petra-panel
            className="rounded-2xl shadow-2xl flex flex-col overflow-hidden bg-[#F8FAFC] border border-border max-sm:!rounded-none"
          >
            {/* Header - draggable */}
            <div
              className="bg-gradient-to-r from-[#0D47A1] to-[#1976D2] p-3 flex items-center gap-3 shrink-0 select-none"
              style={{ cursor: isMobile ? "default" : "grab", touchAction: "none" }}
              onPointerDown={handleHeaderPointerDown}
              onPointerMove={handleHeaderPointerMove}
              onPointerUp={handleHeaderPointerUp}
              onPointerCancel={handleHeaderPointerUp}
              onClick={() => minimized && setMinimized(false)}
            >
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-base">P</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">Petra</span>
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-white/70">Online</span>
                </div>
                {!minimized && <span className="text-[11px] text-white/60">Assistente de estudos ✨</span>}
              </div>
              {!isPremium && isLoggedIn && !minimized && (
                <span className={`text-xs font-medium ${limitColor}`}>💬 {perguntasHoje}/5</span>
              )}
              {isPremium && !minimized && <span className="text-xs text-amber-300">✨ Ilimitado</span>}
              <div className="flex gap-0.5">
                {!minimized && (
                  <button onClick={(e) => { e.stopPropagation(); limparConversa(); }} className="text-white/60 hover:text-white p-1" title="Limpar">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                {!isMobile && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); toggleMinimize(); }} className="text-white/60 hover:text-white p-1" title="Minimizar">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleExpand(); }} className="text-white/60 hover:text-white p-1" title={expanded ? "Restaurar" : "Expandir"}>
                      {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    </button>
                  </>
                )}
                <button onClick={(e) => { e.stopPropagation(); fecharChat(); setMinimized(false); setExpanded(false); }} className="text-white/60 hover:text-white p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body (hidden when minimized) */}
            {!minimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {mensagens.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} onFeedback={setFeedback} onCopy={handleCopy} onUpgrade={() => navigate("/app/upgrade")} />
                  ))}
                  {carregando && (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0D47A1] to-[#1565C0] flex items-center justify-center text-white text-xs font-bold shrink-0">P</div>
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
                  <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} onClick={() => enviarMensagem(s)} className="text-xs border border-[#1565C0]/30 text-[#0D47A1] bg-white rounded-full px-2.5 py-1 hover:bg-[#0D47A1]/5 transition-colors">
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
                      <button onClick={() => navigate("/app/upgrade")} className="text-xs font-medium text-amber-600 hover:text-amber-700">
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
                        className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565C0]/30 max-h-24"
                        disabled={carregando}
                      />
                      <button
                        onClick={handleSend}
                        disabled={!input.trim() || carregando}
                        className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0D47A1] to-[#1565C0] flex items-center justify-center text-white disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Resize handle (desktop only) */}
                {!isMobile && (
                  <div
                    onPointerDown={handleResizePointerDown}
                    onPointerMove={handleResizePointerMove}
                    onPointerUp={handleResizePointerUp}
                    className={`absolute w-4 h-4 cursor-nwse-resize opacity-40 hover:opacity-80 transition-opacity ${
                      prefs.corner.includes("right") ? "left-0" : "right-0"
                    } ${prefs.corner.includes("bottom") ? "top-0" : "bottom-0"}`}
                    style={{ touchAction: "none" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-muted-foreground">
                      <circle cx="4" cy="4" r="1.5" />
                      <circle cx="4" cy="10" r="1.5" />
                      <circle cx="10" cy="10" r="1.5" />
                    </svg>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MessageBubble({ msg, onFeedback, onCopy, onUpgrade }: {
  msg: PetraMessage;
  onFeedback: (id: string, fb: "up" | "down") => void;
  onCopy: (text: string) => void;
  onUpgrade: () => void;
}) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-[#1565C0] text-white rounded-2xl rounded-br px-4 py-2 max-w-[80%] text-sm">{msg.content}</div>
      </div>
    );
  }

  const isLimitMsg = msg.content.includes("5 perguntas gratuitas");

  return (
    <div className="flex gap-2 items-start">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0D47A1] to-[#1565C0] flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1">P</div>
      <div className="max-w-[85%]">
        <div className="bg-white border border-border rounded-2xl rounded-bl px-3 py-2 shadow-sm text-sm prose prose-sm max-w-none [&_p]:mb-1 [&_ul]:mb-1 [&_li]:mb-0">
          <ReactMarkdown>{msg.content}</ReactMarkdown>
          {isLimitMsg && (
            <button onClick={onUpgrade} className="mt-2 inline-block bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
              🚀 Ver Planos
            </button>
          )}
        </div>
        {msg.id !== "initial" && !isLimitMsg && (
          <div className="flex gap-2 mt-1 ml-1">
            <button onClick={() => onFeedback(msg.id, "up")} className={`p-1 rounded hover:bg-muted transition-colors ${msg.feedback === "up" ? "text-green-600" : "text-muted-foreground/40"}`}>
              <ThumbsUp className="h-3 w-3" />
            </button>
            <button onClick={() => onFeedback(msg.id, "down")} className={`p-1 rounded hover:bg-muted transition-colors ${msg.feedback === "down" ? "text-red-500" : "text-muted-foreground/40"}`}>
              <ThumbsDown className="h-3 w-3" />
            </button>
            <button onClick={() => onCopy(msg.content)} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground/40">
              <Copy className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
