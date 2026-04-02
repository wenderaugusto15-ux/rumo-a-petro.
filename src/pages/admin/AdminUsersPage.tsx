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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Search, MoreHorizontal, Crown, XCircle, CalendarPlus, Users, Loader2,
  Star, Eye, Download, Shield, Ban, Trash2
} from "lucide-react";
import { format, subDays, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDebounce } from "@/hooks/useDebounce";

type UserRow = {
  user_id: string;
  name: string | null;
  created_at: string;
  plan: "free" | "pro";
  status: "active" | "canceled" | "expired";
  started_at: string | null;
  ends_at: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  is_lifetime: boolean;
  role: string;
};

type ActionType = "pro_monthly" | "pro_semestral" | "pro_anual" | "pro_lifetime" | "cancel" | "extend" | "extend_trial" | "revoke";

const ACTION_LABELS: Record<ActionType, string> = {
  pro_monthly: "Ativar PRO Mensal",
  pro_semestral: "Ativar PRO Semestral",
  pro_anual: "Ativar PRO Anual",
  pro_lifetime: "Ativar PRO Lifetime",
  cancel: "Cancelar Plano",
  extend: "Estender +1 mês",
  extend_trial: "Estender Trial +7 dias",
  revoke: "Revogar Acesso",
};

function getUserStatus(u: UserRow): { label: string; variant: string } {
  const now = new Date();
  if (u.is_lifetime) return { label: "Lifetime", variant: "bg-purple-600 text-white" };
  if (u.plan === "pro" && u.status === "active") return { label: "PRO", variant: "bg-yellow-500 text-black" };
  if (u.plan === "free" && u.trial_ends_at) {
    const te = new Date(u.trial_ends_at);
    if (now < te) return { label: "Trial", variant: "bg-green-600 text-white" };
    return { label: "Expirado", variant: "bg-orange-500 text-white" };
  }
  if (u.status === "canceled") return { label: "Cancelado", variant: "bg-destructive text-destructive-foreground" };
  return { label: "Free", variant: "bg-muted text-muted-foreground" };
}

function getActivityIndicator(createdAt: string) {
  const days = differenceInDays(new Date(), new Date(createdAt));
  if (days <= 1) return { color: "bg-green-500", label: "Novo" };
  if (days <= 7) return { color: "bg-yellow-500", label: "Recente" };
  return { color: "bg-muted-foreground/50", label: "" };
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [confirmDialog, setConfirmDialog] = useState<{ user: UserRow; action: ActionType } | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users-full"],
    queryFn: async () => {
      const [{ data: profiles, error: pErr }, { data: subs, error: sErr }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("user_id, name, created_at").order("created_at", { ascending: false }),
        supabase.from("subscriptions").select("user_id, plan, status, started_at, ends_at, trial_started_at, trial_ends_at, is_lifetime"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (pErr) throw pErr;
      if (sErr) throw sErr;

      const subMap = new Map(subs?.map(s => [s.user_id, s]) ?? []);
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) ?? []);

      return (profiles ?? []).map(p => {
        const sub = subMap.get(p.user_id);
        return {
          user_id: p.user_id,
          name: p.name,
          created_at: p.created_at,
          plan: sub?.plan ?? "free",
          status: sub?.status ?? "active",
          started_at: sub?.started_at ?? null,
          ends_at: sub?.ends_at ?? null,
          trial_started_at: sub?.trial_started_at ?? null,
          trial_ends_at: sub?.trial_ends_at ?? null,
          is_lifetime: sub?.is_lifetime ?? false,
          role: roleMap.get(p.user_id) ?? "user",
        } as UserRow;
      });
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ user, action }: { user: UserRow; action: ActionType }) => {
      const now = new Date();

      if (action === "cancel" || action === "revoke") {
        const { error } = await supabase
          .from("subscriptions")
          .update({ plan: "free", status: "canceled", ends_at: now.toISOString(), is_lifetime: false })
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

      if (action === "extend_trial") {
        const currentEnd = user.trial_ends_at ? new Date(user.trial_ends_at) : now;
        const base = currentEnd > now ? currentEnd : now;
        base.setDate(base.getDate() + 7);
        const { error } = await supabase
          .from("subscriptions")
          .update({ trial_ends_at: base.toISOString(), status: "active" })
          .eq("user_id", user.user_id);
        if (error) throw error;
        return;
      }

      if (action === "pro_lifetime") {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            plan: "pro", status: "active", started_at: now.toISOString(),
            ends_at: "2099-12-31T23:59:59Z", is_lifetime: true,
          })
          .eq("user_id", user.user_id);
        if (error) throw error;
        return;
      }

      // pro_monthly, pro_semestral, pro_anual
      const months = action === "pro_anual" ? 12 : action === "pro_semestral" ? 6 : 1;
      const endsAt = new Date(now);
      endsAt.setMonth(endsAt.getMonth() + months);

      const { error } = await supabase
        .from("subscriptions")
        .update({ plan: "pro", status: "active", started_at: now.toISOString(), ends_at: endsAt.toISOString(), is_lifetime: false })
        .eq("user_id", user.user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Plano atualizado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["admin-users-full"] });
      setConfirmDialog(null);
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  // Filtering
  const filtered = (users ?? []).filter((u) => {
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      if (!(u.name?.toLowerCase().includes(q) || u.user_id.toLowerCase().includes(q))) return false;
    }

    if (statusFilter !== "all") {
      const s = getUserStatus(u);
      if (statusFilter === "pro" && s.label !== "PRO") return false;
      if (statusFilter === "trial" && s.label !== "Trial") return false;
      if (statusFilter === "expired" && s.label !== "Expirado") return false;
      if (statusFilter === "lifetime" && s.label !== "Lifetime") return false;
      if (statusFilter === "canceled" && s.label !== "Cancelado") return false;
    }

    if (periodFilter !== "all") {
      const created = new Date(u.created_at);
      const now = new Date();
      if (periodFilter === "today" && differenceInDays(now, created) > 0) return false;
      if (periodFilter === "week" && differenceInDays(now, created) > 7) return false;
      if (periodFilter === "month" && differenceInDays(now, created) > 30) return false;
    }

    return true;
  });

  const exportCsv = () => {
    const headers = ["Nome", "User ID", "Plano", "Status", "Cadastro", "Trial Expira", "Lifetime", "Role"];
    const rows = filtered.map(u => [
      u.name ?? "Sem nome",
      u.user_id,
      u.plan,
      getUserStatus(u).label,
      format(new Date(u.created_at), "dd/MM/yyyy"),
      u.trial_ends_at ? format(new Date(u.trial_ends_at), "dd/MM/yyyy") : "—",
      u.is_lifetime ? "Sim" : "Não",
      u.role,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usuarios_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // User detail data
  const { data: userActivity } = useQuery({
    queryKey: ["admin-user-activity", selectedUser?.user_id],
    queryFn: async () => {
      if (!selectedUser) return null;
      const [{ count: questionsAnswered }, { count: mocksStarted }, { data: xp }] = await Promise.all([
        supabase.from("question_attempts").select("id", { count: "exact", head: true }).eq("user_id", selectedUser.user_id),
        supabase.from("mock_exams").select("id", { count: "exact", head: true }).eq("user_id", selectedUser.user_id),
        supabase.from("user_xp").select("xp_total, level_name").eq("user_id", selectedUser.user_id).maybeSingle(),
      ]);
      return {
        questionsAnswered: questionsAnswered ?? 0,
        mocksStarted: mocksStarted ?? 0,
        xpTotal: xp?.xp_total ?? 0,
        levelName: xp?.level_name ?? "Iniciante",
      };
    },
    enabled: !!selectedUser,
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
          <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2">
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pro">PRO</SelectItem>
              <SelectItem value="trial">Trial Ativo</SelectItem>
              <SelectItem value="expired">Trial Expirado</SelectItem>
              <SelectItem value="lifetime">Lifetime</SelectItem>
              <SelectItem value="canceled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total", value: filtered.length },
            { label: "PRO", value: filtered.filter(u => u.plan === "pro" && u.status === "active").length },
            { label: "Trial", value: filtered.filter(u => getUserStatus(u).label === "Trial").length },
            { label: "Expirado", value: filtered.filter(u => getUserStatus(u).label === "Expirado").length },
            { label: "Lifetime", value: filtered.filter(u => u.is_lifetime).length },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-foreground">{s.value}</p>
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
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Dias Ativo</TableHead>
                  <TableHead>Trial Expira</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((u) => {
                    const status = getUserStatus(u);
                    const activity = getActivityIndicator(u.created_at);
                    const daysActive = differenceInDays(new Date(), new Date(u.created_at));
                    return (
                      <TableRow key={u.user_id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedUser(u)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                  {(u.name ?? "?").charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${activity.color}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium text-sm text-foreground">{u.name ?? "Sem nome"}</p>
                                {u.plan === "pro" && <Crown className="h-3 w-3 text-yellow-500" />}
                                {(u.role === "admin" || u.role === "master") && <Star className="h-3 w-3 text-purple-500" />}
                              </div>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{u.user_id.slice(0, 12)}...</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${status.variant} text-xs`}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(u.created_at), "dd/MM/yy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{daysActive}d</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.trial_ends_at ? format(new Date(u.trial_ends_at), "dd/MM/yy HH:mm", { locale: ptBR }) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">{u.role}</Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedUser(u)}>
                                <Eye className="h-4 w-4 mr-2" /> Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setConfirmDialog({ user: u, action: "pro_monthly" })}>
                                <Crown className="h-4 w-4 mr-2 text-yellow-500" /> PRO Mensal
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setConfirmDialog({ user: u, action: "pro_semestral" })}>
                                <Crown className="h-4 w-4 mr-2 text-green-500" /> PRO Semestral
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setConfirmDialog({ user: u, action: "pro_anual" })}>
                                <Crown className="h-4 w-4 mr-2 text-blue-500" /> PRO Anual
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setConfirmDialog({ user: u, action: "pro_lifetime" })}>
                                <Shield className="h-4 w-4 mr-2 text-purple-500" /> PRO Lifetime
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setConfirmDialog({ user: u, action: "extend" })}>
                                <CalendarPlus className="h-4 w-4 mr-2 text-blue-500" /> Estender +1 mês
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setConfirmDialog({ user: u, action: "extend_trial" })}>
                                <CalendarPlus className="h-4 w-4 mr-2 text-green-500" /> Estender Trial +7 dias
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setConfirmDialog({ user: u, action: "cancel" })} className="text-destructive focus:text-destructive">
                                <XCircle className="h-4 w-4 mr-2" /> Cancelar Plano
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setConfirmDialog({ user: u, action: "revoke" })} className="text-destructive focus:text-destructive">
                                <Ban className="h-4 w-4 mr-2" /> Revogar Acesso
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* User Detail Sheet */}
      <Sheet open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedUser && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                      {(selectedUser.name ?? "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{selectedUser.name ?? "Sem nome"}</span>
                      <Badge className={getUserStatus(selectedUser).variant + " text-xs"}>
                        {getUserStatus(selectedUser).label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-normal">{selectedUser.user_id}</p>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Info Pessoais */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Informações Pessoais</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Nome:</span><p className="font-medium">{selectedUser.name ?? "—"}</p></div>
                    <div><span className="text-muted-foreground">Role:</span><p className="font-medium capitalize">{selectedUser.role}</p></div>
                    <div className="col-span-2"><span className="text-muted-foreground">Cadastro:</span><p className="font-medium">{format(new Date(selectedUser.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p></div>
                  </div>
                </div>

                <Separator />

                {/* Assinatura */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Informações de Assinatura</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Plano:</span><p className="font-medium uppercase">{selectedUser.plan}</p></div>
                    <div><span className="text-muted-foreground">Status:</span><p className="font-medium capitalize">{selectedUser.status}</p></div>
                    <div><span className="text-muted-foreground">Início:</span><p className="font-medium">{selectedUser.started_at ? format(new Date(selectedUser.started_at), "dd/MM/yyyy") : "—"}</p></div>
                    <div><span className="text-muted-foreground">Expira:</span><p className="font-medium">{selectedUser.ends_at ? format(new Date(selectedUser.ends_at), "dd/MM/yyyy") : "—"}</p></div>
                    <div><span className="text-muted-foreground">Trial Expira:</span><p className="font-medium">{selectedUser.trial_ends_at ? format(new Date(selectedUser.trial_ends_at), "dd/MM/yyyy HH:mm") : "—"}</p></div>
                    <div><span className="text-muted-foreground">Vitalício:</span><p className="font-medium">{selectedUser.is_lifetime ? "✅ Sim" : "Não"}</p></div>
                  </div>
                </div>

                <Separator />

                {/* Atividade */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Atividade</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold">{userActivity?.questionsAnswered ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Questões respondidas</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold">{userActivity?.mocksStarted ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Simulados</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold">{userActivity?.xpTotal ?? 0}</p>
                      <p className="text-xs text-muted-foreground">XP Total</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold">{userActivity?.levelName ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">Nível</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Quick Actions */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Ações Rápidas</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setSelectedUser(null); setConfirmDialog({ user: selectedUser, action: "pro_monthly" }); }}>
                      <Crown className="h-3 w-3 mr-1 text-yellow-500" /> PRO Mensal
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setSelectedUser(null); setConfirmDialog({ user: selectedUser, action: "pro_lifetime" }); }}>
                      <Shield className="h-3 w-3 mr-1 text-purple-500" /> Lifetime
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setSelectedUser(null); setConfirmDialog({ user: selectedUser, action: "extend_trial" }); }}>
                      <CalendarPlus className="h-3 w-3 mr-1 text-green-500" /> +7d Trial
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { setSelectedUser(null); setConfirmDialog({ user: selectedUser, action: "cancel" }); }}>
                      <XCircle className="h-3 w-3 mr-1" /> Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

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
