import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronLeft, ChevronRight, Flag, Clock, CheckCircle2, AlertTriangle,
  Loader2, Menu, X, Trophy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

type ExamType = "rapido" | "completo" | "materia";

interface QuestionData {
  id: string;
  statement: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  subject_id: string;
}

const OPTION_LABELS = ["A", "B", "C", "D", "E"] as const;
const OPTION_KEYS = ["option_a", "option_b", "option_c", "option_d", "option_e"] as const;

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function MockExamTakingPage() {
  const { type, subjectId } = useParams<{ type: string; subjectId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const examType: ExamType = (type === "completo" ? "completo" : type === "materia" ? "materia" : "rapido");
  const timerDuration = examType === "completo" ? 4 * 3600 : examType === "rapido" ? 30 * 60 : 45 * 60;

  const examTitle = examType === "rapido" ? "Simulado Rápido" : examType === "completo" ? "Simulado Completo" : "Simulado por Matéria";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [showMap, setShowMap] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [finished, setFinished] = useState(false);
  const [examId, setExamId] = useState<string | null>(null);

  // Fetch questions
  const { data: questions, isLoading } = useQuery({
    queryKey: ["exam-questions", examType, subjectId],
    queryFn: async () => {
      let query = supabase.from("questions")
        .select("id, statement, option_a, option_b, option_c, option_d, option_e, subject_id")
        .eq("active", true);

      if (examType === "materia" && subjectId) {
        query = query.eq("subject_id", subjectId);
      }

      const { data, error } = await query.order("created_at");
      if (error) throw error;

      let selected = data as QuestionData[];

      if (examType === "rapido") {
        // Shuffle and pick 20
        selected = selected.sort(() => Math.random() - 0.5).slice(0, 20);
      }

      return selected;
    },
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  // Timer
  useEffect(() => {
    if (finished || !questions?.length) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [finished, questions]);

  // Create exam record
  const createExamMutation = useMutation({
    mutationFn: async (totalQuestions: number) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("mock_exams")
        .insert({
          user_id: user.id,
          type: examType === "rapido" ? "quick" : "full",
          total_questions: totalQuestions,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
  });

  // Save results
  const finishMutation = useMutation({
    mutationFn: async () => {
      if (!user || !questions) throw new Error("Missing data");

      // Create exam if not yet
      let eid = examId;
      if (!eid) {
        eid = await createExamMutation.mutateAsync(questions.length);
        setExamId(eid);
      }

      // Insert questions into mock_exam_questions
      const questionRows = questions.map((q, idx) => ({
        mock_exam_id: eid!,
        question_id: q.id,
        order_index: idx,
      }));

      const { error: qErr } = await supabase.from("mock_exam_questions").insert(questionRows);
      if (qErr) throw qErr;

      // Insert answers
      let correctCount = 0;
      const answerRows = questions
        .filter((q) => answers[q.id])
        .map((q) => {
          const isCorrect = answers[q.id] === q.correct_option;
          if (isCorrect) correctCount++;
          return {
            mock_exam_id: eid!,
            question_id: q.id,
            chosen_option: answers[q.id],
            is_correct: isCorrect,
          };
        });

      if (answerRows.length > 0) {
        const { error: aErr } = await supabase.from("mock_exam_answers").insert(answerRows);
        if (aErr) throw aErr;
      }

      const scorePct = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;
      const elapsed = timerDuration - timeLeft;

      const { error: uErr } = await supabase
        .from("mock_exams")
        .update({
          finished_at: new Date().toISOString(),
          score_percent: scorePct,
          duration_seconds: elapsed,
        })
        .eq("id", eid!);
      if (uErr) throw uErr;

      return { scorePct, correctCount, total: questions.length, elapsed };
    },
    onSuccess: () => {
      setFinished(true);
      setConfirmFinish(false);
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  const handleFinish = useCallback(() => {
    if (!finishMutation.isPending) {
      finishMutation.mutate();
    }
  }, [finishMutation]);

  const currentQuestion = questions?.[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions?.length ?? 0;

  const results = useMemo(() => {
    if (!finished || !questions) return null;
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_option) correct++;
    });
    return { correct, total: questions.length, pct: questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0 };
  }, [finished, questions, answers]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Carregando questões...</p>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Nenhuma questão disponível</h2>
          <p className="text-muted-foreground text-sm">Não há questões cadastradas para este tipo de simulado.</p>
          <Button onClick={() => navigate("/app/simulados")}>Voltar</Button>
        </div>
      </div>
    );
  }

  // Results screen
  if (finished && results) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card rounded-2xl shadow-lg border border-border p-8 max-w-md w-full text-center space-y-6"
        >
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Simulado Concluído!</h1>
          <div className={`text-5xl font-black ${results.pct >= 70 ? "text-green-500" : results.pct >= 50 ? "text-yellow-500" : "text-destructive"}`}>
            {results.pct}%
          </div>
          <p className="text-muted-foreground">
            Você acertou <strong className="text-foreground">{results.correct}</strong> de <strong className="text-foreground">{results.total}</strong> questões
          </p>
          <div className="text-sm text-muted-foreground">
            Tempo: {formatTime(timerDuration - timeLeft)}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => navigate("/app/simulados")}>
              Voltar
            </Button>
            <Button className="flex-1 bg-gradient-cta text-accent-foreground" onClick={() => navigate("/app/desempenho")}>
              Ver Desempenho
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowMap(!showMap)}>
            {showMap ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <div>
            <h1 className="text-sm font-bold text-foreground">{examTitle}</h1>
            <p className="text-xs text-muted-foreground">
              Questão {currentIndex + 1} de {totalQuestions}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`font-mono text-sm ${timeLeft < 300 ? "border-destructive text-destructive animate-pulse" : ""}`}>
            <Clock className="h-3.5 w-3.5 mr-1" />
            {formatTime(timeLeft)}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {answeredCount}/{totalQuestions}
          </Badge>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Question map sidebar */}
        <AnimatePresence>
          {showMap && (
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              className="w-64 bg-card border-r border-border p-4 overflow-y-auto shrink-0 fixed lg:relative inset-y-0 top-[57px] z-40"
            >
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">Mapa de Questões</h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const answered = !!answers[q.id];
                  const isFlagged = flagged.has(q.id);
                  const isCurrent = idx === currentIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => { setCurrentIndex(idx); setShowMap(false); }}
                      className={`h-9 w-9 rounded-lg text-xs font-bold flex items-center justify-center transition-all border
                        ${isCurrent ? "ring-2 ring-primary border-primary" : "border-border"}
                        ${answered ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}
                        ${isFlagged ? "ring-2 ring-yellow-500" : ""}
                      `}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-primary/20" /> Respondida</div>
                <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-muted border border-border" /> Não respondida</div>
                <div className="flex items-center gap-2"><div className="h-3 w-3 rounded ring-2 ring-yellow-500" /> Marcada para revisão</div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Question area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full">
          {currentQuestion && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Statement */}
                <div className="bg-card rounded-xl border border-border p-5 mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="text-xs">Questão {currentIndex + 1}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFlagged((prev) => {
                          const next = new Set(prev);
                          if (next.has(currentQuestion.id)) next.delete(currentQuestion.id);
                          else next.add(currentQuestion.id);
                          return next;
                        });
                      }}
                      className={flagged.has(currentQuestion.id) ? "text-yellow-500" : "text-muted-foreground"}
                    >
                      <Flag className="h-4 w-4 mr-1" />
                      {flagged.has(currentQuestion.id) ? "Marcada" : "Marcar"}
                    </Button>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{currentQuestion.statement}</p>
                </div>

                {/* Options */}
                <div className="space-y-2.5">
                  {OPTION_KEYS.map((key, idx) => {
                    const label = OPTION_LABELS[idx];
                    const text = currentQuestion[key];
                    const selected = answers[currentQuestion.id] === label;
                    return (
                      <button
                        key={key}
                        onClick={() => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: label }))}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 text-sm
                          ${selected
                            ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary"
                            : "border-border bg-card text-foreground hover:border-primary/50"
                          }`}
                      >
                        <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                          ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {label}
                        </span>
                        <span className="pt-0.5">{text}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Bottom navigation */}
      <footer className="sticky bottom-0 bg-card border-t border-border px-4 py-3 flex items-center justify-between">
        <Button
          variant="outline"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        <Button
          variant="destructive"
          onClick={() => setConfirmFinish(true)}
        >
          <CheckCircle2 className="h-4 w-4 mr-1" /> Finalizar
        </Button>
        <Button
          disabled={currentIndex === totalQuestions - 1}
          onClick={() => setCurrentIndex((i) => i + 1)}
        >
          Próxima <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </footer>

      {/* Confirm finish dialog */}
      <Dialog open={confirmFinish} onOpenChange={setConfirmFinish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Simulado?</DialogTitle>
            <DialogDescription>
              Você respondeu {answeredCount} de {totalQuestions} questões.
              {answeredCount < totalQuestions && (
                <span className="block mt-1 text-yellow-600 font-medium">
                  ⚠️ {totalQuestions - answeredCount} questão(ões) sem resposta serão consideradas erradas.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmFinish(false)}>Continuar</Button>
            <Button
              variant="destructive"
              disabled={finishMutation.isPending}
              onClick={handleFinish}
            >
              {finishMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Finalizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
