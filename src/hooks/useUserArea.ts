import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserAreaData {
  trackId: string | null;
  trackName: string | null;
  /** Subject IDs the user should see: general + track-specific */
  subjectIds: string[];
  /** Whether the user has selected an area */
  hasArea: boolean;
  /** Loading state */
  isLoading: boolean;
}

async function fetchUserArea(userId: string): Promise<Omit<UserAreaData, "isLoading">> {
  // 1. Get user's track_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("track_id")
    .eq("user_id", userId)
    .single();

  const trackId = profile?.track_id ?? null;

  // 2. Get track name if exists
  let trackName: string | null = null;
  if (trackId) {
    const { data: track } = await supabase
      .from("tracks")
      .select("name")
      .eq("id", trackId)
      .single();
    trackName = track?.name ?? null;
  }

  // 3. Get general subject IDs (always included)
  const { data: generalSubjects } = await supabase
    .from("subjects")
    .select("id")
    .eq("is_general", true)
    .eq("active", true);

  const generalIds = (generalSubjects || []).map((s) => s.id);

  // 4. Get track-specific subject IDs
  let specificIds: string[] = [];
  if (trackId) {
    const { data: trackSubjects } = await supabase
      .from("track_subjects")
      .select("subject_id")
      .eq("track_id", trackId);
    specificIds = (trackSubjects || []).map((ts) => ts.subject_id);
  }

  // 5. Combine unique IDs — if no track, only general subjects
  const subjectIds = [...new Set([...generalIds, ...specificIds])];

  return {
    trackId,
    trackName,
    subjectIds,
    hasArea: !!trackId,
  };
}

export function useUserArea(): UserAreaData {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["user-area", user?.id],
    queryFn: () => fetchUserArea(user!.id),
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  return {
    trackId: data?.trackId ?? null,
    trackName: data?.trackName ?? null,
    subjectIds: data?.subjectIds ?? [],
    hasArea: data?.hasArea ?? false,
    isLoading,
  };
}

/** Call after changing the user's track to refresh all area-dependent queries */
export function useInvalidateUserArea() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["user-area"] });
    // Also invalidate dependent queries
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["performance"] });
  };
}
