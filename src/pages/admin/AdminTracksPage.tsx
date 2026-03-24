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

export default function AdminTracksPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", category: "", active: true });

  const { data: tracks } = useQuery({
    queryKey: ["admin-tracks"],
    queryFn: async () => {
      const { data } = await supabase.from("tracks").select("*").order("name");
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, category: form.category || null, description: form.description || null };
      if (editId) {
        const { error } = await supabase.from("tracks").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tracks").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Trilha salva!" });
      qc.invalidateQueries({ queryKey: ["admin-tracks"] });
      setOpen(false);
      resetForm();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => { setEditId(null); setForm({ name: "", description: "", category: "", active: true }); };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-foreground">Trilhas</h1>
          <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Trilha</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Editar" : "Nova"} Trilha</DialogTitle></DialogHeader>
              <form className="space-y-4" onSubmit={e => { e.preventDefault(); save.mutate(); }}>
                <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
                <div><Label>Categoria</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex: Nível Superior" /></div>
                <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div className="flex items-center gap-3"><Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} /><Label>Ativa</Label></div>
                <Button type="submit" disabled={save.isPending} className="w-full">
                  {save.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Categoria</TableHead><TableHead>Status</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
            <TableBody>
              {tracks?.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground">{t.category ?? "—"}</TableCell>
                  <TableCell><Badge variant={t.active ? "default" : "outline"}>{t.active ? "Ativa" : "Inativa"}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditId(t.id);
                      setForm({ name: t.name, description: t.description ?? "", category: t.category ?? "", active: t.active });
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
