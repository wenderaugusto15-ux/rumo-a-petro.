import { motion } from "framer-motion";
import { Clock, BookOpen, Zap, ChevronRight, Trophy, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";

const mockExamTypes = [
  {
    title: "Simulado Rápido",
    desc: "20 questões selecionadas para treino ágil",
    duration: "~30 min",
    icon: Zap,
    locked: false,
    subjects: ["Português", "Matemática", "Inglês"],
  },
  {
    title: "Simulado Completo",
    desc: "Simulação fiel ao estilo Cesgranrio",
    duration: "~4 horas",
    icon: BookOpen,
    locked: false,
    subjects: ["Todas as matérias da trilha"],
  },
  {
    title: "Simulado por Matéria",
    desc: "Foque em uma disciplina específica",
    duration: "~45 min",
    icon: Trophy,
    locked: true,
    subjects: ["Escolha a matéria"],
  },
];

const recentResults = [
  { date: "20/02/2026", type: "Rápido", score: 75, questions: 20 },
  { date: "18/02/2026", type: "Completo", score: 68, questions: 60 },
  { date: "15/02/2026", type: "Rápido", score: 80, questions: 20 },
];

export default function MockExamsPage() {
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
                className={exam.locked ? "w-full bg-muted text-muted-foreground" : "w-full bg-gradient-cta text-accent-foreground shadow-cta hover:opacity-90"}
                disabled={exam.locked}
              >
                {exam.locked ? "Desbloquear" : "Iniciar"} <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Recent results */}
        <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border">
            <h2 className="font-bold text-foreground">Resultados Recentes</h2>
          </div>
          <div className="divide-y divide-border">
            {recentResults.map((r, i) => (
              <div key={i} className="p-4 sm:px-5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-foreground">Simulado {r.type}</div>
                  <div className="text-xs text-muted-foreground">{r.date} · {r.questions} questões</div>
                </div>
                <div className={`text-lg font-extrabold ${r.score >= 70 ? "text-success" : "text-accent"}`}>
                  {r.score}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
