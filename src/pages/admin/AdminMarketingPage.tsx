import { useState, useEffect } from "react";
import { Megaphone, Save, Loader2, CheckCircle2, XCircle } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function AdminMarketingPage() {
  const [pixelId, setPixelId] = useState("");
  const [pixelActive, setPixelActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("app_config")
        .select("key, value")
        .in("key", ["meta_pixel_id", "meta_pixel_active"]);

      if (data) {
        const idRow = data.find((r) => r.key === "meta_pixel_id");
        const activeRow = data.find((r) => r.key === "meta_pixel_active");
        if (idRow) setPixelId(String(idRow.value ?? ""));
        if (activeRow) setPixelActive(activeRow.value === true);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from("app_config").upsert({ key: "meta_pixel_id", value: JSON.parse(JSON.stringify(pixelId)) });
      await supabase.from("app_config").upsert({ key: "meta_pixel_active", value: pixelActive as any });
      toast({ title: "Configurações salvas com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Marketing / Pixel</h1>
            <p className="text-sm text-muted-foreground">Configure o Meta Pixel para rastreamento de conversões</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Meta Pixel (Facebook Pixel)</CardTitle>
            <CardDescription>
              Insira o ID do seu Meta Pixel para rastrear eventos de conversão no Facebook/Instagram Ads.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Status</Label>
                    <div className="flex items-center gap-2 text-sm">
                      {pixelActive ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span className="text-success font-medium">Ativo</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Inativo</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Switch checked={pixelActive} onCheckedChange={setPixelActive} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pixel-id">Pixel ID</Label>
                  <Input
                    id="pixel-id"
                    placeholder="Ex: 123456789012345"
                    value={pixelId}
                    onChange={(e) => setPixelId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Encontre seu Pixel ID no{" "}
                    <a
                      href="https://business.facebook.com/events_manager"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline"
                    >
                      Gerenciador de Eventos do Meta
                    </a>
                  </p>
                </div>

                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Eventos rastreados automaticamente:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>PageView — todas as páginas /app/*</li>
                    <li>Login — login realizado</li>
                    <li>CompleteRegistration — cadastro completo</li>
                    <li>OnboardingComplete — onboarding finalizado</li>
                    <li>InitiateCheckout — clique em Upgrade PRO</li>
                    <li>Purchase — assinatura de plano</li>
                    <li>StartSimulado — início de simulado</li>
                    <li>CompleteSimulado — simulado finalizado</li>
                    <li>WatchLesson — aula assistida</li>
                  </ul>
                </div>

                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar Configurações
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
