import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserArea } from "@/hooks/useUserArea";
import AreaWarningBanner from "@/components/AreaWarningBanner";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen, Calculator, Atom, FlaskConical, Cog, Monitor,
  GraduationCap, Scale, Briefcase, Globe, Shield, Cpu,
  Wrench, Zap, BarChart3, FileText, LucideIcon
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  BookOpen, Calculator, Atom, FlaskConical, Cog, Monitor,
  GraduationCap, Scale, Briefcase, Globe, Shield, Cpu,
  Wrench, Zap, BarChart3, FileText,
};

function getIcon(name: string | null): LucideIcon {
  if (name && iconMap[name]) return iconMap[name];
  return BookOpen;
}

export default function EstudosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subjectIds, hasArea } = useUserArea();

  // Note: EstudosPage uses "materias" table (separate from "subjects").
  // We show all materias for now since they don't have a direct link to tracks/subjects.
  // TODO: If materias need to be filtered by area, a mapping table would be needed.

  const { data: materias, isLoading: loadingMaterias } = useQuery({
    queryKey: ["materias-estudo"],
    queryFn: async () => {
      const { data } = await supabase
        .from("materias")
        .select("*")
        .eq("ativo", true)
        .order("ordem");
      return data || [];
    },
  });

  const { data: modulos } = useQuery({
    queryKey: ["modulos-estudo"],
    queryFn: async () => {
      const { data } = await supabase
        .from("modulos")
        .select("id, materia_id")
        .eq("ativo", true);
      return data || [];
    },
  });

  const { data: conteudos } = useQuery({
    queryKey: ["conteudos-estudo"],
    queryFn: async () => {
      const { data } = await supabase
        .from("conteudos")
        .select("id, modulo_id")
        .eq("ativo", true);
      return data || [];
    },
  });

  const { data: progresso } = useQuery({
    queryKey: ["progresso-estudo", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("progresso_estudo")
        .select("conteudo_id, concluido")
        .eq("user_id", user!.id)
        .eq("concluido", true);
      return data || [];
    },
    enabled: !!user,
  });

  // Build lookup: materia_id -> conteudo_ids
  const materiaConteudos = new Map<string, string[]>();
  if (modulos && conteudos) {
    const moduloToMateria = new Map(modulos.map(m => [m.id, m.materia_id]));
    for (const c of conteudos) {
      const materiaId = c.modulo_id ? moduloToMateria.get(c.modulo_id) : null;
      if (materiaId) {
        const arr = materiaConteudos.get(materiaId) || [];
        arr.push(c.id);
        materiaConteudos.set(materiaId, arr);
      }
    }
  }

  const completedIds = new Set((progresso || []).map(p => p.conteudo_id));

  const totalConteudos = conteudos?.length || 0;
  const totalConcluidos = (conteudos || []).filter(c => completedIds.has(c.id)).length;
  const overallPercent = totalConteudos > 0 ? Math.round((totalConcluidos / totalConteudos) * 100) : 0;

  const moduloCountByMateria = new Map<string, number>();
  if (modulos) {
    for (const m of modulos) {
      if (m.materia_id) {
        moduloCountByMateria.set(m.materia_id, (moduloCountByMateria.get(m.materia_id) || 0) + 1);
      }
    }
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Área de Estudos</h1>
              <p className="text-sm text-muted-foreground">Seu caminho para a aprovação na Petrobras</p>
            </div>
          </div>

          {!hasArea && <AreaWarningBanner />}

          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso geral</span>
              <span className="font-semibold text-foreground">{totalConcluidos} de {totalConteudos} concluídos</span>
            </div>
            <Progress value={overallPercent} className="h-3" />
            <p className="text-xs text-muted-foreground text-right">{overallPercent}%</p>
          </div>
        </div>

        {/* Grid */}
        {loadingMaterias ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(materias || []).map((materia) => {
              const Icon = getIcon(materia.icone);
              const conteudoIds = materiaConteudos.get(materia.id) || [];
              const done = conteudoIds.filter(id => completedIds.has(id)).length;
              const total = conteudoIds.length;
              const percent = total > 0 ? Math.round((done / total) * 100) : 0;
              const numModulos = moduloCountByMateria.get(materia.id) || 0;
              const cor = materia.cor || "#1e3a5f";

              return (
                <Card
                  key={materia.id}
                  className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-l-4 group"
                  style={{ borderLeftColor: cor }}
                  onClick={() => navigate(`/app/estudos/${materia.id}`)}
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cor}15` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: cor }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{materia.nome}</h3>
                        {materia.descricao && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{materia.descricao}</p>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {numModulos} módulo{numModulos !== 1 ? "s" : ""} • {total} conteúdo{total !== 1 ? "s" : ""}
                    </p>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium" style={{ color: cor }}>{percent}%</span>
                      </div>
                      <Progress value={percent} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
