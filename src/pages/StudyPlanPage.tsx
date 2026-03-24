import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, CheckCircle, Clock, SkipForward, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
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
} from "date-fns";
import { ptBR } from "date-fns/locale";
import ProContentOverlay from "@/components/ProContentOverlay";

type SessionStatus = "done" | "planned" | "skipped";

interface DbSession {
  id: string;
  date: string;
  minutes_planned: number;
  minutes_done: number | null;
  status: SessionStatus;
  subject_id: string | null;
  topic_id: string | null;
  subject_name?: string;
  topic_name?: string;
}

interface DbReview {
  id: string;
  due_date: string;
  status: "pending" | "done";
  subject_id: string | null;
  topic_id: string | null;
  subject_name?: string;
  topic_name?: string;
}

const views = ["Hoje", "Semana", "Calendário"] as const;
const weekDayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function StudyPlanPage() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<typeof views[number]>("Hoje");
  const [sessions, setSessions] = useState<DbSession[]>([]);
  const [reviews, setReviews] = useState<DbReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [subjects, setSubjects] = useState<Record<string, string>>({});
  const [topics, setTopics] = useState<Record<string, string>>({});

  // Fetch subjects & topics for name lookup
  useEffect(() => {
    const fetchLookups = async () => {
      const [subRes, topRes] = await Promise.all([
        supabase.from("subjects").select("id, name"),
        supabase.from("topics").select("id, name"),
      ]);
      if (subRes.data) {
        const map: Record<string, string> = {};
        subRes.data.forEach((s) => (map[s.id] = s.name));
        setSubjects(map);
      }
      if (topRes.data) {
        const map: Record<string, string> = {};
        topRes.data.forEach((t) => (map[t.id] = t.name));
        setTopics(map);
      }
    };
    fetchLookups();
  }, []);

  // Fetch sessions & reviews
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const [sessRes, revRes] = await Promise.all([
        supabase
          .from("study_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: true }),
        supabase
          .from("reviews")
          .select("*")
          .eq("user_id", user.id)
          .order("due_date", { ascending: true }),
      ]);
      if (sessRes.data) setSessions(sessRes.data as DbSession[]);
      if (revRes.data) setReviews(revRes.data as DbReview[]);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const todaySessions = useMemo(
    () => sessions.filter((s) => s.date === todayStr),
    [sessions, todayStr]
  );

  const todayReviews = useMemo(
    () => reviews.filter((r) => r.due_date === todayStr),
    [reviews, todayStr]
  );

  // Week data
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(new Date(), { weekStartsOn: 1 }) });

  const weekData = useMemo(() => {
    return weekDays.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const daySessions = sessions.filter((s) => s.date === dayStr);
      const done = daySessions.filter((s) => s.status === "done").length;
      const total = daySessions.length;
      return { day, done, total };
    });
  }, [sessions, weekDays]);

  // Calendar grid
  const calStart = startOfWeek(startOfMonth(calMonth), { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(calMonth), { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const sessionsByDate = useMemo(() => {
    const map: Record<string, DbSession[]> = {};
    sessions.forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [sessions]);

  const reviewsByDate = useMemo(() => {
    const map: Record<string, DbReview[]> = {};
    reviews.forEach((r) => {
      if (!map[r.due_date]) map[r.due_date] = [];
      map[r.due_date].push(r);
    });
    return map;
  }, [reviews]);

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedSessions = selectedDateStr ? sessionsByDate[selectedDateStr] || [] : [];
  const selectedReviews = selectedDateStr ? reviewsByDate[selectedDateStr] || [] : [];

  const markDone = async (id: string) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status: "done" as SessionStatus } : s)));
    await supabase.from("study_sessions").update({ status: "done" }).eq("id", id);
  };

  const skip = async (id: string) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status: "skipped" as SessionStatus } : s)));
    await supabase.from("study_sessions").update({ status: "skipped" }).eq("id", id);
  };

  const markReviewDone = async (id: string) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: "done" as const } : r)));
    await supabase.from("reviews").update({ status: "done", completed_at: new Date().toISOString() }).eq("id", id);
  };

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
        {s.status === "done" ? (
          <CheckCircle className="h-5 w-5 text-success" />
        ) : (
          <BookOpen className="h-5 w-5 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-foreground truncate">
          {s.subject_id ? subjects[s.subject_id] || "Matéria" : "Sessão"}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {s.topic_id ? topics[s.topic_id] : "Estudo"} · {s.minutes_planned} min
        </div>
      </div>
      {s.status === "planned" && (
        <div className="flex gap-1 shrink-0">
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
      className={`bg-card rounded-xl p-4 shadow-card border border-border flex items-center gap-4 ${
        r.status === "done" ? "opacity-60" : ""
      }`}
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
        r.status === "done" ? "bg-success/10" : "bg-accent/10"
      }`}>
        {r.status === "done" ? (
          <CheckCircle className="h-5 w-5 text-success" />
        ) : (
          <Clock className="h-5 w-5 text-accent" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-foreground truncate">
          Revisão: {r.subject_id ? subjects[r.subject_id] || "Matéria" : "Geral"}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {r.topic_id ? topics[r.topic_id] : "Revisão espaçada"}
        </div>
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-accent" />
              Plano de Estudo
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Seu cronograma personalizado</p>
          </div>
        </div>

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
                    <p className="text-xs text-muted-foreground mt-1">Configure seu plano de estudo para gerar sessões automáticas.</p>
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
                  {/* Month navigation */}
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

                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
                      <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
                    ))}
                  </div>

                  {/* Calendar grid */}
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
                          {/* Dots */}
                          {(hasSessions || hasReviews) && inMonth && (
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                              {hasSessions && (
                                <span className={`h-1.5 w-1.5 rounded-full ${allDone ? "bg-success" : "bg-primary"}`} />
                              )}
                              {hasReviews && (
                                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Sessões</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Concluídas</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" /> Revisões</span>
                  </div>
                </div>

                {/* Selected day details */}
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
    </ProContentOverlay>
    </AppLayout>
  );
}
