import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  SkipForward,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Check,
  Play,
  Brain,
  FileText,
  Trash2,
  Zap,
  Settings,
  Save,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  differenceInDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

type SessionStatus = "done" | "planned" | "skipped";

interface DbSession {
  id: string;
  date: string;
  minutes_planned: number;
  minutes_done: number | null;
  status: SessionStatus;
  subject_id: string | null;
  topic_id: string | null;
}

interface DbReview {
  id: string;
  due_date: string;
  status: "pending" | "done";
  subject_id: string | null;
  topic_id: string | null;
}

interface PlanSettings {
  hours_per_week: number;
  exam_date: string | null;
  available_days: string[] | null;
  review_intervals_days: number[] | null;
}

const views = ["Hoje", "Semana", "Calendário"] as const;
const weekDayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const dayMap: Record<string, string> = {
  Mon: "Segunda",
  Tue: "Terça",
  Wed: "Quarta",
  Thu: "Quinta",
  Fri: "Sexta",
  Sat: "Sábado",
  Sun: "Domingo",
};
const dayKeys = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const typeIcons = {
  video: { icon: Play, color: "text-blue-500", bg: "bg-blue-500/10", label: "Videoaula" },
  questions: { icon: BookOpen, color: "text-success", bg: "bg-success/10", label: "Questões" },
  review: { icon: Brain, color: "text-purple-500", bg: "bg-purple-500/10", label: "Revisão" },
  simulado: { icon: FileText, color: "text-accent", bg: "bg-accent/10", label: "Simulado" },
};

export default function StudyPlanPage() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<typeof views[number]>("Hoje");
  const [sessions, setSessions] = useState<DbSession[]>([]);
  const [reviews, setReviews] = useState<DbReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [subjectMap, setSubjectMap] = useState<Record<string, string>>({});
  const [topicMap, setTopicMap] = useState<Record<string, string>>({});

  // Config modal
  const [showConfig, setShowConfig] = useState(false);
  const [planSettings, setPlanSettings] = useState<PlanSettings>({
    hours_per_week: 10,
    exam_date: null,
    available_days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    review_intervals_days: [1, 7, 30],
  });

  // Add session modal
  const [showAddSession, setShowAddSession] = useState(false);
  const [newSession, setNewSession] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    minutes_planned: 60,
    subject_id: "",
    type: "questions" as keyof typeof typeIcons,
  });

  // Fetch lookups
  useEffect(() => {
    const fetchLookups = async () => {
      const [subRes, topRes] = await Promise.all([
        supabase.from("subjects").select("id, name"),
        supabase.from("topics").select("id, name"),
      ]);
      if (subRes.data) {
        setSubjects(subRes.data);
        const map: Record<string, string> = {};
        subRes.data.forEach((s) => (map[s.id] = s.name));
        setSubjectMap(map);
      }
      if (topRes.data) {
        const map: Record<string, string> = {};
        topRes.data.forEach((t) => (map[t.id] = t.name));
        setTopicMap(map);
      }
    };
    fetchLookups();
  }, []);

  // Fetch sessions, reviews & settings
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const [sessRes, revRes, settingsRes] = await Promise.all([
        supabase.from("study_sessions").select("*").eq("user_id", user.id).order("date", { ascending: true }),
        supabase.from("reviews").select("*").eq("user_id", user.id).order("due_date", { ascending: true }),
        supabase.from("study_plan_settings").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      if (sessRes.data) setSessions(sessRes.data as DbSession[]);
      if (revRes.data) setReviews(revRes.data as DbReview[]);
      if (settingsRes.data) {
        setPlanSettings({
          hours_per_week: settingsRes.data.hours_per_week,
          exam_date: settingsRes.data.exam_date,
          available_days: settingsRes.data.available_days,
          review_intervals_days: settingsRes.data.review_intervals_days,
        });
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const todaySessions = useMemo(() => sessions.filter((s) => s.date === todayStr), [sessions, todayStr]);
  const todayReviews = useMemo(() => reviews.filter((r) => r.due_date === todayStr), [reviews, todayStr]);

  const daysUntilExam = planSettings.exam_date
    ? differenceInDays(new Date(planSettings.exam_date + "T00:00:00"), new Date())
    : null;

  // Week data
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(new Date(), { weekStartsOn: 1 }) });

  const weekData = useMemo(() => {
    return weekDays.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const daySessions = sessions.filter((s) => s.date === dayStr);
      const done = daySessions.filter((s) => s.status === "done").length;
      return { day, done, total: daySessions.length };
    });
  }, [sessions, weekDays]);

  // Calendar grid
  const calStart = startOfWeek(startOfMonth(calMonth), { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(calMonth), { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const sessionsByDate = useMemo(() => {
    const map: Record<string, DbSession[]> = {};
    sessions.forEach((s) => { if (!map[s.date]) map[s.date] = []; map[s.date].push(s); });
    return map;
  }, [sessions]);

  const reviewsByDate = useMemo(() => {
    const map: Record<string, DbReview[]> = {};
    reviews.forEach((r) => { if (!map[r.due_date]) map[r.due_date] = []; map[r.due_date].push(r); });
    return map;
  }, [reviews]);

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedSessions = selectedDateStr ? sessionsByDate[selectedDateStr] || [] : [];
  const selectedReviews = selectedDateStr ? reviewsByDate[selectedDateStr] || [] : [];

  // Actions
  const markDone = async (id: string) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status: "done" as SessionStatus } : s)));
    await supabase.from("study_sessions").update({ status: "done" }).eq("id", id);
  };

  const skip = async (id: string) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status: "skipped" as SessionStatus } : s)));
    await supabase.from("study_sessions").update({ status: "skipped" }).eq("id", id);
  };

  const deleteSession = async (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    await supabase.from("study_sessions").delete().eq("id", id);
  };

  const markReviewDone = async (id: string) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: "done" as const } : r)));
    await supabase.from("reviews").update({ status: "done", completed_at: new Date().toISOString() }).eq("id", id);
  };

  const addNewSession = async () => {
    if (!user || !newSession.subject_id) return;
    const { data, error } = await supabase.from("study_sessions").insert({
      user_id: user.id,
      date: newSession.date,
      minutes_planned: newSession.minutes_planned,
      subject_id: newSession.subject_id,
      status: "planned",
    }).select().single();
    if (data) {
      setSessions((prev) => [...prev, data as DbSession]);
      toast.success("Sessão adicionada!");
    }
    if (error) toast.error("Erro ao adicionar sessão");
    setShowAddSession(false);
    setNewSession({ date: format(new Date(), "yyyy-MM-dd"), minutes_planned: 60, subject_id: "", type: "questions" });
  };

  const saveSettings = async () => {
    if (!user) return;
    const { error } = await supabase.from("study_plan_settings").upsert({
      user_id: user.id,
      hours_per_week: planSettings.hours_per_week,
      exam_date: planSettings.exam_date,
      available_days: planSettings.available_days,
      review_intervals_days: planSettings.review_intervals_days,
    }, { onConflict: "user_id" });
    if (error) toast.error("Erro ao salvar configurações");
    else toast.success("Configurações salvas!");
    setShowConfig(false);
  };

  const generateAutomaticPlan = async () => {
    if (!user || !subjects.length) return;
    const days = planSettings.available_days || ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const enabledDays = days;
    const minutesPerDay = Math.round((planSettings.hours_per_week * 60) / enabledDays.length);
    const newSessions: any[] = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const jsDay = date.getDay();
      const dayKey = dayKeys[jsDay === 0 ? 6 : jsDay - 1];
      if (!enabledDays.includes(dayKey)) continue;

      const subject = subjects[i % subjects.length];
      newSessions.push({
        user_id: user.id,
        date: format(date, "yyyy-MM-dd"),
        minutes_planned: minutesPerDay,
        subject_id: subject.id,
        status: "planned",
      });
    }

    if (newSessions.length) {
      const { data, error } = await supabase.from("study_sessions").insert(newSessions).select();
      if (data) {
        setSessions((prev) => [...prev, ...(data as DbSession[])]);
        toast.success(`${data.length} sessões geradas!`);
      }
      if (error) toast.error("Erro ao gerar plano");
    }
    await saveSettings();
  };

  const toggleDay = (key: string) => {
    const current = planSettings.available_days || [];
    setPlanSettings({
      ...planSettings,
      available_days: current.includes(key) ? current.filter((d) => d !== key) : [...current, key],
    });
  };

  const completedToday = todaySessions.filter((s) => s.status === "done").length;
  const totalWeek = sessions.filter((s) => {
    const d = new Date(s.date + "T00:00:00");
    return d >= weekStart && d <= endOfWeek(new Date(), { weekStartsOn: 1 });
  }).length;

  // Render helpers
  const renderSessionCard = (s: DbSession) => (
    <div
      key={s.id}
      className={`bg-card rounded-xl p-4 shadow-card border border-border flex items-center gap-4 transition-opacity ${
        s.status === "skipped" ? "opacity-50" : ""
      }`}
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
        s.status === "done" ? "bg-success/10" : "bg-primary/10"
      }`}>
        {s.status === "done" ? <CheckCircle className="h-5 w-5 text-success" /> : <BookOpen className="h-5 w-5 text-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-foreground truncate">
          {s.subject_id ? subjectMap[s.subject_id] || "Matéria" : "Sessão"}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {s.topic_id ? topicMap[s.topic_id] : "Estudo"} · {s.minutes_planned} min
        </div>
      </div>
      {s.status === "planned" && (
        <div className="flex gap-1 shrink-0">
          <Button size="sm" variant="ghost" onClick={() => deleteSession(s.id)} className="text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => skip(s.id)}>
            <SkipForward className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" className="bg-gradient-success text-success-foreground hover:opacity-90" onClick={() => markDone(s.id)}>
            <CheckCircle className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      {s.status === "done" && <span className="text-xs font-semibold text-success shrink-0">Concluído</span>}
      {s.status === "skipped" && <span className="text-xs font-semibold text-muted-foreground shrink-0">Pulada</span>}
    </div>
  );

  const renderReviewCard = (r: DbReview) => (
    <div
      key={r.id}
      className={`bg-card rounded-xl p-4 shadow-card border border-border flex items-center gap-4 ${r.status === "done" ? "opacity-60" : ""}`}
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${r.status === "done" ? "bg-success/10" : "bg-accent/10"}`}>
        {r.status === "done" ? <CheckCircle className="h-5 w-5 text-success" /> : <Clock className="h-5 w-5 text-accent" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-foreground truncate">
          Revisão: {r.subject_id ? subjectMap[r.subject_id] || "Matéria" : "Geral"}
        </div>
        <div className="text-xs text-muted-foreground truncate">{r.topic_id ? topicMap[r.topic_id] : "Revisão espaçada"}</div>
      </div>
      {r.status === "pending" && (
        <Button size="sm" className="bg-gradient-success text-success-foreground hover:opacity-90 shrink-0" onClick={() => markReviewDone(r.id)}>
          <CheckCircle className="h-3.5 w-3.5" />
        </Button>
      )}
      {r.status === "done" && <span className="text-xs font-semibold text-success shrink-0">Feita</span>}
    </div>
  );

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-accent" />
              Plano de Estudo
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Seu cronograma personalizado</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowConfig(true)}>
              <Settings className="h-4 w-4 mr-1" /> Configurar
            </Button>
            <Button size="sm" className="bg-gradient-success text-success-foreground" onClick={() => setShowAddSession(true)}>
              <Plus className="h-4 w-4 mr-1" /> Sessão
            </Button>
          </div>
        </div>

        {/* Countdown Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-accent to-primary rounded-xl p-4 text-primary-foreground mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">Faltam para a prova</p>
              <p className="text-2xl font-extrabold">{daysUntilExam !== null ? `${daysUntilExam} dias` : "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">Meta semanal</p>
              <p className="text-lg font-bold">{planSettings.hours_per_week}h / semana</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <div className="flex-1 bg-white/20 rounded-lg p-2 text-center">
              <p className="text-xs opacity-80">Sessões hoje</p>
              <p className="font-bold">{todaySessions.length}</p>
            </div>
            <div className="flex-1 bg-white/20 rounded-lg p-2 text-center">
              <p className="text-xs opacity-80">Concluídas</p>
              <p className="font-bold">{completedToday}</p>
            </div>
            <div className="flex-1 bg-white/20 rounded-lg p-2 text-center">
              <p className="text-xs opacity-80">Esta semana</p>
              <p className="font-bold">{totalWeek}</p>
            </div>
          </div>
        </motion.div>

        {/* View Toggle */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 mb-6 w-fit">
          {views.map((v) => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                activeView === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-card rounded-xl p-8 text-center border border-border">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
            <p className="text-muted-foreground text-sm">Carregando...</p>
          </div>
        ) : (
          <>
            {/* HOJE */}
            {activeView === "Hoje" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {todaySessions.length === 0 && todayReviews.length === 0 ? (
                  <div className="bg-card rounded-xl p-8 text-center border border-border">
                    <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhuma sessão para hoje.</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">Configure seu plano ou adicione uma sessão.</p>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" onClick={() => setShowConfig(true)}>
                        <Zap className="h-4 w-4 mr-1" /> Gerar Plano
                      </Button>
                      <Button className="bg-gradient-success text-success-foreground" onClick={() => setShowAddSession(true)}>
                        <Plus className="h-4 w-4 mr-1" /> Adicionar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {todaySessions.map(renderSessionCard)}
                    {todayReviews.length > 0 && (
                      <>
                        <h3 className="text-sm font-bold text-foreground mt-4 mb-1">Revisões</h3>
                        {todayReviews.map(renderReviewCard)}
                      </>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* SEMANA */}
            {activeView === "Semana" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="bg-card rounded-xl p-5 shadow-card border border-border">
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {weekData.map((wd, i) => (
                      <div key={i} className="text-center">
                        <div className="text-xs text-muted-foreground mb-2">{weekDayLabels[i]}</div>
                        <div
                          className={`h-14 sm:h-16 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                            wd.total > 0 && wd.done === wd.total
                              ? "bg-success/10 border border-success/30"
                              : wd.done > 0
                              ? "bg-accent/10 border border-accent/30"
                              : "bg-muted border border-border"
                          }`}
                          onClick={() => {
                            setSelectedDate(wd.day);
                            setActiveView("Calendário");
                            setCalMonth(wd.day);
                          }}
                        >
                          <div className="text-sm font-bold text-foreground">{wd.done}/{wd.total}</div>
                          <div className="text-xs text-muted-foreground">sessões</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* CALENDÁRIO */}
            {activeView === "Calendário" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-card rounded-xl p-5 shadow-card border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="sm" onClick={() => setCalMonth(subMonths(calMonth, 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-sm font-bold text-foreground capitalize">
                      {format(calMonth, "MMMM yyyy", { locale: ptBR })}
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => setCalMonth(addMonths(calMonth, 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
                      <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calDays.map((day) => {
                      const dayStr = format(day, "yyyy-MM-dd");
                      const daySessions = sessionsByDate[dayStr] || [];
                      const dayReviews = reviewsByDate[dayStr] || [];
                      const hasSessions = daySessions.length > 0;
                      const hasReviews = dayReviews.length > 0;
                      const allDone = hasSessions && daySessions.every((s) => s.status === "done");
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const inMonth = isSameMonth(day, calMonth);

                      return (
                        <button
                          key={dayStr}
                          onClick={() => setSelectedDate(day)}
                          className={`relative h-10 sm:h-12 rounded-lg text-sm font-medium transition-all ${
                            !inMonth ? "text-muted-foreground/40" : "text-foreground"
                          } ${
                            isSelected
                              ? "bg-primary text-primary-foreground ring-2 ring-primary/50"
                              : isToday(day)
                              ? "bg-accent/20 border border-accent/40"
                              : "hover:bg-muted"
                          }`}
                        >
                          {format(day, "d")}
                          {(hasSessions || hasReviews) && inMonth && (
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                              {hasSessions && <span className={`h-1.5 w-1.5 rounded-full ${allDone ? "bg-success" : "bg-primary"}`} />}
                              {hasReviews && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Sessões</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Concluídas</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" /> Revisões</span>
                  </div>
                </div>

                {selectedDate && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <h3 className="text-sm font-bold text-foreground">
                      {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </h3>
                    {selectedSessions.length === 0 && selectedReviews.length === 0 ? (
                      <p className="text-sm text-muted-foreground bg-card rounded-xl p-4 border border-border">
                        Nenhuma atividade neste dia.
                      </p>
                    ) : (
                      <>
                        {selectedSessions.map(renderSessionCard)}
                        {selectedReviews.map(renderReviewCard)}
                      </>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Modal - Adicionar Sessão */}
      {showAddSession && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowAddSession(false)}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card rounded-t-2xl">
              <h3 className="text-lg font-bold text-foreground">Nova Sessão de Estudo</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddSession(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Data</label>
                <input
                  type="date"
                  value={newSession.date}
                  onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Duração (minutos)</label>
                <input
                  type="number"
                  min={15}
                  max={240}
                  step={15}
                  value={newSession.minutes_planned}
                  onChange={(e) => setNewSession({ ...newSession, minutes_planned: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Matéria</label>
                <select
                  value={newSession.subject_id}
                  onChange={(e) => setNewSession({ ...newSession, subject_id: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Selecione a matéria...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <Button
                onClick={addNewSession}
                disabled={!newSession.subject_id}
                className="w-full bg-gradient-success text-success-foreground hover:opacity-90"
              >
                <Save className="h-4 w-4 mr-2" /> Salvar Sessão
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal - Configurações */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowConfig(false)}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card rounded-t-2xl">
              <h3 className="text-lg font-bold text-foreground">Configurar Plano de Estudo</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowConfig(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-6">
              {/* Horas por semana */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Horas por semana</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={2}
                    max={40}
                    value={planSettings.hours_per_week}
                    onChange={(e) => setPlanSettings({ ...planSettings, hours_per_week: Number(e.target.value) })}
                    className="flex-1 accent-primary"
                  />
                  <span className="w-16 text-center py-2 bg-primary/10 text-primary rounded-lg font-bold text-sm">
                    {planSettings.hours_per_week}h
                  </span>
                </div>
              </div>

              {/* Data da prova */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Data prevista da prova</label>
                <input
                  type="date"
                  value={planSettings.exam_date || ""}
                  onChange={(e) => setPlanSettings({ ...planSettings, exam_date: e.target.value || null })}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Dias disponíveis */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Dias disponíveis</label>
                <div className="grid grid-cols-7 gap-1">
                  {dayKeys.map((key, i) => {
                    const enabled = (planSettings.available_days || []).includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleDay(key)}
                        className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                          enabled
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {weekDayLabels[i]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Info */}
              <div className="bg-accent/10 rounded-xl p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div className="text-sm text-foreground">
                  <p className="font-medium">Plano Inteligente</p>
                  <p className="text-muted-foreground text-xs">A Petra distribui os conteúdos automaticamente nos dias que você definir.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Button onClick={generateAutomaticPlan} className="w-full bg-gradient-to-r from-accent to-primary text-primary-foreground">
                  <Zap className="h-4 w-4 mr-2" /> Gerar Plano Automático (14 dias)
                </Button>
                <Button variant="outline" onClick={saveSettings} className="w-full">
                  <Save className="h-4 w-4 mr-2" /> Salvar Configurações
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AppLayout>
  );
}
