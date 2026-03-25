import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useAssinatura() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["assinatura", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const now = new Date();
  const trialEndsAt = data?.trial_ends_at ? new Date(data.trial_ends_at) : null;
  const isTrialActive = trialEndsAt ? now < trialEndsAt : false;
  const isPro = !!data && data.plan === "pro";
  const isTrialExpired = !!data && !isPro && trialEndsAt ? now >= trialEndsAt : false;

  // User has access if PRO or trial is still active
  const temAcesso = isPro || isTrialActive;

  // Calculate remaining trial days
  const trialDaysLeft = trialEndsAt && isTrialActive
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    assinatura: data,
    isAssinante: isPro,
    temAcesso,
    isTrialActive,
    isTrialExpired,
    trialDaysLeft,
    trialEndsAt,
    isLoading,
  };
}
