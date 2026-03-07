import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ChevronRight, ChevronLeft, CalendarDays, Clock, Target, Search, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useMetaPixel } from "@/hooks/useMetaPixel";

interface Track {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
}

const DAYS = [
  { key: "Mon", label: "Seg" },
  { key: "Tue", label: "Ter" },
  { key: "Wed", label: "Qua" },
  { key: "Thu", label: "Qui" },
  { key: "Fri", label: "Sex" },
  { key: "Sat", label: "Sáb" },
  { key: "Sun", label: "Dom" },
];

const HOURS_OPTIONS = [5, 10, 15, 20, 25, 30];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  // Step 1
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [trackSearch, setTrackSearch] = useState("");

  // Step 2
  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [hoursPerWeek, setHoursPerWeek] = useState(10);

  // Step 3
  const [examDate, setExamDate] = useState<Date | undefined>(undefined);
  const [noDateSet, setNoDateSet] = useState(false);

  const [saving, setSaving] = useState(false);
  const { trackEvent } = useMetaPixel();

  useEffect(() => {
    supabase.from("tracks").select("*").eq("active", true).then(({ data }) => {
      if (data) setTracks(data);
    });
  }, []);

  const filteredTracks = tracks.filter((t) =>
    t.name.toLowerCase().includes(trackSearch.toLowerCase())
  );

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Update profile with track
      await supabase
        .from("profiles")
        .update({ track_id: selectedTrack })
        .eq("user_id", user.id);

      // Upsert study plan settings
      await supabase.from("study_plan_settings").upsert({
        user_id: user.id,
        available_days: selectedDays,
        hours_per_week: hoursPerWeek,
        exam_date: noDateSet ? null : examDate ? format(examDate, "yyyy-MM-dd") : null,
      }, { onConflict: "user_id" });

      toast({ title: "Plano criado com sucesso! 🎉", description: "Sua jornada de estudos começa agora." });
      trackEvent("OnboardingComplete");
      navigate("/app/simulados");
    } catch (err) {
      toast({ title: "Erro ao salvar", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    if (step === 1) return !!selectedTrack;
    if (step === 2) return selectedDays.length > 0 && hoursPerWeek > 0;
    return true;
  };

  const progressPercent = (step / 3) * 100;

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  const [direction, setDirection] = useState(1);

  const goNext = () => { setDirection(1); setStep((s) => Math.min(s + 1, 3)); };
  const goBack = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 1)); };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="h-9 w-9 rounded-xl bg-gradient-cta flex items-center justify-center">
          <Zap className="h-5 w-5 text-accent-foreground" />
        </div>
        <span className="font-extrabold text-lg text-foreground">Rumo à Petrobras</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-card rounded-2xl shadow-card border border-border overflow-hidden">
        {/* Progress */}
        <div className="p-5 pb-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Passo {step} de 3</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2 [&>div]:bg-gradient-cta" />
        </div>

        {/* Steps */}
        <div className="p-5 min-h-[380px] flex flex-col">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-1">
                  <Target className="h-5 w-5 text-accent" />
                  <h2 className="text-xl font-extrabold text-foreground">Selecione sua Área Específica</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Qual cargo/área você vai concorrer?</p>
                <p className="text-xs text-accent font-medium mb-4">📚 Matérias Gerais já estão incluídas na sua grade automaticamente.</p>

                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar área específica..."
                    value={trackSearch}
                    onChange={(e) => setTrackSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto max-h-[220px] pr-1">
                  {filteredTracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => setSelectedTrack(track.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-all",
                        selectedTrack === track.id
                          ? "border-accent bg-accent/10 shadow-sm"
                          : "border-border bg-background hover:border-accent/40"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-foreground">{track.name}</div>
                          {track.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">{track.description}</div>
                          )}
                        </div>
                        {selectedTrack === track.id && <Check className="h-5 w-5 text-accent shrink-0" />}
                      </div>
                      {track.category && (
                        <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {track.category}
                        </span>
                      )}
                    </button>
                  ))}
                  {filteredTracks.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">Nenhuma área específica encontrada.</p>
                  )}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-1">
                  <Clock className="h-5 w-5 text-accent" />
                  <h2 className="text-xl font-extrabold text-foreground">Disponibilidade</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-5">Quais dias e quantas horas por semana?</p>

                <div className="mb-6">
                  <label className="text-sm font-semibold text-foreground mb-2 block">Dias disponíveis</label>
                  <div className="flex gap-2 flex-wrap">
                    {DAYS.map((d) => (
                      <button
                        key={d.key}
                        onClick={() => toggleDay(d.key)}
                        className={cn(
                          "h-10 w-12 rounded-lg text-sm font-bold transition-all border",
                          selectedDays.includes(d.key)
                            ? "bg-accent text-accent-foreground border-accent shadow-sm"
                            : "bg-background text-muted-foreground border-border hover:border-accent/40"
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Horas por semana</label>
                  <div className="grid grid-cols-3 gap-2">
                    {HOURS_OPTIONS.map((h) => (
                      <button
                        key={h}
                        onClick={() => setHoursPerWeek(h)}
                        className={cn(
                          "py-3 rounded-xl text-sm font-bold transition-all border",
                          hoursPerWeek === h
                            ? "bg-accent text-accent-foreground border-accent shadow-sm"
                            : "bg-background text-muted-foreground border-border hover:border-accent/40"
                        )}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-1">
                  <CalendarDays className="h-5 w-5 text-accent" />
                  <h2 className="text-xl font-extrabold text-foreground">Data da prova</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-5">Quando é o concurso? (pode alterar depois)</p>

                <div className="flex-1 flex flex-col items-center gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={noDateSet}
                        className={cn(
                          "w-full max-w-xs justify-start text-left font-medium h-12",
                          !examDate && !noDateSet && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {examDate && !noDateSet
                          ? format(examDate, "PPP", { locale: ptBR })
                          : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar
                        mode="single"
                        selected={examDate}
                        onSelect={setExamDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>

                  <button
                    onClick={() => { setNoDateSet(!noDateSet); if (!noDateSet) setExamDate(undefined); }}
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors",
                      noDateSet ? "text-accent" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className={cn(
                      "h-5 w-5 rounded border flex items-center justify-center transition-colors",
                      noDateSet ? "bg-accent border-accent" : "border-border"
                    )}>
                      {noDateSet && <Check className="h-3 w-3 text-accent-foreground" />}
                    </div>
                    Ainda não sei a data
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button variant="ghost" onClick={goBack}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button
              onClick={goNext}
              disabled={!canNext()}
              className="bg-gradient-cta text-accent-foreground shadow-cta hover:opacity-90"
            >
              Próximo <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={saving}
              className="bg-gradient-cta text-accent-foreground shadow-cta hover:opacity-90"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Gerar meu plano 🚀
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
