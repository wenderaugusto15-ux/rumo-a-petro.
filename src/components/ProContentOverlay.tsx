import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAssinatura } from "@/hooks/useAssinatura";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ReactNode } from "react";

interface ProContentOverlayProps {
  children: ReactNode;
  featureName: string;
}

export default function ProContentOverlay({ children, featureName }: ProContentOverlayProps) {
  const { isAssinante, isLoading } = useAssinatura();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: isAdmin } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      return !!data;
    },
    enabled: !!user,
  });

  if (isLoading) return <>{children}</>;
  if (isAssinante || isAdmin) return <>{children}</>;

  return (
    <div className="relative">
      {/* Show content with blur/opacity to generate interest */}
      <div className="pointer-events-none select-none opacity-60 blur-[2px]">
        {children}
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-8 max-w-sm mx-4 text-center shadow-lg">
          <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-accent" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Conteúdo PRO</h3>
          <p className="text-muted-foreground text-sm mb-6">
            <strong>{featureName}</strong> está disponível para assinantes PRO. 
            Desbloqueie acesso completo a todo o conteúdo!
          </p>
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={() => navigate("/app/upgrade")}
          >
            <Crown className="h-5 w-5" />
            Assinar agora
          </Button>
        </div>
      </div>
    </div>
  );
}
