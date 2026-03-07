import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAcesso } from "@/hooks/useAcesso";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function ProRoute({ children }: { children: ReactNode }) {
  const { isPremium, isLoading } = useAcesso();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isPremium) {
      toast({
        title: "Acesso Restrito",
        description: "Essa funcionalidade é exclusiva para assinantes PRO.",
        variant: "destructive",
      });
      navigate("/app/upgrade", { replace: true });
    }
  }, [isLoading, isPremium, navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isPremium) return null;

  return <>{children}</>;
}
