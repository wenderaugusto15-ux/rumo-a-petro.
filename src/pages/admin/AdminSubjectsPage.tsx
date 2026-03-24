import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Loader2 } from "lucide-react";

export default function AdminSubjectsPage() {
  const qc = useQueryClient();

  // Subjects state
  const [subOpen, setSubOpen] = useState(false);
  const [subEditId, setSubEditId] = useState<string | null>(null);
  const [subForm, setSubForm] = useState({ name: "", default_weight: 1, is_general: true, active: true });

  // Topics state
  const [topOpen, setTopOpen] = useState(false);
  const [topEditId, setTopEditId] = useState<string | null>(null);
  const [topForm, setTopForm] = useState({ name: "", subject_id: "", active: true });

  const { data: subjects } = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: async () => {
      const { data } = await supabase.from("subjects").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: topics } = useQuery({
    queryKey: ["admin-topics"],
    queryFn: async () => {
      const { data } = await supabase.from("topics").select("*, subjects(name)").order("name");
      return data ?? [];
    },
  });

  const saveSubject = useMutation({
    mutationFn: async () => {
      if (subEditId) {
        const { error } = await supabase.from("subjects").update(subForm).eq("id", subEditId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subjects").insert(subForm);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Matéria salva!" });
      qc.invalidateQueries({ queryKey: ["admin-subjects"] });
      setSubOpen(false);
      setSubEditId(null);
      setSubForm({ name: "", default_weight: 1, is_general: true, active: true });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const saveTopic = useMutation({
    mutationFn: async () => {
      if (topEditId) {
        const { error } = await supabase.from("topics").update(topForm).eq("id", topEditId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("topics").insert(topForm);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Assunto salvo!" });
      qc.invalidateQueries({ queryKey: ["admin-topics"] });
      setTopOpen(false);
      setTopEditId(null);
      setTopForm({ name: "", subject_id: "", active: true });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <h1 className="text-2xl font-extrabold text-foreground">Matérias & Assuntos</h1>

        <Tabs defaultValue="subjects">
          <TabsList>
            <TabsTrigger value="subjects">Matérias</TabsTrigger>
            <TabsTrigger value="topics">Assuntos</TabsTrigger>
          </TabsList>

          <TabsContent value="subjects" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={subOpen} onOpenChange={(v) => { setSubOpen(v); if (!v) { setSubEditId(null); setSubForm({ name: "", default_weight: 1, is_general: true, active: true }); } }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Matéria</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{subEditId ? "Editar" : "Nova"} Matéria</DialogTitle></DialogHeader>
                  <form className="space-y-4" onSubmit={e => { e.preventDefault(); saveSubject.mutate(); }}>
                    <div><Label>Nome</Label><Input value={subForm.name} onChange={e => setSubForm(f => ({ ...f, name: e.target.value }))} required /></div>
                    <div><Label>Peso padrão</Label><Input type="number" min={1} value={subForm.default_weight} onChange={e => setSubForm(f => ({ ...f, default_weight: +e.target.value }))} /></div>
                    <div className="flex items-center gap-3">
                      <Switch checked={subForm.is_general} onCheckedChange={v => setSubForm(f => ({ ...f, is_general: v }))} />
                      <Label>Conhecimento Geral</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={subForm.active} onCheckedChange={v => setSubForm(f => ({ ...f, active: v }))} />
                      <Label>Ativa</Label>
                    </div>
                    <Button type="submit" disabled={saveSubject.isPending} className="w-full">
                      {saveSubject.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Peso</TableHead><TableHead>Tipo</TableHead><TableHead>Status</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
                <TableBody>
                  {subjects?.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.default_weight}</TableCell>
                      <TableCell><Badge variant="secondary">{s.is_general ? "Geral" : "Específica"}</Badge></TableCell>
                      <TableCell><Badge variant={s.active ? "default" : "outline"}>{s.active ? "Ativa" : "Inativa"}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => {
                          setSubEditId(s.id);
                          setSubForm({ name: s.name, default_weight: s.default_weight, is_general: s.is_general, active: s.active });
                          setSubOpen(true);
                        }}><Pencil className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="topics" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={topOpen} onOpenChange={(v) => { setTopOpen(v); if (!v) { setTopEditId(null); setTopForm({ name: "", subject_id: "", active: true }); } }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-2" />Novo Assunto</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{topEditId ? "Editar" : "Novo"} Assunto</DialogTitle></DialogHeader>
                  <form className="space-y-4" onSubmit={e => { e.preventDefault(); saveTopic.mutate(); }}>
                    <div><Label>Nome</Label><Input value={topForm.name} onChange={e => setTopForm(f => ({ ...f, name: e.target.value }))} required /></div>
                    <div>
                      <Label>Matéria</Label>
                      <Select value={topForm.subject_id} onValueChange={v => setTopForm(f => ({ ...f, subject_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                        <SelectContent>
                          {subjects?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={topForm.active} onCheckedChange={v => setTopForm(f => ({ ...f, active: v }))} />
                      <Label>Ativo</Label>
                    </div>
                    <Button type="submit" disabled={saveTopic.isPending} className="w-full">
                      {saveTopic.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Assunto</TableHead><TableHead>Matéria</TableHead><TableHead>Status</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
                <TableBody>
                  {(topics as any[])?.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-muted-foreground">{t.subjects?.name ?? "—"}</TableCell>
                      <TableCell><Badge variant={t.active ? "default" : "outline"}>{t.active ? "Ativo" : "Inativo"}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => {
                          setTopEditId(t.id);
                          setTopForm({ name: t.name, subject_id: t.subject_id, active: t.active });
                          setTopOpen(true);
                        }}><Pencil className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
