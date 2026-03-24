import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}

export default function CsvImportDialog({ open, onOpenChange, onSuccess }: Props) {
  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    if (lines.length < 2) { toast({ title: "CSV vazio", variant: "destructive" }); return; }

    const rows = lines.slice(1).map(line => {
      const cols = line.split(";").map(c => c.trim().replace(/^"|"$/g, ""));
      return {
        statement: cols[0] || "", option_a: cols[1] || "", option_b: cols[2] || "",
        option_c: cols[3] || "", option_d: cols[4] || "", option_e: cols[5] || "",
        correct_option: cols[6] || "A", explanation: cols[7] || "",
        subject_id: cols[8] || "", level: (cols[9] as "easy" | "medium" | "hard") || "medium",
      };
    }).filter(r => r.statement && r.subject_id);

    if (!rows.length) { toast({ title: "Nenhuma questão válida", variant: "destructive" }); return; }

    const { error } = await supabase.from("questions").insert(rows);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
    else { toast({ title: `${rows.length} questões importadas!` }); onSuccess(); onOpenChange(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-2" />Importar CSV</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Importar Questões via CSV</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          Formato (separador: <code>;</code>):<br />
          <code>statement;option_a;option_b;option_c;option_d;option_e;correct_option;explanation;subject_id;level</code>
        </p>
        <Input type="file" accept=".csv" onChange={handleCsvImport} />
      </DialogContent>
    </Dialog>
  );
}
