import { Link } from "react-router-dom";
import { BookOpen, ChevronRight, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import AppLayout from "@/components/AppLayout";
import { useMateriasComProgresso } from "@/hooks/useEstudos";
import ProContentOverlay from "@/components/ProContentOverlay";

const iconMap: Record<string, string> = {
  calculator: "🧮",
  code: "💻",
  globe: "🌍",
  flask: "🧪",
  book: "📖",
  pen: "✍️",
  brain: "🧠",
  chart: "📊",
  scale: "⚖️",
  atom: "⚛️",
};

export default function EstudosPage() {
  const { data: materias, isLoading } = useMateriasComProgresso();

  return (
    <AppLayout>
      <div className="p-6 sm:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-foreground">Estudos</h1>
          <p className="text-muted-foreground mt-1">
            Navegue pelas matérias e acompanhe seu progresso.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !materias?.length ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="font-medium">Nenhuma matéria disponível ainda.</p>
            <p className="text-sm mt-1">As matérias serão adicionadas em breve.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {materias.map((materia) => {
              const emoji = materia.icone ? iconMap[materia.icone] || "📚" : "📚";
              return (
                <Link
                  key={materia.id}
                  to={`/app/estudos/${materia.id}`}
                  className="group bg-card border border-border rounded-xl p-5 hover:shadow-[var(--shadow-card-hover)] transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center text-lg"
                        style={{
                          backgroundColor: materia.cor
                            ? `${materia.cor}20`
                            : "hsl(var(--muted))",
                        }}
                      >
                        {emoji}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground group-hover:text-accent transition-colors">
                          {materia.nome}
                        </h3>
                        {materia.descricao && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {materia.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors shrink-0 mt-0.5" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {materia.conteudosConcluidos}/{materia.totalConteudos} conteúdos
                      </span>
                      <span className="font-semibold text-foreground">
                        {materia.percentualProgresso}%
                      </span>
                    </div>
                    <Progress
                      value={materia.percentualProgresso}
                      className="h-2"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
