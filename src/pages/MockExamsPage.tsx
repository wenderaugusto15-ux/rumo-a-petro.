import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, BookOpen, Zap, ChevronRight, Trophy, Lock, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserArea } from "@/hooks/useUserArea";
import AreaWarningBanner from "@/components/AreaWarningBanner";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";

type ExamTypeConfig = {
  title: string;
  desc: string;
  duration: string;
  icon: any;
  locked: boolean;
  subjects: string[];
  type: "quick" | "full";
  totalQuestions: number;
};

const mockExamTypes: ExamTypeConfig[] = [
  {
    title: "Simulado Rápido",
    desc: "20 questões selecionadas para treino ágil",
    duration: "~30 min",
    icon: Zap,
    locked: false,
    subjects: ["Gerais + Área Específica"],
    type: "quick",
    totalQuestions: 20,
  },
  {
    title: "Simulado Completo",
    desc: "60 questões no estilo Cesgranrio",
    duration: "~4 horas",
    icon: BookOpen,
    locked: false,
    subjects: ["Todas as matérias da sua área"],
    type: "full",
    totalQuestions: 60,
  },
  {
    title: "Simulado por Matéria",
    desc: "Foque em uma disciplina específica",
    duration: "~45 min",
    icon: Trophy,
    locked: true,
    subjects: ["Escolha a matéria"],
    type: "quick",
    totalQuestions: 20,
  },
];

interface RecentResult {
  id: string;
  created_at: string;
  type: string;
  score_percent: number | null;
  total_questions: number;
  finished_at: string | null;
}

export default function MockExamsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subjectIds, hasArea } = useUserArea();
  const [starting, setStarting] = useState<string | null>(null);
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);

  // Load real recent results
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("mock_exams")
        .select("id, created_at, type, score_percent, total_questions, finished_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setRecentResults(data || []);
      setLoadingResults(false);
    };
    load();
  }, [user]);

  const handleStartExam = async (exam: ExamTypeConfig) => {
    if (exam.locked || !user || starting) return;
    setStarting(exam.title);

    try {
      if (subjectIds.length === 0) {
        toast({ title: "Nenhuma matéria disponível", description: "Aguarde o carregamento ou selecione uma Área Específica.", variant: "destructive" });
        setStarting(null);
        return;
      }

      // Fetch questions only from relevant subjects (general + specific)
      const { data: questions, error: qErr } = await supabase
        .from("questions")
        .select("id")
        .eq("active", true)
        .in("subject_id", subjectIds)
        .limit(500);

      if (qErr) throw qErr;
      if (!questions || questions.length < exam.totalQuestions) {
        toast({ title: "Questões insuficientes", description: `Apenas ${questions?.length || 0} questões disponíveis para sua área.`, variant: "destructive" });
        setStarting(null);
        return;
      }

      // Shuffle and pick
      const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, exam.totalQuestions);

      // Create mock_exam record
      const { data: mockExam, error: examErr } = await supabase
        .from("mock_exams")
        .insert({
          user_id: user.id,
          type: exam.type,
          total_questions: exam.totalQuestions,
        })
        .select("id")
        .single();

      if (examErr || !mockExam) throw examErr;

      // Insert mock_exam_questions
      const examQuestions = shuffled.map((q, i) => ({
        mock_exam_id: mockExam.id,
        question_id: q.id,
        order_index: i,
      }));

      const { error: insertErr } = await supabase
        .from("mock_exam_questions")
        .insert(examQuestions);

      if (insertErr) throw insertErr;

      toast({ title: `${exam.title} iniciado!`, description: `${exam.totalQuestions} questões preparadas.` });
      navigate(`/app/simulado/${mockExam.id}`);
    } catch (err: any) {
      toast({ title: "Erro ao iniciar simulado", description: err?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setStarting(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Clock className="h-6 w-6 text-accent" />
            Simulados
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Treine como se fosse o dia da prova</p>
        </div>

        {!hasArea && <AreaWarningBanner />}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {mockExamTypes.map((exam, i) => (
            <motion.div
              key={exam.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-card rounded-xl p-5 shadow-card border border-border hover:shadow-card-hover transition-shadow relative ${exam.locked ? "opacity-70" : ""}`}
            >
              {exam.locked && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-accent/10 text-accent text-xs font-bold px-2 py-0.5 rounded-full">
                  <Lock className="h-3 w-3" /> PRO
                </div>
              )}
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <exam.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-bold text-foreground mb-1">{exam.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{exam.desc}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <Clock className="h-3.5 w-3.5" />
                {exam.duration}
              </div>
              <div className="flex flex-wrap gap-1 mb-4">
                {exam.subjects.map((s) => (
                  <span key={s} className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded">{s}</span>
                ))}
              </div>
              <Button
                className={exam.locked ? "w-full bg-muted text-muted-foreground" : "w-full bg-gradient-cta text-accent-foreground shadow-cta hover:opacity-90"}
                disabled={exam.locked || starting === exam.title}
                onClick={() => handleStartExam(exam)}
              >
                {starting === exam.title ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Preparando...</>
                ) : (
                  <>{exam.locked ? "Desbloquear" : "Iniciar"} <ChevronRight className="ml-1 h-4 w-4" /></>
                )}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Recent results from DB */}
        <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border">
            <h2 className="font-bold text-foreground">Resultados Recentes</h2>
          </div>
          <div className="divide-y divide-border">
            {loadingResults ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : recentResults.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Nenhum simulado realizado ainda. Comece agora!
              </div>
            ) : (
              recentResults.map((r) => (
                <div
                  key={r.id}
                  className="p-4 sm:px-5 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/app/simulado/${r.id}`)}
                >
                  <div>
                    <div className="font-semibold text-sm text-foreground">
                      Simulado {r.type === "quick" ? "Rápido" : "Completo"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(r.created_at)} · {r.total_questions} questões
                      {!r.finished_at && " · Em andamento"}
                    </div>
                  </div>
                  <div className={`text-lg font-extrabold ${r.finished_at ? ((r.score_percent ?? 0) >= 70 ? "text-success" : "text-accent") : "text-muted-foreground"}`}>
                    {r.finished_at ? `${r.score_percent}%` : "—"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
