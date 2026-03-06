import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronLeft, ChevronRight, Flag, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useMetaPixel } from "@/hooks/useMetaPixel";

interface ExamQuestion {
  order_index: number;
  question: {
    id: string;
    statement: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    option_e: string;
    correct_option: string;
    explanation: string;
    subject_id: string;
  };
}

interface Answer {
  question_id: string;
  chosen_option: string;
}

export default function MockExamTakingPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackEvent } = useMetaPixel();

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [examType, setExamType] = useState<string>("quick");
  const [startedAt, setStartedAt] = useState<string>("");

  // Load exam questions
  useEffect(() => {
    if (!examId || !user) return;

    const loadExam = async () => {
      // Get exam info
      const { data: exam, error: examError } = await supabase
        .from("mock_exams")
        .select("*")
        .eq("id", examId)
        .single();

      if (examError || !exam) {
        toast({ title: "Erro ao carregar simulado", description: examError?.message, variant: "destructive" });
        navigate("/app/simulados");
        return;
      }

      if (exam.finished_at) {
        setFinished(true);
        setScore(exam.score_percent);
      }

      setExamType(exam.type);
      setStartedAt(exam.started_at);

      // Calculate elapsed time from started_at
      const startTime = new Date(exam.started_at).getTime();
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - startTime) / 1000));

      // Get questions with their data
      const { data: examQuestions, error: qError } = await supabase
        .from("mock_exam_questions")
        .select("order_index, question:questions(id, statement, option_a, option_b, option_c, option_d, option_e, correct_option, explanation, subject_id)")
        .eq("mock_exam_id", examId)
        .order("order_index");

      if (qError) {
        toast({ title: "Erro ao carregar questões", description: qError.message, variant: "destructive" });
        return;
      }

      setQuestions((examQuestions as any) || []);

      // Load existing answers if any
      const { data: existingAnswers } = await supabase
        .from("mock_exam_answers")
        .select("question_id, chosen_option")
        .eq("mock_exam_id", examId);

      if (existingAnswers) {
        const ansMap = new Map<string, string>();
        existingAnswers.forEach((a) => ansMap.set(a.question_id, a.chosen_option));
        setAnswers(ansMap);
      }

      setLoading(false);
    };

    loadExam();
  }, [examId, user, navigate]);

  // Timer
  useEffect(() => {
    if (finished || loading) return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [finished, loading]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentQuestion = questions[currentIndex]?.question;

  const selectAnswer = (option: string) => {
    if (finished || !currentQuestion) return;
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(currentQuestion.id, option);
      return next;
    });
  };

  const handleFinish = useCallback(async () => {
    if (!examId || submitting) return;
    setSubmitting(true);

    try {
      // Save all answers
      const answerRows = questions.map((q) => ({
        mock_exam_id: examId,
        question_id: q.question.id,
        chosen_option: answers.get(q.question.id) || "",
        is_correct: (answers.get(q.question.id) || "").toLowerCase() === q.question.correct_option.toLowerCase(),
        time_spent_seconds: 0,
      })).filter((a) => a.chosen_option !== "");

      // Delete existing answers first, then insert
      await supabase.from("mock_exam_answers").delete().eq("mock_exam_id", examId);

      if (answerRows.length > 0) {
        const { error: insertError } = await supabase.from("mock_exam_answers").insert(answerRows);
        if (insertError) throw insertError;
      }

      // Calculate score
      const correct = answerRows.filter((a) => a.is_correct).length;
      const scorePercent = Math.round((correct / questions.length) * 100);

      // Update exam
      const { error: updateError } = await supabase
        .from("mock_exams")
        .update({
          finished_at: new Date().toISOString(),
          score_percent: scorePercent,
          duration_seconds: elapsedSeconds,
        })
        .eq("id", examId);

      if (updateError) throw updateError;

      setScore(scorePercent);
      setFinished(true);
      trackEvent("CompleteSimulado", { score: scorePercent, questions: questions.length });
      toast({ title: "Simulado finalizado!", description: `Sua nota: ${scorePercent}%` });
    } catch (err: any) {
      toast({ title: "Erro ao finalizar", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [examId, questions, answers, elapsedSeconds, submitting]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Finished state - show results
  if (finished) {
    const correct = questions.filter((q) => (answers.get(q.question.id) || "").toLowerCase() === q.question.correct_option.toLowerCase()).length;
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-xl p-6 sm:p-8 shadow-card border border-border text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-success" />
            <h1 className="text-2xl font-extrabold text-foreground mb-2">Simulado Finalizado!</h1>
            <p className="text-muted-foreground mb-6">Tempo total: {formatTime(elapsedSeconds)}</p>

            <div className="text-5xl font-extrabold mb-2" style={{ color: (score ?? 0) >= 70 ? "hsl(var(--success))" : "hsl(var(--accent))" }}>
              {score}%
            </div>
            <p className="text-muted-foreground mb-8">
              {correct} de {questions.length} questões corretas
            </p>

            {/* Review questions */}
            <div className="text-left space-y-4 mb-8">
              {questions.map((q, i) => {
                const chosen = answers.get(q.question.id);
                const isCorrect = (chosen || "").toLowerCase() === q.question.correct_option.toLowerCase();
                return (
                  <div key={q.question.id} className={`p-4 rounded-lg border ${isCorrect ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
                    <div className="flex items-start gap-2 mb-2">
                      <span className="font-bold text-sm text-muted-foreground">{i + 1}.</span>
                      <p className="text-sm text-foreground line-clamp-2">{q.question.statement}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Sua resposta: <span className="font-bold">{chosen || "—"}</span> · Correta: <span className="font-bold text-success">{q.question.correct_option}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/app/simulados")}>
                Voltar aos Simulados
              </Button>
              <Button className="flex-1 bg-gradient-cta text-accent-foreground" onClick={() => navigate("/app/desempenho")}>
                Ver Desempenho
              </Button>
            </div>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  const answeredCount = answers.size;
  const options = ["a", "b", "c", "d", "e"] as const;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        {/* Header with timer */}
        <div className="flex items-center justify-between mb-4 bg-card rounded-xl p-3 sm:p-4 shadow-card border border-border">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            <span className="font-mono font-bold text-foreground text-lg">{formatTime(elapsedSeconds)}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {answeredCount}/{questions.length} respondidas
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              if (answeredCount < questions.length) {
                if (!confirm(`Você respondeu ${answeredCount} de ${questions.length} questões. Deseja finalizar mesmo assim?`)) return;
              }
              handleFinish();
            }}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4 mr-1" />}
            Finalizar
          </Button>
        </div>

        {/* Question navigation pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {questions.map((q, i) => {
            const answered = answers.has(q.question.id);
            const isCurrent = i === currentIndex;
            return (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors
                  ${isCurrent ? "bg-accent text-accent-foreground ring-2 ring-accent/50" : answered ? "bg-success/20 text-success" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-card rounded-xl p-5 sm:p-6 shadow-card border border-border"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-accent/10 text-accent text-xs font-bold px-2 py-0.5 rounded-full">
                  Questão {currentIndex + 1} de {questions.length}
                </span>
              </div>

              <p className="text-foreground text-sm sm:text-base leading-relaxed mb-6 whitespace-pre-wrap">
                {currentQuestion.statement}
              </p>

              <div className="space-y-2 mb-6">
                {options.map((opt) => {
                  const text = currentQuestion[`option_${opt}` as keyof typeof currentQuestion] as string;
                  const isSelected = answers.get(currentQuestion.id) === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => selectAnswer(opt)}
                      className={`w-full text-left p-3 sm:p-4 rounded-lg border transition-all text-sm
                        ${isSelected
                          ? "border-accent bg-accent/10 text-foreground font-medium"
                          : "border-border bg-background hover:border-accent/50 text-foreground"
                        }`}
                    >
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold mr-3">
                        {opt.toUpperCase()}
                      </span>
                      {text}
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                  disabled={currentIndex === questions.length - 1}
                >
                  Próxima <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
