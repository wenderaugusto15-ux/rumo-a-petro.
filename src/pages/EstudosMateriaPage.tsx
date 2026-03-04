import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft, ChevronDown, Video, FileText, BookOpen,
  CheckCircle2, Circle, Play, Clock
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
  const [openModulos, setOpenModulos] = useState<Set<string>>(new Set());

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

  const completedMap = new Map((progresso || []).map(p => [p.conteudo_id, p.concluido]));

  const toggleConcluido = useMutation({
    mutationFn: async (conteudoId: string) => {
      const existing = (progresso || []).find(p => p.conteudo_id === conteudoId);
      if (existing) {
        await supabase
          .from("progresso_estudo")
          .update({ concluido: !existing.concluido, data_conclusao: !existing.concluido ? new Date().toISOString() : null })
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

  const toggleModulo = (id: string) => {
    setOpenModulos(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const tipoIcon = (tipo: string) => {
    if (tipo === "video") return <Video className="h-4 w-4 text-red-500" />;
    if (tipo === "pdf") return <FileText className="h-4 w-4 text-orange-500" />;
    return <BookOpen className="h-4 w-4 text-primary" />;
  };

  const cor = materia?.cor || "#1e3a5f";

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/estudos")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {loadingMateria ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            <div>
              <h1 className="text-xl font-bold text-foreground">{materia?.nome}</h1>
              {materia?.descricao && <p className="text-sm text-muted-foreground">{materia.descricao}</p>}
            </div>
          )}
        </div>

        {/* Módulos */}
        {loadingModulos ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {(modulos || []).map((modulo) => {
              const moduloConteudos = (conteudos || []).filter(c => c.modulo_id === modulo.id);
              const done = moduloConteudos.filter(c => completedMap.get(c.id)).length;
              const total = moduloConteudos.length;
              const percent = total > 0 ? Math.round((done / total) * 100) : 0;
              const isOpen = openModulos.has(modulo.id);

              return (
                <Collapsible key={modulo.id} open={isOpen} onOpenChange={() => toggleModulo(modulo.id)}>
                  <Card className="border" style={{ borderColor: isOpen ? cor : undefined }}>
                    <CollapsibleTrigger className="w-full">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${cor}15` }}
                        >
                          <BookOpen className="h-4 w-4" style={{ color: cor }} />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{modulo.titulo}</p>
                          <p className="text-xs text-muted-foreground">{done}/{total} concluídos • {percent}%</p>
                        </div>
                        <Progress value={percent} className="h-2 w-20 hidden sm:block" />
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </CardContent>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-1">
                        {moduloConteudos.map((conteudo) => {
                          const isDone = !!completedMap.get(conteudo.id);
                          return (
                            <div
                              key={conteudo.id}
                              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                              onClick={() => setSelectedConteudo(conteudo)}
                            >
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleConcluido.mutate(conteudo.id); }}
                                className="shrink-0"
                              >
                                {isDone
                                  ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  : <Circle className="h-5 w-5 text-muted-foreground/50" />
                                }
                              </button>
                              {tipoIcon(conteudo.tipo)}
                              <span className={`text-sm flex-1 truncate ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                {conteudo.titulo}
                              </span>
                              {conteudo.duracao_minutos && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {conteudo.duracao_minutos}min
                                </span>
                              )}
                              <Play className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          );
                        })}
                        {moduloConteudos.length === 0 && (
                          <p className="text-xs text-muted-foreground py-2 text-center">Nenhum conteúdo disponível</p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
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
            <div className="flex justify-end pt-2">
              <Button
                variant={completedMap.get(selectedConteudo.id) ? "secondary" : "default"}
                onClick={() => toggleConcluido.mutate(selectedConteudo.id)}
              >
                {completedMap.get(selectedConteudo.id) ? "Desmarcar conclusão" : "Marcar como concluído"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
