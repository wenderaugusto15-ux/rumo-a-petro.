import { ReactNode } from "react";
import { Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

interface ContentLockProps {
  ordem: number;
  tipo?: "aula" | "simulado" | "analise";
  children: ReactNode;
}

export default function ContentLock({ ordem, tipo = "aula", children }: ContentLockProps) {
  const { isPro, canAccessContent } = useSubscription();
  const navigate = useNavigate();

  if (isPro || canAccessContent(ordem)) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="opacity-30 pointer-events-none select-none blur-[2px]">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-foreground/60 backdrop-blur-sm rounded-xl z-10">
        <div className="text-center space-y-3 p-6 max-w-sm">
          <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8 text-accent" />
          </div>
          <h3 className="text-lg font-bold text-white">🔒 Conteúdo Premium</h3>
          <p className="text-sm text-white/80">
            Assine para desbloquear todas as aulas e acelere sua aprovação.
          </p>
          <Button
            className="bg-gradient-cta text-accent-foreground shadow-cta hover:opacity-90 w-full"
            onClick={() => navigate("/app/upgrade")}
          >
            Desbloquear Agora
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <button
            onClick={() => navigate("/app/upgrade")}
            className="text-xs text-white/60 hover:text-white/90 underline underline-offset-2"
          >
            Ver todos os planos
          </button>
        </div>
      </div>
    </div>
  );
}
