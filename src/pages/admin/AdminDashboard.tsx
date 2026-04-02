import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, Crown, Activity, AlertTriangle, UserCheck, TrendingUp, BarChart3
} from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

export default function AdminDashboard() {
  const { user } = useAuth();

  // Check if master
  const { data: isMaster } = useQuery({
    queryKey: ["admin-is-master", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "master")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  // Enhanced stats
  const { data: stats } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const [profiles, subs, weekProfiles] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("subscriptions").select("user_id, plan, status, trial_ends_at, is_lifetime"),
        supabase.from("profiles").select("id", { count: "exact", head: true })
          .gte("created_at", subDays(new Date(), 7).toISOString()),
      ]);

      const subData = subs.data ?? [];
      const now = new Date();
      const proActive = subData.filter(s => s.plan === "pro" && s.status === "active").length;
      const trialActive = subData.filter(s => {
        if (s.plan !== "free" || s.status !== "active") return false;
        const te = s.trial_ends_at ? new Date(s.trial_ends_at) : null;
        return te && now < te;
      }).length;
      const trialExpired = subData.filter(s => {
        if (s.plan !== "free" || s.status !== "active") return false;
        const te = s.trial_ends_at ? new Date(s.trial_ends_at) : null;
        return te && now >= te;
      }).length;
      const lifetime = subData.filter(s => s.is_lifetime).length;

      return {
        totalUsers: profiles.count ?? 0,
        newThisWeek: weekProfiles.count ?? 0,
        proActive,
        trialActive,
        trialExpired,
        lifetime,
      };
    },
  });

  // 30-day signups for line chart
  const { data: signupChart } = useQuery({
    queryKey: ["admin-signup-chart"],
    queryFn: async () => {
      const days: { label: string; count: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const day = subDays(new Date(), i);
        const start = startOfDay(day).toISOString();
        const end = startOfDay(subDays(new Date(), i - 1)).toISOString();
        const { count } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", start)
          .lt("created_at", end);
        days.push({
          label: format(day, "dd/MM", { locale: ptBR }),
          count: count ?? 0,
        });
      }
      return days;
    },
  });

  // Daily activity (14 days)
  const { data: activityChart } = useQuery({
    queryKey: ["admin-activity-chart"],
    queryFn: async () => {
      const days: { label: string; attempts: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const day = subDays(new Date(), i);
        const start = startOfDay(day).toISOString();
        const end = startOfDay(subDays(new Date(), i - 1)).toISOString();
        const { count } = await supabase
          .from("question_attempts")
          .select("id", { count: "exact", head: true })
          .gte("attempted_at", start)
          .lt("attempted_at", end);
        days.push({
          label: format(day, "dd/MM", { locale: ptBR }),
          attempts: count ?? 0,
        });
      }
      return days;
    },
  });

  // Recent signups
  const { data: recentSignups } = useQuery({
    queryKey: ["admin-recent-signups"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("created_at, name")
        .gte("created_at", subDays(new Date(), 7).toISOString())
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  // Pie data
  const pieData = [
    { name: "PRO", value: stats?.proActive ?? 0, color: "hsl(48, 96%, 53%)" },
    { name: "Trial Ativo", value: stats?.trialActive ?? 0, color: "hsl(142, 76%, 36%)" },
    { name: "Trial Expirado", value: stats?.trialExpired ?? 0, color: "hsl(25, 95%, 53%)" },
    { name: "Lifetime", value: stats?.lifetime ?? 0, color: "hsl(262, 83%, 58%)" },
  ].filter(d => d.value > 0);

  const metricCards = [
    {
      title: "Total de Usuários",
      value: stats?.totalUsers ?? 0,
      subtitle: `+${stats?.newThisWeek ?? 0} esta semana`,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Usuários Ativos",
      value: stats?.trialActive ?? 0,
      subtitle: "Em trial ativo",
      icon: Activity,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Assinantes PRO",
      value: stats?.proActive ?? 0,
      subtitle: stats?.lifetime ? `${stats.lifetime} lifetime` : "",
      icon: Crown,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      title: "Trial Expirado",
      value: stats?.trialExpired ?? 0,
      subtitle: "Potenciais conversões",
      icon: AlertTriangle,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ];

  const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--foreground))",
    fontSize: "12px",
  };

  return (
    <AdminLayout>
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground">Gerenciamento de Usuários e Métricas</p>
          </div>
          <Badge
            variant="outline"
            className={isMaster
              ? "border-purple-500/50 text-purple-600 gap-1"
              : "border-green-500/50 text-green-600 gap-1"
            }
          >
            <Crown className="h-3 w-3" />
            {isMaster ? "Master Admin" : "Admin"}
          </Badge>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((c) => (
            <Card key={c.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">{c.title}</CardTitle>
                <div className={`h-8 w-8 rounded-lg ${c.bg} flex items-center justify-center`}>
                  <c.icon className={`h-4 w-4 ${c.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{c.value.toLocaleString("pt-BR")}</div>
                {c.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{c.subtitle}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row 1: Signups Line + Plan Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Novos Cadastros (Últimos 30 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {signupChart && signupChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={signupChart}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} interval={4} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                      name="Cadastros"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">Carregando...</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                Distribuição de Planos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" stroke="none">
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 text-xs mt-2 justify-center">
                    {pieData.map((d) => (
                      <div key={d.name} className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                        <span className="text-muted-foreground">{d.name}: {d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2: Daily Activity + Recent Signups */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Acessos Diários (Últimos 14 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityChart && activityChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={activityChart}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} interval={1} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="attempts" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Respostas" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">Carregando...</div>
              )}
            </CardContent>
          </Card>

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
