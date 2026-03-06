import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, BookOpen, Layers, FileText } from "lucide-react";

// =================== MATÉRIAS TAB ===================
function MateriasTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ id: "", nome: "", descricao: "", icone: "", cor: "#1e3a5f", ordem: 0, ativo: true });

  const { data: materias, isLoading } = useQuery({
    queryKey: ["admin-materias"],
    queryFn: async () => {
      const { data } = await supabase.from("materias").select("*").order("ordem");
      return data || [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { nome: form.nome, descricao: form.descricao || null, icone: form.icone || null, cor: form.cor || null, ordem: form.ordem, ativo: form.ativo };
      if (form.id) {
        const { error } = await supabase.from("materias").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("materias").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-materias"] }); setOpen(false); toast({ title: "Matéria salva!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("materias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-materias"] }); setDeleteId(null); toast({ title: "Matéria excluída!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const openNew = () => { setForm({ id: "", nome: "", descricao: "", icone: "", cor: "#1e3a5f", ordem: (materias?.length || 0) + 1, ativo: true }); setOpen(true); };
  const openEdit = (m: any) => { setForm({ id: m.id, nome: m.nome, descricao: m.descricao || "", icone: m.icone || "", cor: m.cor || "#1e3a5f", ordem: m.ordem || 0, ativo: m.ativo ?? true }); setOpen(true); };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-foreground">Matérias</h2>
        <Button size="sm" onClick={openNew} className="gap-1"><Plus className="h-4 w-4" /> Nova Matéria</Button>
      </div>

      {isLoading ? <Skeleton className="h-48" /> : (
        <Table>
          <TableHeader>
            <TableRow><TableHead>Nome</TableHead><TableHead className="hidden sm:table-cell">Descrição</TableHead><TableHead>Cor</TableHead><TableHead>Ordem</TableHead><TableHead>Ativo</TableHead><TableHead className="w-24">Ações</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {(materias || []).map((m) => (
              <TableRow key={m.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{m.nome}</TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground max-w-[200px] truncate">{m.descricao}</TableCell>
                <TableCell><div className="h-5 w-5 rounded" style={{ backgroundColor: m.cor || "#ccc" }} /></TableCell>
                <TableCell>{m.ordem}</TableCell>
                <TableCell><Badge variant={m.ativo ? "default" : "secondary"}>{m.ativo ? "Sim" : "Não"}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? "Editar" : "Nova"} Matéria</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Ícone (Lucide)</Label><Input value={form.icone} onChange={e => setForm(f => ({ ...f, icone: e.target.value }))} placeholder="BookOpen" /></div>
              <div><Label>Cor</Label><div className="flex gap-2"><Input type="color" value={form.cor} onChange={e => setForm(f => ({ ...f, cor: e.target.value }))} className="w-12 h-10 p-1" /><Input value={form.cor} onChange={e => setForm(f => ({ ...f, cor: e.target.value }))} /></div></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Ordem</Label><Input type="number" value={form.ordem} onChange={e => setForm(f => ({ ...f, ordem: parseInt(e.target.value) || 0 }))} /></div>
              <div className="flex items-center gap-2 pt-6"><Switch checked={form.ativo} onCheckedChange={v => setForm(f => ({ ...f, ativo: v }))} /><Label>Ativo</Label></div>
            </div>
          </div>
          <DialogFooter><Button onClick={() => save.mutate()} disabled={!form.nome || save.isPending}>{save.isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir matéria?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && del.mutate(deleteId)}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// =================== MÓDULOS TAB ===================
function ModulosTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterMateria, setFilterMateria] = useState<string>("all");
  const [form, setForm] = useState({ id: "", materia_id: "", titulo: "", descricao: "", ordem: 0, ativo: true });

  const { data: materias } = useQuery({ queryKey: ["admin-materias"], queryFn: async () => { const { data } = await supabase.from("materias").select("*").order("ordem"); return data || []; } });
  const { data: modulos, isLoading } = useQuery({
    queryKey: ["admin-modulos"],
    queryFn: async () => { const { data } = await supabase.from("modulos").select("*, materias(nome)").order("ordem"); return data || []; },
  });

  const filtered = filterMateria === "all" ? modulos : (modulos || []).filter(m => m.materia_id === filterMateria);

  const save = useMutation({
    mutationFn: async () => {
      const payload = { materia_id: form.materia_id, titulo: form.titulo, descricao: form.descricao || null, ordem: form.ordem, ativo: form.ativo };
      if (form.id) { const { error } = await supabase.from("modulos").update(payload).eq("id", form.id); if (error) throw error; }
      else { const { error } = await supabase.from("modulos").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-modulos"] }); setOpen(false); toast({ title: "Módulo salvo!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("modulos").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-modulos"] }); setDeleteId(null); toast({ title: "Módulo excluído!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const openNew = () => { setForm({ id: "", materia_id: "", titulo: "", descricao: "", ordem: 0, ativo: true }); setOpen(true); };
  const openEdit = (m: any) => { setForm({ id: m.id, materia_id: m.materia_id || "", titulo: m.titulo, descricao: m.descricao || "", ordem: m.ordem || 0, ativo: m.ativo ?? true }); setOpen(true); };

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h2 className="font-semibold text-foreground">Módulos</h2>
        <div className="flex gap-2 items-center">
          <Select value={filterMateria} onValueChange={setFilterMateria}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar matéria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as matérias</SelectItem>
              {(materias || []).map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={openNew} className="gap-1"><Plus className="h-4 w-4" /> Novo Módulo</Button>
        </div>
      </div>

      {isLoading ? <Skeleton className="h-48" /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Título</TableHead><TableHead className="hidden sm:table-cell">Matéria</TableHead><TableHead>Ordem</TableHead><TableHead>Ativo</TableHead><TableHead className="w-24">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {(filtered || []).map((m: any) => (
              <TableRow key={m.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{m.titulo}</TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{m.materias?.nome}</TableCell>
                <TableCell>{m.ordem}</TableCell>
                <TableCell><Badge variant={m.ativo ? "default" : "secondary"}>{m.ativo ? "Sim" : "Não"}</Badge></TableCell>
                <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setDeleteId(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? "Editar" : "Novo"} Módulo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Matéria *</Label>
              <Select value={form.materia_id} onValueChange={v => setForm(f => ({ ...f, materia_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{(materias || []).map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Título *</Label><Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Ordem</Label><Input type="number" value={form.ordem} onChange={e => setForm(f => ({ ...f, ordem: parseInt(e.target.value) || 0 }))} /></div>
              <div className="flex items-center gap-2 pt-6"><Switch checked={form.ativo} onCheckedChange={v => setForm(f => ({ ...f, ativo: v }))} /><Label>Ativo</Label></div>
            </div>
          </div>
          <DialogFooter><Button onClick={() => save.mutate()} disabled={!form.titulo || !form.materia_id || save.isPending}>{save.isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir módulo?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && del.mutate(deleteId)}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// =================== CONTEÚDOS TAB ===================
function ConteudosTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterMateria, setFilterMateria] = useState<string>("all");
  const [filterModulo, setFilterModulo] = useState<string>("all");
  const [form, setForm] = useState({ id: "", modulo_id: "", formMateriaId: "", tipo: "video", titulo: "", descricao: "", video_url: "", video_thumbnail: "", duracao_minutos: 0, conteudo_texto: "", pdf_url: "", ordem: 0, ativo: true });

  const { data: materias } = useQuery({ queryKey: ["admin-materias"], queryFn: async () => { const { data } = await supabase.from("materias").select("*").order("ordem"); return data || []; } });
  const { data: allModulos } = useQuery({ queryKey: ["admin-modulos"], queryFn: async () => { const { data } = await supabase.from("modulos").select("*, materias(nome)").order("ordem"); return data || []; } });
  const { data: conteudos, isLoading } = useQuery({
    queryKey: ["admin-conteudos"],
    queryFn: async () => { const { data } = await supabase.from("conteudos").select("*, modulos(titulo, materia_id)").order("ordem"); return data || []; },
  });

  const filteredModulos = filterMateria === "all" ? allModulos : (allModulos || []).filter(m => m.materia_id === filterMateria);
  const formModulos = form.formMateriaId ? (allModulos || []).filter(m => m.materia_id === form.formMateriaId) : allModulos;

  const incompleteCount = (conteudos || []).filter(c => !hasContentCheck(c)).length;

  const filtered = (conteudos || []).filter(c => {
    if (filterMateria !== "all" && c.modulos?.materia_id !== filterMateria) return false;
    if (filterModulo !== "all" && c.modulo_id !== filterModulo) return false;
    return true;
  }).sort((a, b) => {
    const aInc = hasContentCheck(a) ? 1 : 0;
    const bInc = hasContentCheck(b) ? 1 : 0;
    return aInc - bInc;
  });

  const extractYtThumb = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : "";
  };

  const hasContentCheck = (c: any) => {
    if (c.tipo === "video" && c.video_url) return true;
    if (c.tipo === "texto" && c.conteudo_texto) return true;
    if (c.tipo === "pdf" && c.pdf_url) return true;
    return false;
  };

  const canSave = () => {
    if (!form.titulo || !form.modulo_id) return false;
    if (form.tipo === "video" && !form.video_url) return false;
    if (form.tipo === "texto" && !form.conteudo_texto) return false;
    if (form.tipo === "pdf" && !form.pdf_url) return false;
    return true;
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!canSave()) throw new Error("Preencha o conteúdo do material antes de salvar.");
      const payload: any = { modulo_id: form.modulo_id, tipo: form.tipo, titulo: form.titulo, descricao: form.descricao || null, ordem: form.ordem, ativo: form.ativo };
      if (form.tipo === "video") { payload.video_url = form.video_url; payload.video_thumbnail = extractYtThumb(form.video_url); payload.duracao_minutos = form.duracao_minutos || null; }
      if (form.tipo === "texto") { payload.conteudo_texto = form.conteudo_texto; }
      if (form.tipo === "pdf") { payload.pdf_url = form.pdf_url; }
      if (form.id) { const { error } = await supabase.from("conteudos").update(payload).eq("id", form.id); if (error) throw error; }
      else { const { error } = await supabase.from("conteudos").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-conteudos"] }); setOpen(false); toast({ title: "Conteúdo salvo!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("conteudos").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-conteudos"] }); setDeleteId(null); toast({ title: "Conteúdo excluído!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const openNew = () => { setForm({ id: "", modulo_id: "", formMateriaId: "", tipo: "video", titulo: "", descricao: "", video_url: "", video_thumbnail: "", duracao_minutos: 0, conteudo_texto: "", pdf_url: "", ordem: 0, ativo: true }); setOpen(true); };
  const openEdit = (c: any) => { setForm({ id: c.id, modulo_id: c.modulo_id || "", formMateriaId: c.modulos?.materia_id || "", tipo: c.tipo, titulo: c.titulo, descricao: c.descricao || "", video_url: c.video_url || "", video_thumbnail: c.video_thumbnail || "", duracao_minutos: c.duracao_minutos || 0, conteudo_texto: c.conteudo_texto || "", pdf_url: c.pdf_url || "", ordem: c.ordem || 0, ativo: c.ativo ?? true }); setOpen(true); };

  const tipoLabel: Record<string, string> = { video: "Vídeo", texto: "Texto", pdf: "PDF" };

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h2 className="font-semibold text-foreground">Conteúdos</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={filterMateria} onValueChange={v => { setFilterMateria(v); setFilterModulo("all"); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Matéria" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todas</SelectItem>{(materias || []).map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filterModulo} onValueChange={setFilterModulo}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Módulo" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos</SelectItem>{(filteredModulos || []).map(m => <SelectItem key={m.id} value={m.id}>{m.titulo}</SelectItem>)}</SelectContent>
          </Select>
          <Button size="sm" onClick={openNew} className="gap-1"><Plus className="h-4 w-4" /> Novo Conteúdo</Button>
        </div>
      </div>

      {isLoading ? <Skeleton className="h-48" /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Título</TableHead><TableHead className="hidden sm:table-cell">Módulo</TableHead><TableHead>Ordem</TableHead><TableHead>Ativo</TableHead><TableHead className="w-24">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.map((c: any) => {
              const incomplete = !hasContentCheck(c);
              return (
              <TableRow key={c.id} className={`hover:bg-muted/50 ${incomplete ? "bg-destructive/5" : ""}`}>
                <TableCell><Badge variant="outline" className="text-xs">{tipoLabel[c.tipo] || c.tipo}</Badge></TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">
                  <span className="flex items-center gap-2">
                    {c.titulo}
                    {incomplete && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Sem conteúdo</Badge>}
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{c.modulos?.titulo}</TableCell>
                <TableCell>{c.ordem}</TableCell>
                <TableCell><Badge variant={c.ativo ? "default" : "secondary"}>{c.ativo ? "Sim" : "Não"}</Badge></TableCell>
                <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Editar" : "Novo"} Conteúdo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Matéria</Label>
                <Select value={form.formMateriaId} onValueChange={v => setForm(f => ({ ...f, formMateriaId: v, modulo_id: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{(materias || []).map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Módulo *</Label>
                <Select value={form.modulo_id} onValueChange={v => setForm(f => ({ ...f, modulo_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{(formModulos || []).map((m: any) => <SelectItem key={m.id} value={m.id}>{m.titulo}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="video">Vídeo</SelectItem><SelectItem value="texto">Texto</SelectItem><SelectItem value="pdf">PDF</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Título *</Label><Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} /></div>
            </div>

            <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} /></div>

            {form.tipo === "video" && (
              <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                <div><Label>URL do YouTube</Label><Input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." /></div>
                {form.video_url && extractYtThumb(form.video_url) && (
                  <img src={extractYtThumb(form.video_url)} alt="Thumbnail" className="rounded-lg w-48" />
                )}
                <div><Label>Duração (minutos)</Label><Input type="number" value={form.duracao_minutos} onChange={e => setForm(f => ({ ...f, duracao_minutos: parseInt(e.target.value) || 0 }))} /></div>
              </div>
            )}

            {form.tipo === "texto" && (
              <div className="p-3 rounded-lg border bg-muted/30">
                <Label>Conteúdo (HTML)</Label>
                <Textarea value={form.conteudo_texto} onChange={e => setForm(f => ({ ...f, conteudo_texto: e.target.value }))} className="min-h-[200px] font-mono text-xs" />
              </div>
            )}

            {form.tipo === "pdf" && (
              <div className="p-3 rounded-lg border bg-muted/30">
                <Label>URL do PDF</Label>
                <Input value={form.pdf_url} onChange={e => setForm(f => ({ ...f, pdf_url: e.target.value }))} placeholder="https://..." />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Ordem</Label><Input type="number" value={form.ordem} onChange={e => setForm(f => ({ ...f, ordem: parseInt(e.target.value) || 0 }))} /></div>
              <div className="flex items-center gap-2 pt-6"><Switch checked={form.ativo} onCheckedChange={v => setForm(f => ({ ...f, ativo: v }))} /><Label>Ativo</Label></div>
            </div>
          </div>
          <DialogFooter>
            {!canSave() && form.titulo && form.modulo_id && (
              <p className="text-xs text-destructive mr-auto flex items-center">⚠️ O conteúdo do material é obrigatório</p>
            )}
            <Button onClick={() => save.mutate()} disabled={!canSave() || save.isPending}>{save.isPending ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir conteúdo?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && del.mutate(deleteId)}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// =================== MAIN PAGE ===================
export default function AdminEstudosPage() {
  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Admin › Estudos</p>
          <h1 className="text-2xl font-bold text-foreground">Gerenciar Conteúdos de Estudo</h1>
        </div>

        <Tabs defaultValue="materias">
          <TabsList>
            <TabsTrigger value="materias" className="gap-1"><BookOpen className="h-4 w-4" /> Matérias</TabsTrigger>
            <TabsTrigger value="modulos" className="gap-1"><Layers className="h-4 w-4" /> Módulos</TabsTrigger>
            <TabsTrigger value="conteudos" className="gap-1"><FileText className="h-4 w-4" /> Conteúdos</TabsTrigger>
          </TabsList>

          <TabsContent value="materias"><Card><CardContent className="pt-6"><MateriasTab /></CardContent></Card></TabsContent>
          <TabsContent value="modulos"><Card><CardContent className="pt-6"><ModulosTab /></CardContent></Card></TabsContent>
          <TabsContent value="conteudos"><Card><CardContent className="pt-6"><ConteudosTab /></CardContent></Card></TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
