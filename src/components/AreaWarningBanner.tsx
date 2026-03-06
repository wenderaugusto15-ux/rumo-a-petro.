import { BookOpen, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AreaWarningBanner() {
  return (
    <Alert className="bg-[hsl(38_92%_50%/0.12)] border-[hsl(38_92%_50%/0.35)] mb-6">
      <BookOpen className="h-5 w-5 text-[hsl(38_92%_50%)]" />
      <AlertDescription className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            📚 Você está vendo apenas as Matérias Gerais. Selecione sua Área Específica para desbloquear conteúdos especializados!
          </p>
        </div>
        <Link to="/app/plano">
          <Button size="sm" variant="default" className="whitespace-nowrap">
            Escolher Área <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
}
