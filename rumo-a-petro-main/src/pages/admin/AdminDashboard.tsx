import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, FileQuestion, TrendingUp } from "lucide-react";

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

  const cards = [
    { title: "Usuários", value: stats?.users ?? 0, icon: Users },
    { title: "Questões", value: stats?.questions ?? 0, icon: FileQuestion },
    { title: "Respostas", value: stats?.attempts ?? 0, icon: TrendingUp },
    { title: "Matérias", value: stats?.subjects ?? 0, icon: BookOpen },
  ];

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <h1 className="text-2xl font-extrabold text-foreground">Painel Administrativo</h1>
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
      </div>
    </AdminLayout>
  );
}
