import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft, Play, FileText, FileDown, BookOpen,
  CheckCircle2, Clock, FolderOpen,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function EstudosMateriaPage() {
  const { materiaId } = useParams<{ materiaId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConteudo, setSelectedConteudo] = useState<any>(null);

  const { data: materia, isLoading: loadingMateria } = useQuery({
    queryKey: ["materia", materiaId],
    queryFn: async () => {
      const { data } = await supabase
        .from("materias")
        .select("*")
        .eq("id", materiaId!)
        .single();
      return data;
    },
    enabled: !!materiaId,
  });

  const { data: modulos, isLoading: loadingModulos } = useQuery({
    queryKey: ["modulos-materia", materiaId],
    queryFn: async () => {
      const { data } = await supabase
        .from("modulos")
        .select("*")
        .eq("materia_id", materiaId!)
        .eq("ativo", true)
        .order("ordem");
      return data || [];
    },
    enabled: !!materiaId,
  });

  const { data: conteudos } = useQuery({
    queryKey: ["conteudos-materia", materiaId],
    queryFn: async () => {
      const moduloIds = (modulos || []).map(m => m.id);
      if (moduloIds.length === 0) return [];
      const { data } = await supabase
        .from("conteudos")
        .select("*")
        .in("modulo_id", moduloIds)
        .eq("ativo", true)
        .order("ordem");
      return data || [];
    },
    enabled: !!modulos && modulos.length > 0,
  });

  const { data: progresso } = useQuery({
    queryKey: ["progresso-materia", user?.id, materiaId],
    queryFn: async () => {
      const conteudoIds = (conteudos || []).map(c => c.id);
      if (conteudoIds.length === 0) return [];
      const { data } = await supabase
        .from("progresso_estudo")
        .select("*")
        .eq("user_id", user!.id)
        .in("conteudo_id", conteudoIds);
      return data || [];
    },
    enabled: !!user && !!conteudos && conteudos.length > 0,
  });

  const completedMap = new Map((progresso || []).map(p => [p.conteudo_id, !!p.concluido]));

  const toggleConcluido = useMutation({
    mutationFn: async (conteudoId: string) => {
      const existing = (progresso || []).find(p => p.conteudo_id === conteudoId);
      if (existing) {
        await supabase
          .from("progresso_estudo")
          .update({
            concluido: !existing.concluido,
            data_conclusao: !existing.concluido ? new Date().toISOString() : null,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("progresso_estudo").insert({
          user_id: user!.id,
          conteudo_id: conteudoId,
          concluido: true,
          data_inicio: new Date().toISOString(),
          data_conclusao: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progresso-materia"] });
      queryClient.invalidateQueries({ queryKey: ["progresso-estudo"] });
      toast({ title: "Progresso atualizado!" });
    },
  });

  const tipoIcon = (tipo: string) => {
    if (tipo === "video") return <Play className="h-4 w-4 text-red-500" />;
    if (tipo === "pdf") return <FileDown className="h-4 w-4 text-accent" />;
    return <FileText className="h-4 w-4 text-primary" />;
  };

  const cor = materia?.cor || "#1e3a5f";

  // Overall materia progress
  const allConteudoIds = (conteudos || []).map(c => c.id);
  const totalDone = allConteudoIds.filter(id => completedMap.get(id)).length;
  const totalAll = allConteudoIds.length;
  const overallPercent = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

  const getModuloStatus = (moduloId: string) => {
    const mc = (conteudos || []).filter(c => c.modulo_id === moduloId);
    if (mc.length === 0) return "empty";
    const done = mc.filter(c => completedMap.get(c.id)).length;
    if (done === mc.length) return "done";
    if (done > 0) return "in_progress";
    return "not_started";
  };

  const statusBadge = (status: string) => {
    if (status === "done")
      return <Badge className="bg-green-500/15 text-green-600 border-green-500/30 text-xs">Concluído</Badge>;
    if (status === "in_progress")
      return <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 text-xs">Em andamento</Badge>;
    return <Badge variant="secondary" className="text-xs">Não iniciado</Badge>;
  };

  const isLoading = loadingMateria || loadingModulos;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/app/estudos")} className="gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar para Estudos
          </Button>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
              <Skeleton className="h-3 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${cor}15` }}>
                  <BookOpen className="h-5 w-5" style={{ color: cor }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{materia?.nome}</h1>
                  {materia?.descricao && <p className="text-sm text-muted-foreground">{materia.descricao}</p>}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso da matéria</span>
                  <span className="font-semibold">{totalDone} de {totalAll} concluídos</span>
                </div>
                <Progress value={overallPercent} className="h-3" />
                <p className="text-xs text-muted-foreground text-right">{overallPercent}%</p>
              </div>
            </div>
          )}
        </div>

        {/* Módulos */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (modulos || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <FolderOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Nenhum módulo cadastrado ainda</h3>
              <p className="text-sm text-muted-foreground mt-1">Os módulos serão adicionados em breve.</p>
            </div>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {(modulos || []).map((modulo) => {
              const moduloConteudos = (conteudos || []).filter(c => c.modulo_id === modulo.id);
              const done = moduloConteudos.filter(c => completedMap.get(c.id)).length;
              const total = moduloConteudos.length;
              const percent = total > 0 ? Math.round((done / total) * 100) : 0;
              const status = getModuloStatus(modulo.id);

              return (
                <AccordionItem key={modulo.id} value={modulo.id} className="border rounded-xl overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30">
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cor}15` }}>
                        <BookOpen className="h-4 w-4" style={{ color: cor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{modulo.titulo}</p>
                        {modulo.descricao && <p className="text-xs text-muted-foreground line-clamp-1">{modulo.descricao}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs">{total} conteúdo{total !== 1 ? "s" : ""}</Badge>
                        {statusBadge(status)}
                        <span className="text-xs font-medium text-muted-foreground hidden sm:block">{percent}%</span>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-4 pb-3">
                    <div className="mb-2">
                      <Progress value={percent} className="h-1.5" />
                    </div>
                    <div className="space-y-1">
                      {moduloConteudos.map((conteudo) => {
                        const isDone = !!completedMap.get(conteudo.id);
                        return (
                          <div
                            key={conteudo.id}
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                          >
                            <Checkbox
                              checked={isDone}
                              onCheckedChange={() => toggleConcluido.mutate(conteudo.id)}
                              className="shrink-0"
                            />
                            {tipoIcon(conteudo.tipo)}
                            <span className={`text-sm flex-1 truncate ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                              {conteudo.titulo}
                            </span>
                            {conteudo.duracao_minutos && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {conteudo.duracao_minutos} min
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setSelectedConteudo(conteudo)}
                            >
                              Estudar
                            </Button>
                          </div>
                        );
                      })}
                      {moduloConteudos.length === 0 && (
                        <p className="text-xs text-muted-foreground py-3 text-center">Nenhum conteúdo disponível neste módulo</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>

      {/* Content Viewer Modal */}
      <Dialog open={!!selectedConteudo} onOpenChange={() => setSelectedConteudo(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedConteudo && tipoIcon(selectedConteudo.tipo)}
              {selectedConteudo?.titulo}
            </DialogTitle>
          </DialogHeader>

          {selectedConteudo?.tipo === "video" && selectedConteudo.video_url && (
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              <iframe
                src={selectedConteudo.video_url}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          )}

          {selectedConteudo?.tipo === "texto" && selectedConteudo.conteudo_texto && (
            <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: selectedConteudo.conteudo_texto }} />
          )}

          {selectedConteudo?.tipo === "pdf" && selectedConteudo.pdf_url && (
            <iframe src={selectedConteudo.pdf_url} className="w-full h-[70vh] rounded-lg" />
          )}

          {selectedConteudo && (
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant={completedMap.get(selectedConteudo.id) ? "secondary" : "default"}
                onClick={() => toggleConcluido.mutate(selectedConteudo.id)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {completedMap.get(selectedConteudo.id) ? "Desmarcar conclusão" : "Marcar como concluído"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
