import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight, Download } from "lucide-react";
import QuestionFormDialog from "@/components/admin/QuestionFormDialog";
import CsvImportDialog from "@/components/admin/CsvImportDialog";
import BulkGenerateDialog from "@/components/admin/BulkGenerateDialog";
import type { Tables } from "@/integrations/supabase/types";

const PAGE_SIZE = 30;
const levelLabel: Record<string, string> = { easy: "Fácil", medium: "Médio", hard: "Difícil" };

type QuestionRow = Tables<"questions"> & {
  subjects: { name: string } | null;
  topics: { name: string } | null;
};

export default function AdminQuestionsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterTopic, setFilterTopic] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("questions").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      toast({ title: `${ids.length} questão(ões) excluída(s)!` });
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
      setDeleteId(null);
      setSelected(new Set());
      setBulkDeleteOpen(false);
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === questions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(questions.map((q) => q.id)));
    }
  };

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data } = await supabase.from("subjects").select("*").eq("active", true).order("name");
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: filterTopics } = useQuery({
    queryKey: ["topics-filter", filterSubject],
    queryFn: async () => {
      if (filterSubject === "all") return [];
      const { data } = await supabase.from("topics").select("*").eq("subject_id", filterSubject).eq("active", true).order("name");
      return data ?? [];
    },
    enabled: filterSubject !== "all",
    staleTime: 5 * 60 * 1000,
  });

  const { data: questionsData, isLoading } = useQuery({
    queryKey: ["admin-questions", page, filterSubject, filterTopic, filterLevel, debouncedSearch],
    queryFn: async () => {
      let countQuery = supabase.from("questions").select("*", { count: "exact", head: true });
      let query = supabase.from("questions").select("*, subjects(name), topics(name)");

      if (filterSubject !== "all") {
        countQuery = countQuery.eq("subject_id", filterSubject);
        query = query.eq("subject_id", filterSubject);
      }
      if (filterTopic !== "all") {
        countQuery = countQuery.eq("topic_id", filterTopic);
        query = query.eq("topic_id", filterTopic);
      }
      if (filterLevel !== "all") {
        const lvl = filterLevel as "easy" | "medium" | "hard";
        countQuery = countQuery.eq("level", lvl);
        query = query.eq("level", lvl);
      }
      if (debouncedSearch) {
        countQuery = countQuery.ilike("statement", `%${debouncedSearch}%`);
        query = query.ilike("statement", `%${debouncedSearch}%`);
      }

      const { count } = await countQuery;
      const { data } = await query
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      return { questions: (data ?? []) as QuestionRow[], total: count ?? 0 };
    },
  });

  const questions = questionsData?.questions ?? [];
  const total = questionsData?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const openEdit = (q: QuestionRow) => {
    setEditId(q.id);
    setFormOpen(true);
  };

  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(0);
  };

  const handleSubjectFilterChange = (v: string) => {
    setFilterSubject(v);
    setFilterTopic("all");
    setPage(0);
  };

  const [exporting, setExporting] = useState(false);
  const exportCsv = async () => {
    setExporting(true);
    try {
      let query = supabase.from("questions").select("*, subjects(name), topics(name)");
      if (filterSubject !== "all") query = query.eq("subject_id", filterSubject);
      if (filterTopic !== "all") query = query.eq("topic_id", filterTopic);
      if (filterLevel !== "all") query = query.eq("level", filterLevel as "easy" | "medium" | "hard");
      if (search) query = query.ilike("statement", `%${search}%`);
      const { data } = await query.order("created_at", { ascending: false }).limit(5000);
      if (!data?.length) { toast({ title: "Nenhuma questão para exportar" }); return; }

      const esc = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
      const header = "statement;option_a;option_b;option_c;option_d;option_e;correct_option;explanation;subject;level;tags";
      const rows = (data as QuestionRow[]).map((q) =>
        [q.statement, q.option_a, q.option_b, q.option_c, q.option_d, q.option_e, q.correct_option, q.explanation, q.subjects?.name ?? "", q.level, (q.tags ?? []).join(",")].map(esc).join(";")
      );
      const csv = [header, ...rows].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `questoes_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast({ title: `${data.length} questões exportadas!` });
    } finally { setExporting(false); }
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Questões</h1>
            <p className="text-sm text-muted-foreground">{total} questões no banco</p>
          </div>
          <div className="flex gap-2">
            {selected.size > 0 && (
              <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />Excluir {selected.size}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={exportCsv} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}Exportar CSV
            </Button>
            <CsvImportDialog open={csvOpen} onOpenChange={setCsvOpen} onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-questions"] })} />
            <BulkGenerateDialog onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-questions"] })} />
            <Button size="sm" onClick={() => { setEditId(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />Nova Questão
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <Input
            placeholder="Buscar por enunciado..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="max-w-xs"
          />
          <Select value={filterSubject} onValueChange={handleSubjectFilterChange}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Matéria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as matérias</SelectItem>
              {subjects?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {filterSubject !== "all" && (filterTopics?.length ?? 0) > 0 && (
            <Select value={filterTopic} onValueChange={handleFilterChange(setFilterTopic)}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Assunto" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os assuntos</SelectItem>
                {filterTopics?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={filterLevel} onValueChange={handleFilterChange(setFilterLevel)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Nível" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os níveis</SelectItem>
              <SelectItem value="easy">Fácil</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="hard">Difícil</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={questions.length > 0 && selected.size === questions.length} onCheckedChange={toggleAll} />
                    </TableHead>
                    <TableHead className="w-[45%]">Enunciado</TableHead>
                    <TableHead>Matéria</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Gabarito</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((q) => (
                    <TableRow key={q.id} data-state={selected.has(q.id) ? "selected" : undefined}>
                      <TableCell>
                        <Checkbox checked={selected.has(q.id)} onCheckedChange={() => toggleSelect(q.id)} />
                      </TableCell>
                      <TableCell className="font-medium truncate max-w-[300px]">{q.statement.substring(0, 80)}...</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{q.subjects?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{q.topics?.name ?? "—"}</TableCell>
                      <TableCell><Badge variant="secondary">{levelLabel[q.level] ?? q.level}</Badge></TableCell>
                      <TableCell className="font-bold">{q.correct_option}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(q)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(q.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {questions.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma questão encontrada</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {page + 1} de {totalPages || 1} · Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  Próxima<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <QuestionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editId={editId}
        question={editId ? questions.find((q) => q.id === editId) ?? null : null}
        subjects={subjects ?? []}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-questions"] })}
      />

      <AlertDialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir questão?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. A questão será removida permanentemente do banco.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteId && deleteMutation.mutate([deleteId])}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selected.size} questões?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. As questões selecionadas serão removidas permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate(Array.from(selected))}>
              Excluir {selected.size}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
