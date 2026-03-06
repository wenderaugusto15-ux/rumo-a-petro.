import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Play, FileText, FileDown, CheckCircle2, Save, ExternalLink, Clock, StickyNote,
} from "lucide-react";

interface EstudarConteudoModalProps {
  conteudoId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function EstudarConteudoModal({ conteudoId, open, onOpenChange }: EstudarConteudoModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const { data: conteudo } = useQuery({
    queryKey: ["conteudo-modal", conteudoId],
    queryFn: async () => {
      const { data } = await supabase
        .from("conteudos")
        .select("*")
        .eq("id", conteudoId!)
        .single();
      return data;
    },
    enabled: !!conteudoId && open,
  });

  const { data: progressRecord } = useQuery({
    queryKey: ["progresso-conteudo", user?.id, conteudoId],
    queryFn: async () => {
      const { data } = await supabase
        .from("progresso_estudo")
        .select("*")
        .eq("user_id", user!.id)
        .eq("conteudo_id", conteudoId!)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!conteudoId && open,
  });

  useEffect(() => {
    if (progressRecord?.anotacoes) {
      setNotes(progressRecord.anotacoes);
    } else {
      setNotes("");
    }
  }, [progressRecord]);

  const upsertProgress = async (updates: Record<string, any>) => {
    if (progressRecord) {
      await supabase
        .from("progresso_estudo")
        .update(updates)
        .eq("id", progressRecord.id);
    } else {
      await supabase.from("progresso_estudo").insert({
        user_id: user!.id,
        conteudo_id: conteudoId!,
        data_inicio: new Date().toISOString(),
        ...updates,
      });
    }
  };

  const toggleConcluido = useMutation({
    mutationFn: async () => {
      const newVal = !progressRecord?.concluido;
      await upsertProgress({
        concluido: newVal,
        data_conclusao: newVal ? new Date().toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progresso-conteudo"] });
      queryClient.invalidateQueries({ queryKey: ["progresso-materia"] });
      queryClient.invalidateQueries({ queryKey: ["progresso-estudo"] });
      toast({ title: "Progresso atualizado!" });
    },
  });

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await upsertProgress({ anotacoes: notes });
      queryClient.invalidateQueries({ queryKey: ["progresso-conteudo"] });
      toast({ title: "Anotações salvas!" });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
    setSavingNotes(false);
  };

  const isDone = !!progressRecord?.concluido;

  const hasContent = (c: any) => {
    if (c.tipo === "video" && c.video_url) return true;
    if (c.tipo === "texto" && c.conteudo_texto) return true;
    if (c.tipo === "pdf" && c.pdf_url) return true;
    return false;
  };

  const conteudoHasContent = conteudo ? hasContent(conteudo) : false;

  const tipoIcon = (tipo: string) => {
    if (tipo === "video") return <Play className="h-5 w-5 text-red-500" />;
    if (tipo === "pdf") return <FileDown className="h-5 w-5 text-accent" />;
    return <FileText className="h-5 w-5 text-primary" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            {conteudo && tipoIcon(conteudo.tipo)}
            {conteudo?.titulo}
            {conteudo?.duracao_minutos && (
              <span className="text-xs text-muted-foreground font-normal flex items-center gap-1 ml-auto">
                <Clock className="h-3 w-3" /> {conteudo.duracao_minutos} min
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Fallback: conteúdo sem material */}
          {conteudo && !hasContent(conteudo) && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground font-medium">Este conteúdo está sendo preparado. Volte em breve!</p>
            </div>
          )}

          {/* Video */}
          {conteudo?.tipo === "video" && conteudo.video_url && (() => {
            const ytId = extractYoutubeId(conteudo.video_url);
            const embedUrl = ytId
              ? `https://www.youtube.com/embed/${ytId}`
              : conteudo.video_url;
            return (
              <div className="space-y-3">
                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
                {conteudo.descricao && (
                  <p className="text-sm text-muted-foreground">{conteudo.descricao}</p>
                )}
              </div>
            );
          })()}

          {/* Texto */}
          {conteudo?.tipo === "texto" && conteudo.conteudo_texto && (
            <div className="space-y-3">
              <div
                className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 rounded-xl p-5 max-h-[50vh] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: conteudo.conteudo_texto }}
              />
              {conteudo.descricao && (
                <p className="text-sm text-muted-foreground">{conteudo.descricao}</p>
              )}
            </div>
          )}

          {/* PDF */}
          {conteudo?.tipo === "pdf" && (
            <div className="space-y-3">
              {conteudo.pdf_url ? (
                <>
                  <iframe src={conteudo.pdf_url} className="w-full h-[60vh] rounded-xl border" />
                  <Button variant="outline" asChild>
                    <a href={conteudo.pdf_url} target="_blank" rel="noopener noreferrer" className="gap-2">
                      <ExternalLink className="h-4 w-4" /> Abrir PDF em nova aba
                    </a>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">PDF não disponível</p>
              )}
              {conteudo.descricao && (
                <p className="text-sm text-muted-foreground">{conteudo.descricao}</p>
              )}
            </div>
          )}

          {conteudoHasContent && <Separator />}

          {/* Anotações - only show if content exists */}
          {conteudoHasContent && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <StickyNote className="h-4 w-4 text-accent" /> Suas anotações
            </h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escreva suas anotações sobre este conteúdo..."
              className="min-h-[100px] resize-y"
            />
            <Button size="sm" variant="outline" onClick={saveNotes} disabled={savingNotes} className="gap-2">
              <Save className="h-4 w-4" /> {savingNotes ? "Salvando..." : "Salvar anotações"}
            </Button>
          </div>
          )}

          {conteudoHasContent && <Separator />}

          {/* Conclusão - only show if content exists */}
          {conteudoHasContent && (
          <div
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors cursor-pointer ${
              isDone ? "border-green-500/50 bg-green-500/5" : "border-border"
            }`}
            onClick={() => toggleConcluido.mutate()}
          >
            <Checkbox
              checked={isDone}
              className={`h-6 w-6 ${isDone ? "border-green-500 data-[state=checked]:bg-green-500" : ""}`}
            />
            <div className="flex-1">
              <p className={`font-semibold text-sm ${isDone ? "text-green-600" : "text-foreground"}`}>
                {isDone ? "Concluído!" : "Marcar como concluído"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isDone ? "Clique para desmarcar" : "Marque quando terminar este conteúdo"}
              </p>
            </div>
            {isDone && <CheckCircle2 className="h-6 w-6 text-green-500" />}
          </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
