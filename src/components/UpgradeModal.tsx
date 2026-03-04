import { Lock, ChevronRight, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { openCheckout } from "@/lib/checkoutLinks";
import { useAuth } from "@/hooks/useAuth";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="items-center">
          <div className="h-16 w-16 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-2">
            <Crown className="h-8 w-8 text-accent" />
          </div>
          <DialogTitle className="text-xl">Conteúdo Exclusivo PRO</DialogTitle>
          <DialogDescription>
            Esta aula está disponível apenas para assinantes. Desbloqueie todo o conteúdo e acelere sua preparação.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Button
            className="w-full bg-gradient-cta text-accent-foreground shadow-cta hover:opacity-90"
            onClick={() => {
              onOpenChange(false);
              openCheckout("semestral", user?.id);
            }}
          >
            Desbloquear Agora - A partir de R$ 47/mês
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <button
            onClick={() => {
              onOpenChange(false);
              navigate("/app/upgrade");
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Ver todos os planos
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
