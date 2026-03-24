import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Calendar } from "lucide-react";

export default function AdminConfigPage() {
  const qc = useQueryClient();
  const [examDate, setExamDate] = useState("");

  const { data: config } = useQuery({
    queryKey: ["admin-config"],
    queryFn: async () => {
      const { data } = await supabase.from("app_config").select("*").eq("key", "exam_date").maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (config?.value) {
      setExamDate(String(config.value).replace(/"/g, ""));
    }
  }, [config]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("app_config").upsert({ key: "exam_date", value: JSON.parse(JSON.stringify(examDate)) });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Data da prova atualizada!" });
      qc.invalidateQueries({ queryKey: ["admin-config"] });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <h1 className="text-2xl font-extrabold text-foreground">Configurações Globais</h1>

        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Data da Prova
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); save.mutate(); }}>
              <div>
                <Label>Data da próxima prova Petrobras</Label>
                <Input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} required />
                <p className="text-xs text-muted-foreground mt-1">Essa data será usada no contador regressivo do dashboard de todos os usuários.</p>
              </div>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
