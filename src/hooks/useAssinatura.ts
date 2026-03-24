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

  return {
    assinatura: data,
    isAssinante: !!data && data.plan === "pro",
    isLoading,
  };
}
