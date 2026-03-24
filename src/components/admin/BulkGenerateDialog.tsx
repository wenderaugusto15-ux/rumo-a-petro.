import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";

interface Props {
  onSuccess: () => void;
}

export default function BulkGenerateDialog({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [level, setLevel] = useState<"easy" | "medium" | "hard">("medium");
  const [batches, setBatches] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data } = await supabase.from("subjects").select("*").eq("active", true).order("name");
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const selectedSubject = subjects?.find(s => s.id === subjectId);

  const handleGenerate = async () => {
    if (!subjectId || !selectedSubject) {
      toast({ title: "Selecione uma matéria", variant: "destructive" });
      return;
    }

    setGenerating(true);
    setProgress(0);
    setCurrentBatch(0);
    setResults({ success: 0, failed: 0 });

    let successCount = 0;
    let failedCount = 0;

    for (let i = 1; i <= batches; i++) {
      setCurrentBatch(i);
      try {
        const { data, error } = await supabase.functions.invoke("generate-questions", {
          body: {
            subject_id: subjectId,
            subject_name: selectedSubject.name,
            level,
            batch_num: i,
          },
        });

        if (error) throw error;
        successCount += data?.inserted ?? 0;
      } catch (err) {
        console.error(`Batch ${i} failed:`, err);
        failedCount++;
      }
      setProgress(Math.round((i / batches) * 100));
      setResults({ success: successCount, failed: failedCount });
    }

    setGenerating(false);
    toast({
      title: `Geração concluída!`,
      description: `${successCount} questões inseridas${failedCount > 0 ? `, ${failedCount} lote(s) falharam` : ""}`,
    });
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!generating) setOpen(v); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Sparkles className="h-4 w-4 mr-2" />Gerar com IA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Geração em Massa com IA</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Matéria</Label>
            <Select value={subjectId} onValueChange={setSubjectId} disabled={generating}>
              <SelectTrigger><SelectValue placeholder="Selecionar matéria" /></SelectTrigger>
              <SelectContent>
                {subjects?.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nível</Label>
              <Select value={level} onValueChange={v => setLevel(v as "easy" | "medium" | "hard")} disabled={generating}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Fácil</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="hard">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lotes (10 questões cada)</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={batches}
                onChange={e => setBatches(Math.min(20, Math.max(1, Number(e.target.value))))}
                disabled={generating}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Serão geradas aproximadamente <strong>{batches * 10}</strong> questões no estilo CESGRANRIO.
          </p>

          {generating && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Lote {currentBatch} de {batches} · {results.success} inseridas
                {results.failed > 0 && ` · ${results.failed} falha(s)`}
              </p>
            </div>
          )}

          <Button onClick={handleGenerate} disabled={generating || !subjectId} className="w-full">
            {generating ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Gerando...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" />Gerar {batches * 10} questões</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
