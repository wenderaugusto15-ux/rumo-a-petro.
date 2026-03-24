import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

const emptyForm = {
  statement: "", option_a: "", option_b: "", option_c: "", option_d: "", option_e: "",
  correct_option: "A", explanation: "", subject_id: "", topic_id: null as string | null,
  level: "medium" as "easy" | "medium" | "hard", tags: [] as string[], active: true,
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editId: string | null;
  question: Tables<"questions"> | null;
  subjects: { id: string; name: string }[];
  onSuccess: () => void;
}

export default function QuestionFormDialog({ open, onOpenChange, editId, question, subjects, onSuccess }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    if (open && question && editId) {
      setForm({
        statement: question.statement, option_a: question.option_a, option_b: question.option_b,
        option_c: question.option_c, option_d: question.option_d, option_e: question.option_e,
        correct_option: question.correct_option, explanation: question.explanation,
        subject_id: question.subject_id, topic_id: question.topic_id, level: question.level,
        tags: question.tags ?? [], active: question.active,
      });
      setTagsInput((question.tags ?? []).join(", "));
    } else if (open && !editId) {
      setForm(emptyForm);
      setTagsInput("");
    }
  }, [open, editId, question]);

  const { data: topics } = useQuery({
    queryKey: ["topics", form.subject_id],
    queryFn: async () => {
      if (!form.subject_id) return [];
      const { data } = await supabase.from("topics").select("*").eq("subject_id", form.subject_id).eq("active", true).order("name");
      return data ?? [];
    },
    enabled: !!form.subject_id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: TablesInsert<"questions"> = {
        statement: form.statement, option_a: form.option_a, option_b: form.option_b,
        option_c: form.option_c, option_d: form.option_d, option_e: form.option_e,
        correct_option: form.correct_option, explanation: form.explanation,
        subject_id: form.subject_id, topic_id: form.topic_id || null,
        level: form.level, tags: form.tags.length > 0 ? form.tags : null, active: form.active,
      };
      if (editId) {
        const { error } = await supabase.from("questions").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("questions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editId ? "Questão atualizada!" : "Questão criada!" });
      onSuccess();
      onOpenChange(false);
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editId ? "Editar Questão" : "Nova Questão"}</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }}>
          <div><Label>Enunciado</Label><Textarea rows={4} value={form.statement} onChange={e => setForm(f => ({ ...f, statement: e.target.value }))} required /></div>
          {(["A", "B", "C", "D", "E"] as const).map(opt => (
            <div key={opt}><Label>Alternativa {opt}</Label><Input value={(form as any)[`option_${opt.toLowerCase()}`]} onChange={e => setForm(f => ({ ...f, [`option_${opt.toLowerCase()}`]: e.target.value }))} required /></div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Gabarito</Label>
              <Select value={form.correct_option} onValueChange={v => setForm(f => ({ ...f, correct_option: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["A", "B", "C", "D", "E"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Nível</Label>
              <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="easy">Fácil</SelectItem><SelectItem value="medium">Médio</SelectItem><SelectItem value="hard">Difícil</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Matéria</Label>
              <Select value={form.subject_id} onValueChange={v => setForm(f => ({ ...f, subject_id: v, topic_id: null }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Assunto</Label>
              <Select value={form.topic_id ?? "none"} onValueChange={v => setForm(f => ({ ...f, topic_id: v === "none" ? null : v }))}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent><SelectItem value="none">Nenhum</SelectItem>{topics?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Explicação</Label><Textarea rows={3} value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} /></div>
          <div><Label>Tags (separadas por vírgula)</Label><Input value={tagsInput} onChange={e => { setTagsInput(e.target.value); setForm(f => ({ ...f, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })); }} placeholder="CESGRANRIO, 2024, Petrobras" /></div>
          <Button type="submit" disabled={saveMutation.isPending} className="w-full">
            {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {editId ? "Salvar alterações" : "Criar questão"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
