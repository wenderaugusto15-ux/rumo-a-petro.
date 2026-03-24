import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { MateriaComProgresso, ModuloComConteudos } from "@/types/estudos";

export function useMateriasComProgresso() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["estudos-materias", user?.id],
    queryFn: async (): Promise<MateriaComProgresso[]> => {
      const { data: materias, error: matError } = await supabase
        .from("materias")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true });

      if (matError) throw matError;
      if (!materias?.length) return [];

      // Get all conteudos count per materia via modulos
      const materiaIds = materias.map((m) => m.id);
      const { data: modulos } = await supabase
        .from("modulos")
        .select("id, materia_id")
        .in("materia_id", materiaIds)
        .eq("ativo", true);

      const moduloIds = modulos?.map((m) => m.id) ?? [];

      const { data: conteudos } = await supabase
        .from("conteudos")
        .select("id, modulo_id")
        .in("modulo_id", moduloIds.length ? moduloIds : ["__none__"])
        .eq("ativo", true);

      // Get user progress
      let progressoMap: Record<string, boolean> = {};
      if (user && conteudos?.length) {
        const conteudoIds = conteudos.map((c) => c.id);
        const { data: progresso } = await supabase
          .from("progresso_estudo")
          .select("conteudo_id, concluido")
          .eq("user_id", user.id)
          .in("conteudo_id", conteudoIds);

        progresso?.forEach((p) => {
          if (p.conteudo_id && p.concluido) {
            progressoMap[p.conteudo_id] = true;
          }
        });
      }

      // Build materia -> modulo -> conteudo mapping
      const moduloToMateria: Record<string, string> = {};
      modulos?.forEach((m) => {
        if (m.materia_id) moduloToMateria[m.id] = m.materia_id;
      });

      const materiaConteudos: Record<string, string[]> = {};
      conteudos?.forEach((c) => {
        if (c.modulo_id) {
          const materiaId = moduloToMateria[c.modulo_id];
          if (materiaId) {
            if (!materiaConteudos[materiaId]) materiaConteudos[materiaId] = [];
            materiaConteudos[materiaId].push(c.id);
          }
        }
      });

      return materias.map((m) => {
        const ids = materiaConteudos[m.id] ?? [];
        const concluidos = ids.filter((id) => progressoMap[id]).length;
        return {
          ...m,
          totalConteudos: ids.length,
          conteudosConcluidos: concluidos,
          percentualProgresso: ids.length ? Math.round((concluidos / ids.length) * 100) : 0,
        };
      });
    },
    enabled: !!user,
  });
}

export function useModulosComConteudos(materiaId: string | undefined) {
  return useQuery({
    queryKey: ["estudos-modulos", materiaId],
    queryFn: async (): Promise<ModuloComConteudos[]> => {
      const { data: modulos, error } = await supabase
        .from("modulos")
        .select("*")
        .eq("materia_id", materiaId!)
        .eq("ativo", true)
        .order("ordem", { ascending: true });

      if (error) throw error;
      if (!modulos?.length) return [];

      const moduloIds = modulos.map((m) => m.id);
      const { data: conteudos } = await supabase
        .from("conteudos")
        .select("*")
        .in("modulo_id", moduloIds)
        .eq("ativo", true)
        .order("ordem", { ascending: true });

      return modulos.map((m) => ({
        ...m,
        conteudos: conteudos?.filter((c) => c.modulo_id === m.id) ?? [],
      }));
    },
    enabled: !!materiaId,
  });
}

export function useProgressoConteudo(materiaId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["estudos-progresso", user?.id, materiaId],
    queryFn: async () => {
      const { data: modulos } = await supabase
        .from("modulos")
        .select("id")
        .eq("materia_id", materiaId!)
        .eq("ativo", true);

      const moduloIds = modulos?.map((m) => m.id) ?? [];
      if (!moduloIds.length) return {};

      const { data: conteudos } = await supabase
        .from("conteudos")
        .select("id")
        .in("modulo_id", moduloIds)
        .eq("ativo", true);

      const conteudoIds = conteudos?.map((c) => c.id) ?? [];
      if (!conteudoIds.length) return {};

      const { data: progresso } = await supabase
        .from("progresso_estudo")
        .select("conteudo_id, concluido")
        .eq("user_id", user!.id)
        .in("conteudo_id", conteudoIds);

      const map: Record<string, boolean> = {};
      progresso?.forEach((p) => {
        if (p.conteudo_id) map[p.conteudo_id] = !!p.concluido;
      });
      return map;
    },
    enabled: !!user && !!materiaId,
  });
}

export function useToggleProgresso() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conteudoId, concluido }: { conteudoId: string; concluido: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      // Check if record exists
      const { data: existing } = await supabase
        .from("progresso_estudo")
        .select("id")
        .eq("user_id", user.id)
        .eq("conteudo_id", conteudoId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("progresso_estudo")
          .update({
            concluido,
            data_conclusao: concluido ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("progresso_estudo")
          .insert({
            user_id: user.id,
            conteudo_id: conteudoId,
            concluido,
            data_inicio: new Date().toISOString(),
            data_conclusao: concluido ? new Date().toISOString() : null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estudos-progresso"] });
      queryClient.invalidateQueries({ queryKey: ["estudos-materias"] });
    },
  });
}
