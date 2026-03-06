import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export function useAcesso() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-plano", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("plano, plano_ativo_ate")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Also check subscriptions table as fallback
  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Check if user is admin (full access)
  const { data: isAdmin } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", {
        _user_id: user!.id,
        _role: "admin",
      });
      return !!data;
    },
    enabled: !!user,
  });

  const plano = profile?.plano || "free";
  const planoAtivoAte = profile?.plano_ativo_ate ? new Date(profile.plano_ativo_ate) : null;
  const now = new Date();

  // Premium if: admin OR profile says premium AND not expired, OR subscription says pro
  const isPremium =
    !!isAdmin ||
    (plano === "premium" && planoAtivoAte && planoAtivoAte > now) ||
    subscription?.plan === "pro";

  const diasRestantes =
    isPremium && planoAtivoAte
      ? Math.max(0, Math.ceil((planoAtivoAte.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

  const podeAcessarAula = (ordemAula: number) => isPremium || ordemAula <= 3;

  const irParaPlanos = () => navigate("/app/upgrade");

  // Auto-expiration check
  const expireMutation = useMutation({
    mutationFn: async () => {
      await supabase
        .from("profiles")
        .update({ plano: "free", plano_ativo_ate: null })
        .eq("user_id", user!.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-plano"] });
      toast({
        title: "Plano expirado",
        description: "Seu plano premium expirou. Renove para continuar acessando!",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (
      profile &&
      profile.plano === "premium" &&
      planoAtivoAte &&
      planoAtivoAte < now &&
      !subscription?.plan
    ) {
      expireMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.plano, profile?.plano_ativo_ate]);

  return {
    isPremium: !!isPremium,
    plano: isPremium ? "premium" as const : "free" as const,
    diasRestantes,
    podeAcessarAula,
    irParaPlanos,
    isLoading,
  };
}
