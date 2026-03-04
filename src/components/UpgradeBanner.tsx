import { useAcesso } from "@/hooks/useAcesso";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

export default function UpgradeBanner() {
  const { isPremium, irParaPlanos } = useAcesso();

  if (isPremium) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-l-4 border-amber-400 px-4 py-3 flex items-center justify-between gap-3 rounded-r-lg">
      <div className="flex items-center gap-2 min-w-0">
        <Star className="h-4 w-4 text-amber-500 shrink-0" />
        <p className="text-sm text-foreground truncate">
          <span className="font-semibold">Plano gratuito.</span> Desbloqueie todo o conteúdo!
        </p>
      </div>
      <Button
        size="sm"
        className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
        onClick={irParaPlanos}
      >
        Ver Planos
      </Button>
    </div>
  );
}
