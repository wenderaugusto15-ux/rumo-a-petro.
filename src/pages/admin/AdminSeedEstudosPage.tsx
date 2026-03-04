import { useState, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/sonner";
import { Loader2, Database, BookOpen, FileText, Video, Film } from "lucide-react";
import { seedMaterias, seedModulos, seedConteudos, seedVideoConteudos, type SeedLog } from "@/lib/seedEstudos";
import { seedYouTubeVideos } from "@/lib/seedConteudos";

export default function AdminSeedEstudosPage() {
  const [logs, setLogs] = useState<SeedLog[]>([]);
  const [running, setRunning] = useState(false);
  const [materiasReady, setMateriasReady] = useState(false);
  const [modulosReady, setModulosReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addLog = (log: SeedLog) => {
    setLogs((prev) => [...prev, log]);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    }, 50);
  };

  const runMaterias = async () => {
    setRunning(true);
    setProgress(10);
    const ok = await seedMaterias(addLog);
    setProgress(100);
    setMateriasReady(ok);
    if (ok) toast.success("Matérias populadas com sucesso!");
    else toast.error("Erro ao popular matérias");
    setRunning(false);
  };

  const runModulos = async () => {
    setRunning(true);
    setProgress(10);
    const ok = await seedModulos(addLog);
    setProgress(100);
    setModulosReady(ok);
    if (ok) toast.success("Módulos populados com sucesso!");
    else toast.error("Erro ao popular módulos");
    setRunning(false);
  };

  const runConteudos = async () => {
    setRunning(true);
    setProgress(10);
    const ok = await seedConteudos(addLog);
    setProgress(100);
    if (ok) toast.success("Conteúdos populados com sucesso!");
    else toast.error("Erro ao popular conteúdos");
    setRunning(false);
  };

  const runVideos = async () => {
    setRunning(true);
    setProgress(10);
    const ok = await seedVideoConteudos(addLog);
    setProgress(100);
    if (ok) toast.success("Vídeos populados com sucesso!");
    else toast.error("Erro ao popular vídeos");
    setRunning(false);
  };

  const runYouTubeVideos = async () => {
    setRunning(true);
    setProgress(10);
    const ok = await seedYouTubeVideos(addLog);
    setProgress(100);
    if (ok) toast.success("Vídeos do YouTube populados com sucesso!");
    else toast.error("Alguns erros ocorreram ao popular vídeos");
    setRunning(false);
  };

  const logsText = logs.map((l) => l.message).join("\n");

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Popular Conteúdos de Estudo</h1>
          <p className="text-muted-foreground mt-1">
            Seed de matérias, módulos e conteúdos para o concurso Petrobras (Cesgranrio)
          </p>
        </div>

        {running && <Progress value={progress} className="h-2" />}

        <div className="flex flex-wrap gap-3">
          <Button onClick={runMaterias} disabled={running}>
            {running ? <Loader2 className="animate-spin" /> : <Database />}
            Executar Seed de Matérias
          </Button>
          <Button onClick={runModulos} disabled={running || !materiasReady} variant="secondary">
            {running ? <Loader2 className="animate-spin" /> : <BookOpen />}
            Executar Seed de Módulos
          </Button>
          <Button onClick={runConteudos} disabled={running || !modulosReady} variant="secondary">
            {running ? <Loader2 className="animate-spin" /> : <FileText />}
            Executar Seed de Conteúdos
          </Button>
          <Button onClick={runVideos} disabled={running} variant="secondary">
            {running ? <Loader2 className="animate-spin" /> : <Video />}
            Popular Conteúdos de Vídeo
          </Button>
          <Button onClick={runYouTubeVideos} disabled={running} variant="destructive">
            {running ? <Loader2 className="animate-spin" /> : <Film />}
            🎬 Popular Vídeos do YouTube
          </Button>
        </div>

        <textarea
          ref={textareaRef}
          readOnly
          value={logsText}
          placeholder="Os logs de execução aparecerão aqui..."
          className="w-full h-80 rounded-lg border border-border bg-muted/50 p-4 text-sm font-mono text-foreground resize-none focus:outline-none"
        />
      </div>
    </AdminLayout>
  );
}
