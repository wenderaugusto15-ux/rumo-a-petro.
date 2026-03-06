import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Users, BookOpen, FileQuestion, TrendingUp, Crown, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [profiles, questions, attempts, subjects] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("questions").select("id", { count: "exact", head: true }),
        supabase.from("question_attempts").select("id", { count: "exact", head: true }),
        supabase.from("subjects").select("id", { count: "exact", head: true }),
      ]);
      return {
        users: profiles.count ?? 0,
        questions: questions.count ?? 0,
        attempts: attempts.count ?? 0,
        subjects: subjects.count ?? 0,
      };
    },
  });

  const { data: recentUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-recent-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, name, plano, plano_ativo_ate, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const cards = [
    { title: "Usuários", value: stats?.users ?? 0, icon: Users },
    { title: "Questões", value: stats?.questions ?? 0, icon: FileQuestion },
    { title: "Respostas", value: stats?.attempts ?? 0, icon: TrendingUp },
    { title: "Matérias", value: stats?.subjects ?? 0, icon: BookOpen },
  ];

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-extrabold text-foreground">Painel Administrativo</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <Card key={c.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
                <c.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{c.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Students Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Alunos Recentes</CardTitle>
            <Link to="/admin/usuarios">
              <Button variant="outline" size="sm" className="gap-1">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {usersLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead>Cadastro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(recentUsers ?? []).map((profile) => {
                    const isPremium =
                      profile.plano === "premium" &&
                      profile.plano_ativo_ate &&
                      new Date(profile.plano_ativo_ate) > new Date();
                    return (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.name || "—"}</TableCell>
                        <TableCell>
                          {isPremium ? (
                            <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white border-0">
                              <Crown className="h-3 w-3 mr-1" /> PREMIUM
                            </Badge>
                          ) : (
                            <Badge variant="secondary">FREE</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isPremium && profile.plano_ativo_ate
                            ? format(new Date(profile.plano_ativo_ate), "dd/MM/yyyy", { locale: ptBR })
                            : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(profile.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(recentUsers ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
