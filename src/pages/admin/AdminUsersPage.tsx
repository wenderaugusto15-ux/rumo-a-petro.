import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Users, Crown, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  plano: string;
  plano_ativo_ate: string | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [duration, setDuration] = useState("30");
  const [customDays, setCustomDays] = useState("");
  const [observation, setObservation] = useState("");

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, name, plano, plano_ativo_ate, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Profile[];
    },
  });

  const activateMutation = useMutation({
    mutationFn: async ({ userId, days }: { userId: string; days: number }) => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
      const { error } = await supabase
        .from("profiles")
        .update({ plano: "premium", plano_ativo_ate: expiresAt.toISOString() })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast({ title: "Premium ativado com sucesso!" });
      setSelectedUser(null);
      setObservation("");
    },
    onError: () => {
      toast({ title: "Erro ao ativar premium", variant: "destructive" });
    },
  });

  const getDays = () => {
    if (duration === "custom") return parseInt(customDays) || 0;
    return parseInt(duration);
  };

  const filtered = (profiles || []).filter(
    (p) => !search || p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          </div>
          <Badge variant="outline">{filtered.length} usuários</Badge>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((profile) => {
                  const isPremium = profile.plano === "premium" && profile.plano_ativo_ate && new Date(profile.plano_ativo_ate) > new Date();
                  return (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.name || "—"}</TableCell>
                      <TableCell>
                        {isPremium ? (
                          <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white border-0">
                            <Crown className="h-3 w-3 mr-1" /> PREMIUM
                          </Badge>
                        ) : (
                          <Badge variant="secondary">FREE</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isPremium && profile.plano_ativo_ate
                          ? format(new Date(profile.plano_ativo_ate), "dd/MM/yyyy", { locale: ptBR })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(profile.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setSelectedUser(profile)}>
                          {isPremium ? "Renovar" : "Ativar Premium"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      <Dialog open={!!selectedUser} onOpenChange={(o) => !o && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ativar Premium para {selectedUser?.name || "Usuário"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Duração</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 dias (Mensal)</SelectItem>
                  <SelectItem value="180">180 dias (Semestral)</SelectItem>
                  <SelectItem value="365">365 dias (Anual)</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              {duration === "custom" && (
                <Input
                  type="number"
                  placeholder="Número de dias"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea
                placeholder="Ex: Pagamento PIX, Cortesia..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancelar</Button>
            <Button
              disabled={getDays() <= 0 || activateMutation.isPending}
              onClick={() => selectedUser && activateMutation.mutate({ userId: selectedUser.user_id, days: getDays() })}
            >
              Confirmar Ativação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
