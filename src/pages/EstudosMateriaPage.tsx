import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, ChevronDown, ChevronRight, CheckCircle2, Circle,
  Play, FileText, File, Loader2, BookOpen
} from "lucide-react";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import AppLayout from "@/components/AppLayout";
import { useModulosComConteudos, useProgressoConteudo, useToggleProgresso } from "@/hooks/useEstudos";
import type { Conteudo } from "@/types/estudos";

function ConteudoIcon({ tipo }: { tipo: string }) {
  switch (tipo) {
    case "video": return <Play className="h-4 w-4 text-accent" />;
    case "pdf": return <File className="h-4 w-4 text-destructive" />;
    default: return <FileText className="h-4 w-4 text-primary" />;
  }
}

function ConteudoViewer({ conteudo }: { conteudo: Conteudo }) {
  if (conteudo.tipo === "video" && conteudo.video_url) {
    const embedUrl = conteudo.video_url.includes("youtube.com/watch")
      ? conteudo.video_url.replace("watch?v=", "embed/")
      : conteudo.video_url.includes("youtu.be/")
        ? `https://www.youtube.com/embed/${conteudo.video_url.split("youtu.be/")[1]}`
        : conteudo.video_url;

    return (
      <div className="mt-4 aspect-video rounded-lg overflow-hidden bg-muted">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    );
  }

  if (conteudo.tipo === "texto" && conteudo.conteudo_texto) {
    return (
      <div className="mt-4 p-4 bg-muted/50 rounded-lg prose prose-sm max-w-none text-foreground">
        <div dangerouslySetInnerHTML={{ __html: conteudo.conteudo_texto }} />
      </div>
    );
  }

  if (conteudo.tipo === "pdf" && conteudo.pdf_url) {
    return (
      <div className="mt-4">
        <a
          href={conteudo.pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-sm font-medium transition-colors"
        >
          <File className="h-4 w-4" />
          Abrir PDF
        </a>
      </div>
    );
  }

  return null;
}

export default function EstudosMateriaPage() {
  const { materiaId } = useParams<{ materiaId: string }>();
  const { data: modulos, isLoading } = useModulosComConteudos(materiaId);
  const { data: progresso = {} } = useProgressoConteudo(materiaId);
  const toggleProgresso = useToggleProgresso();
  const [activeConteudo, setActiveConteudo] = useState<string | null>(null);
  const [openModulos, setOpenModulos] = useState<Record<string, boolean>>({});

  const toggleModulo = (id: string) => {
    setOpenModulos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleConcluido = (conteudoId: string) => {
    const current = !!progresso[conteudoId];
    toggleProgresso.mutate({ conteudoId, concluido: !current });
  };

  const activeContent = modulos
    ?.flatMap((m) => m.conteudos)
    .find((c) => c.id === activeConteudo);

  return (
    <AppLayout>
      <div className="p-6 sm:p-8 max-w-4xl mx-auto">
        <Link
          to="/app/estudos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para matérias
        </Link>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !modulos?.length ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="font-medium">Nenhum módulo disponível ainda.</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar - module list */}
            <div className="lg:w-80 shrink-0 space-y-2">
              <h2 className="text-lg font-bold text-foreground mb-4">Módulos</h2>
              {modulos.map((modulo) => {
                const isOpen = openModulos[modulo.id] ?? false;
                const total = modulo.conteudos.length;
                const done = modulo.conteudos.filter((c) => progresso[c.id]).length;

                return (
                  <Collapsible
                    key={modulo.id}
                    open={isOpen}
                    onOpenChange={() => toggleModulo(modulo.id)}
                  >
                    <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors text-left">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {modulo.titulo}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {done}/{total} concluídos
                        </p>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1 space-y-0.5 pl-2">
                      {modulo.conteudos.map((conteudo) => {
                        const isDone = !!progresso[conteudo.id];
                        const isActive = activeConteudo === conteudo.id;
                        return (
                          <div
                            key={conteudo.id}
                            className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors text-sm ${
                              isActive
                                ? "bg-accent/10 text-accent font-medium"
                                : "hover:bg-muted/50 text-foreground"
                            }`}
                            onClick={() => setActiveConteudo(conteudo.id)}
                          >
                            <Checkbox
                              checked={isDone}
                              onCheckedChange={(e) => {
                                e; // prevent propagation
                                handleToggleConcluido(conteudo.id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0"
                            />
                            <ConteudoIcon tipo={conteudo.tipo} />
                            <span className="truncate flex-1">{conteudo.titulo}</span>
                            {isDone && (
                              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>

            {/* Content viewer */}
            <div className="flex-1 min-w-0">
              {activeContent ? (
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <ConteudoIcon tipo={activeContent.tipo} />
                    <span className="text-xs text-muted-foreground uppercase font-medium">
                      {activeContent.tipo}
                    </span>
                    {activeContent.duracao_minutos && (
                      <span className="text-xs text-muted-foreground">
                        · {activeContent.duracao_minutos} min
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    {activeContent.titulo}
                  </h3>
                  {activeContent.descricao && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {activeContent.descricao}
                    </p>
                  )}
                  <ConteudoViewer conteudo={activeContent} />
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">Selecione um conteúdo</p>
                  <p className="text-sm mt-1">Escolha um item no menu ao lado para começar.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
