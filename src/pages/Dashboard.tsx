import { motion } from "framer-motion";
import {
  BookOpen, Clock, TrendingUp, Zap, Target,
  ChevronRight, Flame, Trophy, Medal, ArrowRight, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const }
  }),
};

function CountdownTimer({ days }: { days: number | null }) {
  if (days === null) {
    return (
      <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
        <Clock className="h-5 w-5 text-accent shrink-0" />
        <div>
          <div className="text-sm font-bold text-foreground">Configure sua data de prova no Plano de Estudo</div>
          <div className="text-xs text-muted-foreground">Assim você terá um contador regressivo aqui.</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
      <Clock className="h-5 w-5 text-accent shrink-0" />
      <div>
        <div className="text-sm font-bold text-foreground">
          Faltam <span className="text-accent text-lg">{days}</span> dias para a prova
        </div>
        <div className="text-xs text-muted-foreground">Cada sessão de estudo conta. Mantenha o ritmo!</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useDashboardData();

  if (isLoading || !data) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const {
    userName, xp, level, streak, overallProgress, daysUntilExam,
    weeklyChart, todayMinutes, weekSessions,
    totalQuestionsAnswered, last7DaysAccuracy, currentStreak,
    weakestSubject, weakestAccuracy,
  } = data;

  const todayProgress = todayMinutes.planned > 0 ? Math.round((todayMinutes.done / todayMinutes.planned) * 100) : 0;
  const weekProgress = weekSessions.total > 0 ? Math.round((weekSessions.done / weekSessions.total) * 100) : 0;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" className="mb-6">
          <motion.div variants={fadeUp} custom={0} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                Olá, {userName}! 👋
              </h1>
              <p className="text-muted-foreground mt-1">Continue sua preparação de alta performance.</p>
            </div>
            <div className="flex items-center gap-3">
              {streak > 0 && (
                <div className="flex items-center gap-1.5 bg-accent/10 text-accent rounded-full px-3 py-1.5 text-sm font-bold">
                  <Flame className="h-4 w-4" />
                  {streak} dias seguidos
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-success/10 text-success rounded-full px-3 py-1.5 text-sm font-bold">
                <Zap className="h-4 w-4" />
                {xp} XP
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={1}>
            <CountdownTimer days={daysUntilExam} />
          </motion.div>

          {/* Overall Progress */}
          <motion.div variants={fadeUp} custom={2} className="mt-4 bg-card rounded-xl p-4 shadow-card border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">Progresso geral</span>
              <span className="text-sm font-bold text-accent">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3 [&>div]:bg-gradient-cta" />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">Nível: <span className="font-semibold text-foreground">{level}</span></span>
              <span className="text-xs text-muted-foreground">
                {xp < 300 && `Próximo: Operador (300 XP)`}
                {xp >= 300 && xp < 1000 && `Próximo: Técnico (1000 XP)`}
                {xp >= 1000 && xp < 2500 && `Próximo: Engenheiro (2500 XP)`}
                {xp >= 2500 && xp < 5000 && `Próximo: Aprovado (5000 XP)`}
                {xp >= 5000 && `Nível máximo atingido! 🏆`}
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Cards Grid */}
        <motion.div initial="hidden" animate="visible" className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {/* Study Plan Card */}
          <motion.div variants={fadeUp} custom={3} className="bg-card rounded-xl p-5 shadow-card border border-border hover:shadow-card-hover transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Plano de Estudo</h3>
                <p className="text-xs text-muted-foreground">Meta do dia: {todayMinutes.planned} min</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hoje</span>
                <span className="font-semibold text-foreground">{todayMinutes.done}/{todayMinutes.planned} min</span>
              </div>
              <Progress value={todayProgress} className="h-2 [&>div]:bg-primary" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Semana</span>
                <span className="font-semibold text-foreground">{weekSessions.done}/{weekSessions.total} sessões</span>
              </div>
              <Progress value={weekProgress} className="h-2 [&>div]:bg-primary" />
            </div>
            <Link to="/app/plano">
              <Button variant="outline" size="sm" className="w-full">
                Ver meu plano <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Questions Card */}
          <motion.div variants={fadeUp} custom={4} className="bg-card rounded-xl p-5 shadow-card border border-border hover:shadow-card-hover transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Questões</h3>
                <p className="text-xs text-muted-foreground">Padrão Cesgranrio</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="text-xl font-extrabold text-foreground">{currentStreak}</div>
                <div className="text-xs text-muted-foreground">Sequência</div>
              </div>
              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="text-xl font-extrabold text-success">{last7DaysAccuracy}%</div>
                <div className="text-xs text-muted-foreground">Acerto 7 dias</div>
              </div>
            </div>
            <Link to="/app/questoes">
              <Button size="sm" className="w-full bg-gradient-cta text-accent-foreground shadow-cta hover:opacity-90">
                Resolver agora <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Simulados Card */}
          <motion.div variants={fadeUp} custom={5} className="bg-card rounded-xl p-5 shadow-card border border-border hover:shadow-card-hover transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Simulados</h3>
                <p className="text-xs text-muted-foreground">Estilo prova real</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <button className="w-full text-left p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <div className="text-sm font-semibold text-foreground">Simulado Rápido</div>
                <div className="text-xs text-muted-foreground">20 questões · ~30 min</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <div className="text-sm font-semibold text-foreground">Simulado Completo</div>
                <div className="text-xs text-muted-foreground">Estilo Cesgranrio · ~4h</div>
              </button>
            </div>
            <Link to="/app/simulados">
              <Button variant="outline" size="sm" className="w-full">
                Iniciar com cronômetro <Clock className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Performance Chart */}
          <motion.div variants={fadeUp} custom={6} className="bg-card rounded-xl p-5 shadow-card border border-border sm:col-span-2 xl:col-span-2 hover:shadow-card-hover transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Desempenho Semanal</h3>
                  <p className="text-xs text-muted-foreground">Taxa de acerto por dia</p>
                </div>
              </div>
              <Link to="/app/desempenho" className="text-sm text-accent font-semibold hover:underline">
                Ver tudo
              </Link>
            </div>
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyChart}>
                  <defs>
                    <linearGradient id="colorAcertos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(155, 77%, 43%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(155, 77%, 43%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 15%, 89%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(200, 10%, 45%)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(200, 10%, 45%)' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(0, 0%, 100%)',
                      border: '1px solid hsl(200, 15%, 89%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="acertos" stroke="hsl(155, 77%, 43%)" strokeWidth={2.5} fill="url(#colorAcertos)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {weakestSubject && (
              <div className="mt-3 p-3 bg-accent/5 border border-accent/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-accent shrink-0" />
                  <span className="text-foreground font-medium">Recomendação:</span>
                  <span className="text-muted-foreground">Foque em {weakestSubject} — sua menor taxa de acerto ({weakestAccuracy}%).</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Gamification Card */}
          <motion.div variants={fadeUp} custom={7} className="bg-card rounded-xl p-5 shadow-card border border-border hover:shadow-card-hover transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Conquistas</h3>
                <p className="text-xs text-muted-foreground">Continue evoluindo!</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-2 rounded-lg ${totalQuestionsAnswered >= 100 ? "bg-success/5 border border-success/20" : "bg-muted"}`}>
                <Medal className={`h-5 w-5 ${totalQuestionsAnswered >= 100 ? "text-success" : "text-muted-foreground"}`} />
                <div>
                  <div className={`text-sm font-semibold ${totalQuestionsAnswered >= 100 ? "text-foreground" : "text-muted-foreground"}`}>100 Questões</div>
                  <div className="text-xs text-muted-foreground">
                    {totalQuestionsAnswered >= 100 ? "Resolvidas! 🎉" : `Faltam ${100 - totalQuestionsAnswered} questões`}
                  </div>
                </div>
              </div>
              <div className={`flex items-center gap-3 p-2 rounded-lg ${totalQuestionsAnswered >= 500 ? "bg-success/5 border border-success/20" : "bg-muted"}`}>
                <Medal className={`h-5 w-5 ${totalQuestionsAnswered >= 500 ? "text-success" : "text-muted-foreground"}`} />
                <div>
                  <div className={`text-sm font-medium ${totalQuestionsAnswered >= 500 ? "text-foreground" : "text-muted-foreground"}`}>500 Questões</div>
                  <div className="text-xs text-muted-foreground">
                    {totalQuestionsAnswered >= 500 ? "Resolvidas! 🎉" : `Faltam ${500 - totalQuestionsAnswered} questões`}
                  </div>
                </div>
              </div>
              <div className={`flex items-center gap-3 p-2 rounded-lg ${streak >= 7 ? "bg-success/5 border border-success/20" : "bg-muted"}`}>
                <Medal className={`h-5 w-5 ${streak >= 7 ? "text-success" : "text-muted-foreground"}`} />
                <div>
                  <div className={`text-sm font-medium ${streak >= 7 ? "text-foreground" : "text-muted-foreground"}`}>7 dias seguidos</div>
                  <div className="text-xs text-muted-foreground">
                    {streak >= 7 ? "Conquistado! 🔥" : `${streak}/7 dias`}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
