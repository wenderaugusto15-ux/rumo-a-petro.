import { AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AreaWarningBanner() {
  return (
    <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-6 flex items-center gap-3 flex-wrap">
      <AlertTriangle className="h-5 w-5 text-accent shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">
          ⚠️ Selecione sua Área Específica para personalizar seu conteúdo
        </p>
        <p className="text-xs text-muted-foreground">
          Questões, simulados e estudos serão filtrados pela sua área.
        </p>
      </div>
      <Link to="/app/plano">
        <Button size="sm" className="bg-gradient-cta text-accent-foreground shadow-cta hover:opacity-90">
          Selecionar Área <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
