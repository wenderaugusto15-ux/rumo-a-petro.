import { Lock, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function TrialExpiredOverlay() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full p-8 text-center space-y-5">
        <div className="mx-auto h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-accent" />
        </div>
        <h2 className="text-2xl font-extrabold text-foreground">
          Seu período de teste acabou!
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Você aproveitou 2 dias gratuitos com acesso completo. Para continuar usando todas as funcionalidades, assine o plano PRO.
        </p>
        <Button
          onClick={() => navigate("/app/upgrade")}
          className="w-full bg-gradient-cta text-accent-foreground shadow-cta hover:opacity-90 text-base py-6"
        >
          <Rocket className="mr-2 h-5 w-5" />
          Assinar Plano PRO
        </Button>
      </div>
    </div>
  );
}
