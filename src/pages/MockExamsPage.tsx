import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, BookOpen, Zap, ChevronRight, Trophy, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";
import { useAssinatura } from "@/hooks/useAssinatura";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MockExamsPage() {
  const navigate = useNavigate();
  const { isAssinante } = useAssinatura();
  const { user } = useAuth();
  const [subjectDialog, setSubjectDialog] = useState(false);

  const { data: subjects } = useQuery({
    queryKey: ["subjects-for-mock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: recentExams } = useQuery({
    queryKey: ["recent-mock-exams", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("mock_exams")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleStartQuick = () => {
    navigate("/app/simulados/rapido");
  };

  const handleStartFull = () => {
    navigate("/app/simulados/completo");
  };

  const handleSubjectExam = () => {
    if (!isAssinante) {
      navigate("/app/upgrade");
      return;
    }
    setSubjectDialog(true);
  };

  const handleSelectSubject = (subjectId: string) => {
    setSubjectDialog(false);
    navigate(`/app/simulados/materia/${subjectId}`);
  };

  const mockExamTypes = [
    {
      title: "Simulado Rápido",
      desc: "20 questões selecionadas para treino ágil",
      duration: "~30 min",
      icon: Zap,
      locked: false,
      subjects: ["Português", "Matemática", "Inglês"],
      onClick: handleStartQuick,
    },
    {
      title: "Simulado Completo",
      desc: "Simulação fiel ao estilo Cesgranrio",
      duration: "~4 horas",
      icon: BookOpen,
      locked: false,
      subjects: ["Todas as matérias da trilha"],
      onClick: handleStartFull,
    },
    {
      title: "Simulado por Matéria",
      desc: "Foque em uma disciplina específica",
      duration: "~45 min",
      icon: Trophy,
      locked: !isAssinante,
      subjects: ["Escolha a matéria"],
      onClick: handleSubjectExam,
    },
  ];

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
                onClick={exam.onClick}
                className={exam.locked ? "w-full bg-muted text-muted-foreground hover:bg-muted/80" : "w-full bg-gradient-cta text-accent-foreground shadow-cta hover:opacity-90"}
              >
                {exam.locked ? "Desbloquear" : "Iniciar"} <ChevronRight className="ml-1 h-4 w-4" />
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
            {(!recentExams || recentExams.length === 0) ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Nenhum simulado realizado ainda. Comece agora!
              </div>
            ) : (
              recentExams.map((exam) => (
                <div key={exam.id} className="p-4 sm:px-5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-foreground">
                      Simulado {exam.type === "quick" ? "Rápido" : "Completo"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(exam.created_at), "dd/MM/yyyy", { locale: ptBR })} · {exam.total_questions} questões
                    </div>
                  </div>
                  <div className={`text-lg font-extrabold ${(exam.score_percent ?? 0) >= 70 ? "text-green-500" : "text-accent"}`}>
                    {exam.score_percent != null ? `${Math.round(exam.score_percent)}%` : "—"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Subject selection dialog */}
      <Dialog open={subjectDialog} onOpenChange={setSubjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escolha a Matéria</DialogTitle>
            <DialogDescription>Selecione a disciplina para o simulado</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 max-h-80 overflow-y-auto">
            {subjects?.map((s) => (
              <Button
                key={s.id}
                variant="outline"
                className="justify-start text-left"
                onClick={() => handleSelectSubject(s.id)}
              >
                {s.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
