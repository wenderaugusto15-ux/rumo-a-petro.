import { useState, useEffect } from "react";
import { Settings, User, Lock, MapPin, Save, Loader2, Search } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserArea, useInvalidateUserArea } from "@/hooks/useUserArea";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const { trackId, trackName, hasArea } = useUserArea();
  const invalidateArea = useInvalidateUserArea();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [areaSearch, setAreaSearch] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [savingArea, setSavingArea] = useState(false);

  // Load profile
  const { data: profile } = useQuery({
    queryKey: ["profile-settings", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile?.name) setName(profile.name);
  }, [profile]);

  // Load tracks for area modal
  const { data: tracks } = useQuery({
    queryKey: ["tracks-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tracks")
        .select("id, name, description")
        .eq("active", true)
        .order("name");
      return data || [];
    },
  });

  const filteredTracks = (tracks || []).filter((t) =>
    t.name.toLowerCase().includes(areaSearch.toLowerCase())
  );

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado com sucesso!" });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast({ title: "Erro ao alterar senha", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Senha alterada com sucesso!" });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleSaveArea = async () => {
    if (!user || !selectedTrackId) return;
    setSavingArea(true);
    const { error } = await supabase
      .from("profiles")
      .update({ track_id: selectedTrackId })
      .eq("user_id", user.id);
    setSavingArea(false);
    if (error) {
      toast({ title: "Erro ao alterar área", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Área Específica alterada com sucesso!" });
      invalidateArea();
      setAreaModalOpen(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
            <p className="text-sm text-muted-foreground">Gerencie seu perfil e preferências</p>
          </div>
        </div>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" /> Dados do Perfil
            </CardTitle>
            <CardDescription>Atualize suas informações pessoais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Perfil
            </Button>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5" /> Alterar Senha
            </CardTitle>
            <CardDescription>Defina uma nova senha para sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" />
            </div>
            <Button onClick={handleChangePassword} disabled={changingPassword} variant="outline">
              {changingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
              Alterar Senha
            </Button>
          </CardContent>
        </Card>

        {/* Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" /> Minha Área Específica
            </CardTitle>
            <CardDescription>
              {hasArea ? `Área atual: ${trackName}` : "Nenhuma área selecionada"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              📚 Matérias Gerais continuarão incluídas automaticamente.
            </p>
            <Button variant="outline" onClick={() => { setSelectedTrackId(trackId); setAreaModalOpen(true); }}>
              <MapPin className="h-4 w-4 mr-2" />
              {hasArea ? "Alterar Área" : "Selecionar Área"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Area Modal */}
      <Dialog open={areaModalOpen} onOpenChange={setAreaModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Selecionar Área Específica</DialogTitle>
          </DialogHeader>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar área..." value={areaSearch} onChange={(e) => setAreaSearch(e.target.value)} className="pl-9" />
          </div>
          <p className="text-xs text-muted-foreground mb-2">📚 Matérias Gerais continuarão incluídas automaticamente</p>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {filteredTracks.map((track) => (
              <button
                key={track.id}
                onClick={() => setSelectedTrackId(track.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  selectedTrackId === track.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <div className="font-medium">{track.name}</div>
                {track.description && <div className="text-xs opacity-70 mt-0.5">{track.description}</div>}
              </button>
            ))}
            {filteredTracks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma área encontrada</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAreaModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveArea} disabled={!selectedTrackId || savingArea}>
              {savingArea && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
