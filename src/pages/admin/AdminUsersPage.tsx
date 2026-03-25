import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, MoreHorizontal, Crown, XCircle, CalendarPlus, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDebounce } from "@/hooks/useDebounce";

type UserRow = {
  user_id: string;
  name: string | null;
  plan: "free" | "pro";
  status: "active" | "canceled" | "expired";
  started_at: string | null;
  ends_at: string | null;
  email: string | null;
};

type ActionType = "pro_monthly" | "pro_semestral" | "cancel" | "extend";

const ACTION_LABELS: Record<ActionType, string> = {
  pro_monthly: "Ativar PRO Mensal",
  pro_semestral: "Ativar PRO Semestral",
  cancel: "Cancelar Plano",
  extend: "Estender +1 mês",
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [confirmDialog, setConfirmDialog] = useState<{ user: UserRow; action: ActionType } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Get profiles
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, name, created_at")
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;

      // Get subscriptions
      const { data: subs, error: sErr } = await supabase
        .from("subscriptions")
        .select("user_id, plan, status, started_at, ends_at");
      if (sErr) throw sErr;

      const subMap = new Map(subs?.map((s) => [s.user_id, s]) ?? []);

      // Get emails via auth (we'll use profiles + subscriptions only since we can't call admin API from client)
      // Email will be fetched from auth user metadata if available
      return (profiles ?? []).map((p) => {
        const sub = subMap.get(p.user_id);
        return {
          user_id: p.user_id,
          name: p.name,
          plan: sub?.plan ?? "free",
          status: sub?.status ?? "active",
          started_at: sub?.started_at ?? null,
          ends_at: sub?.ends_at ?? null,
          email: null, // email not available from profiles table
        } as UserRow;
      });
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ user, action }: { user: UserRow; action: ActionType }) => {
      const now = new Date();

      if (action === "cancel") {
        const { error } = await supabase
          .from("subscriptions")
          .update({ plan: "free", status: "canceled", ends_at: now.toISOString() })
          .eq("user_id", user.user_id);
        if (error) throw error;
        return;
      }

      if (action === "extend") {
        const currentEnd = user.ends_at ? new Date(user.ends_at) : now;
        const base = currentEnd > now ? currentEnd : now;
        base.setMonth(base.getMonth() + 1);
        const { error } = await supabase
          .from("subscriptions")
          .update({ ends_at: base.toISOString(), plan: "pro", status: "active" })
          .eq("user_id", user.user_id);
        if (error) throw error;
        return;
      }

      // pro_monthly or pro_semestral
      const months = action === "pro_semestral" ? 6 : 1;
      const endsAt = new Date(now);
      endsAt.setMonth(endsAt.getMonth() + months);

      const { error } = await supabase
        .from("subscriptions")
        .update({
          plan: "pro",
          status: "active",
          started_at: now.toISOString(),
          ends_at: endsAt.toISOString(),
        })
        .eq("user_id", user.user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Plano atualizado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setConfirmDialog(null);
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const filtered = (users ?? []).filter((u) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (u.name?.toLowerCase().includes(q) || u.user_id.toLowerCase().includes(q));
  });

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Gestão de Usuários
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie planos e acessos dos usuários</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: users?.length ?? 0 },
            { label: "PRO", value: users?.filter((u) => u.plan === "pro" && u.status === "active").length ?? 0 },
            { label: "Free", value: users?.filter((u) => u.plan === "free").length ?? 0 },
            { label: "Cancelados", value: users?.filter((u) => u.status === "canceled").length ?? 0 },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                              {(u.name ?? "?").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm text-foreground">{u.name ?? "Sem nome"}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{u.user_id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.plan === "pro" ? "default" : "secondary"}
                          className={u.plan === "pro" ? "bg-green-600 hover:bg-green-700 text-white" : ""}>
                          {u.plan === "pro" ? "PRO" : "Free"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          u.status === "active" ? "border-green-500 text-green-600" :
                          u.status === "canceled" ? "border-destructive text-destructive" :
                          "border-yellow-500 text-yellow-600"
                        }>
                          {u.status === "active" ? "Ativo" : u.status === "canceled" ? "Cancelado" : "Expirado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.ends_at ? format(new Date(u.ends_at), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setConfirmDialog({ user: u, action: "pro_monthly" })}>
                              <Crown className="h-4 w-4 mr-2 text-yellow-500" /> Ativar PRO Mensal
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setConfirmDialog({ user: u, action: "pro_semestral" })}>
                              <Crown className="h-4 w-4 mr-2 text-green-500" /> Ativar PRO Semestral
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setConfirmDialog({ user: u, action: "extend" })}>
                              <CalendarPlus className="h-4 w-4 mr-2 text-blue-500" /> Estender +1 mês
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setConfirmDialog({ user: u, action: "cancel" })}
                              className="text-destructive focus:text-destructive">
                              <XCircle className="h-4 w-4 mr-2" /> Cancelar Plano
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar ação</DialogTitle>
            <DialogDescription>
              Deseja <strong>{confirmDialog ? ACTION_LABELS[confirmDialog.action] : ""}</strong> para o usuário{" "}
              <strong>{confirmDialog?.user.name ?? "Sem nome"}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancelar</Button>
            <Button
              disabled={mutation.isPending}
              onClick={() => confirmDialog && mutation.mutate({ user: confirmDialog.user, action: confirmDialog.action })}
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
