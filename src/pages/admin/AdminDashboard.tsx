import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, FileQuestion, TrendingUp, BookOpen, Crown, Activity,
  Clock, BarChart3, UserCheck, AlertTriangle
} from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

export default function AdminDashboard() {
  // Basic stats
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [profiles, questions, attempts, subjects, subs] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("questions").select("id", { count: "exact", head: true }),
        supabase.from("question_attempts").select("id", { count: "exact", head: true }),
        supabase.from("subjects").select("id", { count: "exact", head: true }),
        supabase.from("subscriptions").select("user_id, plan, status"),
      ]);

      const subData = subs.data ?? [];
      const proActive = subData.filter(s => s.plan === "pro" && s.status === "active").length;
      const freeUsers = subData.filter(s => s.plan === "free").length;
      const canceled = subData.filter(s => s.status === "canceled").length;

      return {
        users: profiles.count ?? 0,
        questions: questions.count ?? 0,
        attempts: attempts.count ?? 0,
        subjects: subjects.count ?? 0,
        proActive,
        freeUsers,
        canceled,
      };
    },
  });

  // Recent signups (last 7 days)
  const { data: recentSignups } = useQuery({
    queryKey: ["admin-recent-signups"],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { data } = await supabase
        .from("profiles")
        .select("created_at, name")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  // Daily activity (last 7 days)
  const { data: dailyActivity } = useQuery({
    queryKey: ["admin-daily-activity"],
    queryFn: async () => {
      const days: { date: string; label: string; attempts: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const day = subDays(new Date(), i);
        const start = startOfDay(day).toISOString();
        const end = startOfDay(subDays(new Date(), i - 1)).toISOString();
        const { count } = await supabase
          .from("question_attempts")
          .select("id", { count: "exact", head: true })
          .gte("attempted_at", start)
          .lt("attempted_at", end);
        days.push({
          date: day.toISOString(),
          label: format(day, "EEE", { locale: ptBR }),
          attempts: count ?? 0,
        });
      }
      return days;
    },
  });

  // Mock exams stats
  const { data: mockStats } = useQuery({
    queryKey: ["admin-mock-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("mock_exams")
        .select("id, score_percent, finished_at, type")
        .not("finished_at", "is", null)
        .order("finished_at", { ascending: false })
        .limit(100);

      const exams = data ?? [];
      const avgScore = exams.length > 0
        ? Math.round(exams.reduce((acc, e) => acc + (e.score_percent ?? 0), 0) / exams.length)
        : 0;
      const totalFinished = exams.length;
      const quickCount = exams.filter(e => e.type === "quick").length;
      const fullCount = exams.filter(e => e.type === "full").length;

      return { avgScore, totalFinished, quickCount, fullCount };
    },
  });

  // Subscription pie data
  const pieData = [
    { name: "PRO Ativo", value: stats?.proActive ?? 0, color: "hsl(var(--primary))" },
    { name: "Free", value: stats?.freeUsers ?? 0, color: "hsl(var(--muted-foreground))" },
    { name: "Cancelado", value: stats?.canceled ?? 0, color: "hsl(var(--destructive))" },
  ].filter(d => d.value > 0);

  const mainCards = [
    { title: "Usuários", value: stats?.users ?? 0, icon: Users, color: "text-blue-500" },
    { title: "Questões", value: stats?.questions ?? 0, icon: FileQuestion, color: "text-emerald-500" },
    { title: "Respostas", value: stats?.attempts ?? 0, icon: TrendingUp, color: "text-amber-500" },
    { title: "PRO Ativos", value: stats?.proActive ?? 0, icon: Crown, color: "text-purple-500" },
  ];

  return (
    <AdminLayout>
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Painel de Monitoramento</h1>
            <p className="text-sm text-muted-foreground">Visão geral da plataforma em tempo real</p>
          </div>
          <Badge variant="outline" className="border-green-500/50 text-green-600 gap-1">
            <Activity className="h-3 w-3" /> Online
          </Badge>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {mainCards.map((c) => (
            <Card key={c.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{c.value.toLocaleString("pt-BR")}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Daily Activity */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Atividade Diária (Últimos 7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailyActivity && dailyActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailyActivity}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Bar dataKey="attempts" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Respostas" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                  Carregando...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-500" />
                Distribuição de Planos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-3 text-xs mt-2">
                    {pieData.map((d) => (
                      <div key={d.name} className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                        <span className="text-muted-foreground">{d.name}: {d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">
                  Sem dados
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Mock Exams Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Simulados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{mockStats?.totalFinished ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Finalizados</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{mockStats?.avgScore ?? 0}%</p>
                  <p className="text-xs text-muted-foreground">Média Score</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{mockStats?.quickCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Rápidos</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{mockStats?.fullCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Completos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Signups */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-500" />
                Cadastros Recentes (7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentSignups && recentSignups.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {recentSignups.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                        {s.name ?? "Sem nome"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(s.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[100px] flex items-center justify-center text-muted-foreground text-sm">
                  Nenhum cadastro recente
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Security Notice */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Lembrete de Segurança</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ative a "Proteção contra senhas vazadas" no{" "}
                <a
                  href="https://supabase.com/dashboard/project/cyyqtjvwbbktwlxgnkzv/auth/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  painel do Supabase → Auth → Providers
                </a>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
