import { motion } from "framer-motion";
import { TrendingUp, Target, AlertTriangle, Award, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import AppLayout from "@/components/AppLayout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from "recharts";

const subjectData = [
  { subject: "Português", acerto: 78, questoes: 120 },
  { subject: "Matemática", acerto: 62, questoes: 85 },
  { subject: "Inglês", acerto: 85, questoes: 45 },
  { subject: "Informática", acerto: 71, questoes: 30 },
  { subject: "Espec. I", acerto: 55, questoes: 20 },
];

const radarData = [
  { subject: "Português", value: 78 },
  { subject: "Matemática", value: 62 },
  { subject: "Inglês", value: 85 },
  { subject: "Informática", value: 71 },
  { subject: "Espec. I", value: 55 },
];

const strengths = [
  { subject: "Inglês", rate: "85%", trend: "+5%" },
  { subject: "Português", rate: "78%", trend: "+3%" },
];

const weaknesses = [
  { subject: "Conhecimentos Específicos I", rate: "55%", trend: "-2%", tip: "Revisar teoria básica" },
  { subject: "Matemática / Raciocínio Lógico", rate: "62%", trend: "+1%", tip: "Foco em Matemática Financeira" },
];

export default function PerformancePage() {
  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-accent" />
            Análise de Desempenho
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Entenda seus pontos fortes e fracos</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Questões resolvidas", value: "300", icon: Target },
            { label: "Taxa de acerto geral", value: "72%", icon: Award },
            { label: "Tempo médio/questão", value: "2m 15s", icon: Clock },
            { label: "Sequência atual", value: "7 dias", icon: TrendingUp },
          ].map((s, i) => (
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
                  <Tooltip contentStyle={{ background: 'hsl(0,0%,100%)', border: '1px solid hsl(200,15%,89%)', borderRadius: '8px', fontSize: '12px' }} />
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
              {strengths.map((s) => (
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
              {weaknesses.map((w) => (
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
      </div>
    </AppLayout>
  );
}
