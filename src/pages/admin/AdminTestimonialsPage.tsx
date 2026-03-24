import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Loader2 } from "lucide-react";

export default function AdminTestimonialsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", text: "", city: "", age: "" as string, active: true });

  const { data: testimonials } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, text: form.text, city: form.city || null, age: form.age ? +form.age : null, active: form.active };
      if (editId) {
        const { error } = await supabase.from("testimonials").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("testimonials").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Depoimento salvo!" });
      qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
      setOpen(false);
      resetForm();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => { setEditId(null); setForm({ name: "", text: "", city: "", age: "", active: true }); };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-foreground">Depoimentos</h1>
          <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Novo Depoimento</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Editar" : "Novo"} Depoimento</DialogTitle></DialogHeader>
              <form className="space-y-4" onSubmit={e => { e.preventDefault(); save.mutate(); }}>
                <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Cidade</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
                  <div><Label>Idade</Label><Input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} /></div>
                </div>
                <div><Label>Depoimento</Label><Textarea rows={4} value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} required /></div>
                <div className="flex items-center gap-3"><Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} /><Label>Ativo</Label></div>
                <Button type="submit" disabled={save.isPending} className="w-full">
                  {save.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Cidade</TableHead><TableHead>Texto</TableHead><TableHead>Status</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
            <TableBody>
              {testimonials?.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground">{t.city ?? "—"}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">{t.text}</TableCell>
                  <TableCell><Badge variant={t.active ? "default" : "outline"}>{t.active ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditId(t.id);
                      setForm({ name: t.name, text: t.text, city: t.city ?? "", age: t.age?.toString() ?? "", active: t.active });
                      setOpen(true);
                    }}><Pencil className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
