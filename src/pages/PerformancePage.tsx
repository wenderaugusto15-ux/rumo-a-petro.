import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, Target, AlertTriangle, Award, Clock, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { usePerformanceData } from "@/hooks/usePerformanceData";
import { useUserArea } from "@/hooks/useUserArea";
import AreaWarningBanner from "@/components/AreaWarningBanner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from "recharts";

function formatTime(seconds: number): string {
  if (seconds === 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export default function PerformancePage() {
  const navigate = useNavigate();
  const { subjectIds, hasArea } = useUserArea();
  const { data, isLoading } = usePerformanceData(subjectIds);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown <= 0) {
      navigate("/app/upgrade");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </AppLayout>
    );
  }

  const perf = data;
  const hasData = perf && perf.totalQuestions > 0;

  const statsCards = [
    { label: "Questões resolvidas", value: hasData ? String(perf.totalQuestions) : "0", icon: Target },
    { label: "Taxa de acerto geral", value: hasData ? `${perf.overallAccuracy}%` : "—", icon: Award },
    { label: "Tempo médio/questão", value: hasData ? formatTime(perf.avgTimeSeconds) : "—", icon: Clock },
    { label: "Sequência atual", value: hasData ? `${perf.streakDays} dias` : "0 dias", icon: TrendingUp },
  ];

  const subjectData = perf?.subjectData || [];
  const radarData = subjectData.map(s => ({ subject: s.subject, value: s.acerto }));
  const strengths = perf?.strengths || [];
  const weaknesses = perf?.weaknesses || [];

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-accent" />
            Análise de Desempenho
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Dados reais baseados nas suas respostas</p>
        </div>

        {!hasArea && <AreaWarningBanner />}

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-xl p-4 shadow-card border border-border text-center"
            >
              <s.icon className="h-5 w-5 text-accent mx-auto mb-2" />
              <div className="text-xl sm:text-2xl font-extrabold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {!hasData ? (
          <div className="bg-card rounded-xl p-8 shadow-card border border-border text-center">
            <p className="text-muted-foreground">Responda algumas questões para ver sua análise de desempenho aqui.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Bar Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl p-5 shadow-card border border-border"
              >
                <h3 className="font-bold text-foreground mb-4">Acerto por Matéria</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 15%, 89%)" />
                      <XAxis dataKey="subject" tick={{ fontSize: 10, fill: 'hsl(200, 10%, 45%)' }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(200, 10%, 45%)' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: 'hsl(0,0%,100%)', border: '1px solid hsl(200,15%,89%)', borderRadius: '8px', fontSize: '12px' }} formatter={(value: number) => [`${value}%`, 'Acerto']} />
                      <Bar dataKey="acerto" fill="hsl(155, 77%, 43%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Radar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-xl p-5 shadow-card border border-border"
              >
                <h3 className="font-bold text-foreground mb-4">Radar de Competências</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(200, 15%, 89%)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: 'hsl(200, 10%, 45%)' }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                      <Radar dataKey="value" stroke="hsl(24, 100%, 55%)" fill="hsl(24, 100%, 55%)" fillOpacity={0.2} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="bg-card rounded-xl p-5 shadow-card border border-border">
                <h3 className="font-bold text-foreground flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-success" /> Pontos Fortes
                </h3>
                <div className="space-y-3">
                  {strengths.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Responda mais questões para identificar seus pontos fortes.</p>
                  ) : strengths.map((s) => (
                    <div key={s.subject} className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20">
                      <div>
                        <div className="text-sm font-semibold text-foreground">{s.subject}</div>
                        <div className="text-xs text-success">{s.trend} na última semana</div>
                      </div>
                      <div className="text-lg font-extrabold text-success">{s.rate}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weaknesses */}
              <div className="bg-card rounded-xl p-5 shadow-card border border-border">
                <h3 className="font-bold text-foreground flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-accent" /> Pontos a Melhorar
                </h3>
                <div className="space-y-3">
                  {weaknesses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Responda mais questões para identificar pontos a melhorar.</p>
                  ) : weaknesses.map((w) => (
                    <div key={w.subject} className="p-3 bg-accent/5 rounded-lg border border-accent/20">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-semibold text-foreground">{w.subject}</div>
                        <div className="text-lg font-extrabold text-accent">{w.rate}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">💡 {w.tip}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
