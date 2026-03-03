import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminPlansPage() {
  const qc = useQueryClient();

  const { data: limits } = useQuery({
    queryKey: ["admin-limits"],
    queryFn: async () => {
      const { data } = await supabase.from("usage_limits").select("*").order("plan");
      return data ?? [];
    },
  });

  const [freeLimits, setFreeLimits] = useState({ daily_questions_limit: 20, weekly_mocks_limit: 1 });
  const [proLimits, setProLimits] = useState({ daily_questions_limit: 9999, weekly_mocks_limit: 9999 });

  useEffect(() => {
    if (limits) {
      const free = limits.find(l => l.plan === "free");
      const pro = limits.find(l => l.plan === "pro");
      if (free) setFreeLimits({ daily_questions_limit: free.daily_questions_limit, weekly_mocks_limit: free.weekly_mocks_limit });
      if (pro) setProLimits({ daily_questions_limit: pro.daily_questions_limit, weekly_mocks_limit: pro.weekly_mocks_limit });
    }
  }, [limits]);

  const save = useMutation({
    mutationFn: async () => {
      const { error: e1 } = await supabase.from("usage_limits").update(freeLimits).eq("plan", "free");
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("usage_limits").update(proLimits).eq("plan", "pro");
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast({ title: "Limites atualizados!" });
      qc.invalidateQueries({ queryKey: ["admin-limits"] });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <h1 className="text-2xl font-extrabold text-foreground">Planos & Limites</h1>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl">
          <Card>
            <CardHeader><CardTitle>Plano Free</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Questões por dia</Label>
                <Input type="number" value={freeLimits.daily_questions_limit} onChange={e => setFreeLimits(f => ({ ...f, daily_questions_limit: +e.target.value }))} />
              </div>
              <div>
                <Label>Simulados por semana</Label>
                <Input type="number" value={freeLimits.weekly_mocks_limit} onChange={e => setFreeLimits(f => ({ ...f, weekly_mocks_limit: +e.target.value }))} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Plano PRO</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Questões por dia</Label>
                <Input type="number" value={proLimits.daily_questions_limit} onChange={e => setProLimits(f => ({ ...f, daily_questions_limit: +e.target.value }))} />
              </div>
              <div>
                <Label>Simulados por semana</Label>
                <Input type="number" value={proLimits.weekly_mocks_limit} onChange={e => setProLimits(f => ({ ...f, weekly_mocks_limit: +e.target.value }))} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar Limites
        </Button>
      </div>
    </AdminLayout>
  );
}
