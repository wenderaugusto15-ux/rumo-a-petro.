import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LockedFeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
}

export default function LockedFeatureDialog({ open, onOpenChange, featureName }: LockedFeatureDialogProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="items-center">
          <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2">
            <Lock className="h-8 w-8 text-accent" />
          </div>
          <DialogTitle className="text-xl">Recurso bloqueado</DialogTitle>
          <DialogDescription className="text-base">
            <strong>{featureName}</strong> está disponível apenas para assinantes PRO.
            Assine agora e desbloqueie todos os recursos!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={() => {
              onOpenChange(false);
              navigate("/app/upgrade");
            }}
          >
            <Crown className="h-5 w-5" />
            Assinar para continuar
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Voltar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
