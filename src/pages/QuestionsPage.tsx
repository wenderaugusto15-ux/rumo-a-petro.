import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Star, CheckCircle, XCircle,
  ChevronRight, Heart, RotateCcw, Flag, Loader2, Crown, Lock, Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import ProContentOverlay from "@/components/ProContentOverlay";

type Question = Omit<Tables<"questions">, "correct_option" | "explanation">;

interface Subject { id: string; name: string; is_general: boolean; }
interface Topic { id: string; name: string; subject_id: string; }

const LEVEL_MAP: Record<string, string> = { easy: "Fácil", medium: "Médio", hard: "Difícil" };
const LEVEL_STYLE: Record<string, string> = {
  easy: "bg-success/10 text-success",
  medium: "bg-accent/10 text-accent",
  hard: "bg-destructive/10 text-destructive",
};

export default function QuestionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterArea, setFilterArea] = useState<string | null>(null); // "general" | "specific" | null
  const [filterSubject, setFilterSubject] = useState<string | null>(null);
  const [filterTopic, setFilterTopic] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string | null>(null);

  // Answer state
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [answerResult, setAnswerResult] = useState<{ is_correct: boolean; correct_option: string; explanation: string } | null>(null);
  const startTime = useRef(Date.now());

  // Daily counter
  const [dailyCount, setDailyCount] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(20);

  // Load subjects & topics
  useEffect(() => {
    Promise.all([
      supabase.from("subjects").select("id, name, is_general").eq("active", true).order("name"),
      supabase.from("topics").select("id, name, subject_id").eq("active", true).order("name"),
    ]).then(([subRes, topRes]) => {
      if (subRes.data) setSubjects(subRes.data);
      if (topRes.data) setTopics(topRes.data);
    });
  }, []);

  // Load daily counter
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    supabase
      .from("usage_counters")
      .select("questions_answered")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setDailyCount(data.questions_answered);
      });

    supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          supabase
            .from("usage_limits")
            .select("daily_questions_limit")
            .eq("plan", data.plan)
            .maybeSingle()
            .then(({ data: limits }) => {
              if (limits) setDailyLimit(limits.daily_questions_limit);
            });
        }
      });
  }, [user]);

  // Load questions based on filters
  const loadQuestions = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("questions")
      .select("id, statement, option_a, option_b, option_c, option_d, option_e, subject_id, topic_id, level, tags, active, created_at")
      .eq("active", true)
      .limit(50);

    if (filterSubject) {
      query = query.eq("subject_id", filterSubject);
    } else if (filterArea) {
      const areaSubjectIds = subjects
        .filter((s) => (filterArea === "general" ? s.is_general : !s.is_general))
        .map((s) => s.id);
      if (areaSubjectIds.length > 0) query = query.in("subject_id", areaSubjectIds);
    }
    if (filterTopic) query = query.eq("topic_id", filterTopic);
    if (filterLevel) query = query.eq("level", filterLevel as "easy" | "medium" | "hard");

    const { data } = await query;
    if (data) {
      // Shuffle
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
      setCurrentIndex(0);
      resetAnswer();
    }
    setLoading(false);
  }, [filterSubject, filterTopic, filterLevel, filterArea, subjects]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Load favorite status for current question
  useEffect(() => {
    if (!user || questions.length === 0) return;
    const q = questions[currentIndex];
    if (!q) return;
    supabase
      .from("question_flags")
      .select("is_favorite")
      .eq("user_id", user.id)
      .eq("question_id", q.id)
      .maybeSingle()
      .then(({ data }) => {
        setIsFavorite(data?.is_favorite ?? false);
      });
  }, [user, questions, currentIndex]);

  const resetAnswer = () => {
    setSelected(null);
    setAnswered(false);
    setAnswerResult(null);
    setIsFavorite(false);
    startTime.current = Date.now();
  };

  const currentQuestion = questions[currentIndex];

  const handleAnswer = async () => {
    if (!selected || !user || !currentQuestion) return;
    setAnswered(true);
    setSaving(true);

    const timeSpent = Math.round((Date.now() - startTime.current) / 1000);

    try {
      // Check answer via secure RPC
      const { data: result, error: rpcError } = await supabase.rpc("check_answer", {
        _question_id: currentQuestion.id,
        _chosen_option: selected,
      });

      if (rpcError || !result) throw rpcError;

      const checkResult = result as unknown as { is_correct: boolean; correct_option: string; explanation: string };
      setAnswerResult(checkResult);
      const isCorrect = checkResult.is_correct;

      // Record attempt
      await supabase.from("question_attempts").insert({
        user_id: user.id,
        question_id: currentQuestion.id,
        chosen_option: selected,
        is_correct: isCorrect,
        time_spent_seconds: timeSpent,
      });

      // Update daily counter
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("usage_counters")
        .select("id, questions_answered")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("usage_counters")
          .update({ questions_answered: existing.questions_answered + 1 })
          .eq("id", existing.id);
      } else {
        await supabase.from("usage_counters").insert({
          user_id: user.id,
          date: today,
          questions_answered: 1,
        });
      }
      setDailyCount((c) => c + 1);

      // Add XP
      if (isCorrect) {
        await supabase.rpc("add_xp", { _user_id: user.id, _amount: 10 });
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      resetAnswer();
    } else {
      // Reload with new shuffle
      loadQuestions();
    }
  };

  const toggleFavorite = async () => {
    if (!user || !currentQuestion) return;
    const newVal = !isFavorite;
    setIsFavorite(newVal);

    const { data: existing } = await supabase
      .from("question_flags")
      .select("id")
      .eq("user_id", user.id)
      .eq("question_id", currentQuestion.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("question_flags").update({ is_favorite: newVal }).eq("id", existing.id);
    } else {
      await supabase.from("question_flags").insert({
        user_id: user.id,
        question_id: currentQuestion.id,
        is_favorite: newVal,
      });
    }
  };

  const handleReviewLater = async () => {
    if (!user || !currentQuestion) return;
    const { data: existing } = await supabase
      .from("question_flags")
      .select("id")
      .eq("user_id", user.id)
      .eq("question_id", currentQuestion.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("question_flags").update({ review_later: true }).eq("id", existing.id);
    } else {
      await supabase.from("question_flags").insert({
        user_id: user.id,
        question_id: currentQuestion.id,
        review_later: true,
      });
    }
    toast({ title: "Marcada para revisão ✅" });
  };

  const filteredSubjects = filterArea
    ? subjects.filter((s) => (filterArea === "general" ? s.is_general : !s.is_general))
    : subjects;

  const filteredTopics = filterSubject
    ? topics.filter((t) => t.subject_id === filterSubject)
    : [];

  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "";
  const topicName = (id: string | null) => (id ? topics.find((t) => t.id === id)?.name ?? "" : "");

  const options = currentQuestion
    ? [
        { letter: "A", text: currentQuestion.option_a },
        { letter: "B", text: currentQuestion.option_b },
        { letter: "C", text: currentQuestion.option_c },
        { letter: "D", text: currentQuestion.option_d },
        { letter: "E", text: currentQuestion.option_e },
      ]
    : [];

  const isCorrect = answerResult?.is_correct ?? false;

  return (
    <AppLayout>
    <ProContentOverlay featureName="Questões">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-accent" />
              Questões
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Padrão Cesgranrio · Resolva e evolua</p>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{dailyCount}</span>/{dailyLimit === 999999 ? "∞" : dailyLimit} hoje
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          
          {/* Area filter */}
          <Select
            value={filterArea ?? "all"}
            onValueChange={(v) => { setFilterArea(v === "all" ? null : v); setFilterSubject(null); setFilterTopic(null); }}
          >
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as áreas</SelectItem>
              <SelectItem value="general">Gerais</SelectItem>
              <SelectItem value="specific">Específicas</SelectItem>
            </SelectContent>
          </Select>

          {/* Subject filter */}
          <Select
            value={filterSubject ?? "all"}
            onValueChange={(v) => { setFilterSubject(v === "all" ? null : v); setFilterTopic(null); }}
          >
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SelectValue placeholder="Matéria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as matérias</SelectItem>
              {filteredSubjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filterSubject && filteredTopics.length > 0 && (
            <Select
              value={filterTopic ?? "all"}
              onValueChange={(v) => setFilterTopic(v === "all" ? null : v)}
            >
              <SelectTrigger className="w-[180px] h-9 text-xs">
                <SelectValue placeholder="Assunto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os assuntos</SelectItem>
                {filteredTopics.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={filterLevel ?? "all"}
            onValueChange={(v) => setFilterLevel(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue placeholder="Dificuldade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="easy">Fácil</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="hard">Difícil</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading / Empty / Question */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : dailyCount >= dailyLimit && dailyLimit !== 999999 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl shadow-card border border-accent/30 p-8 text-center max-w-lg mx-auto"
          >
            <div className="bg-accent/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-accent" />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-2">Limite diário atingido!</h2>
            <p className="text-muted-foreground mb-6">
              Você respondeu suas <span className="font-bold text-foreground">{dailyLimit} questões</span> gratuitas de hoje. Desbloqueie acesso ilimitado com o plano PRO.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-muted/50 rounded-xl p-4 border border-border">
                <p className="text-2xl font-black text-foreground">R$ 47<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                <p className="text-xs text-muted-foreground mt-1">Mensal</p>
              </div>
              <div className="bg-accent/5 rounded-xl p-4 border border-accent/30 relative">
                <div className="absolute -top-2 right-2 bg-success text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-17%</div>
                <p className="text-2xl font-black text-foreground">R$ 297<span className="text-sm font-normal text-muted-foreground">/sem</span></p>
                <p className="text-xs text-muted-foreground mt-1">Semestral</p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/app/upgrade")}
              className="w-full bg-gradient-cta text-accent-foreground shadow-cta hover:opacity-90 text-base py-6"
              size="lg"
            >
              <Crown className="h-5 w-5 mr-2" />
              Quero ser PRO
            </Button>
            <p className="text-xs text-muted-foreground mt-3">Cancele a qualquer momento · Sem compromisso</p>
          </motion.div>
        ) : !currentQuestion ? (
          <div className="text-center py-20">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-bold text-foreground">Nenhuma questão encontrada</p>
            <p className="text-sm text-muted-foreground">Tente alterar os filtros.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="bg-card rounded-xl shadow-card border border-border overflow-hidden"
            >
              {/* Question Header */}
              <div className="p-4 sm:p-5 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-md">
                      {subjectName(currentQuestion.subject_id)}
                    </span>
                    {currentQuestion.topic_id && (
                      <span className="text-xs text-muted-foreground">
                        {topicName(currentQuestion.topic_id)}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {currentIndex + 1}/{questions.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${LEVEL_STYLE[currentQuestion.level] ?? ""}`}>
                      {LEVEL_MAP[currentQuestion.level] ?? currentQuestion.level}
                    </span>
                    <button onClick={toggleFavorite}>
                      <Heart className={`h-4 w-4 transition-colors ${isFavorite ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Statement */}
              <div className="p-4 sm:p-6">
                <p className="text-foreground leading-relaxed whitespace-pre-line text-sm sm:text-base">
                  {currentQuestion.statement}
                </p>
              </div>

              {/* Options */}
              <div className="px-4 sm:px-6 pb-4 space-y-2">
                {options.map((opt) => {
                  let optStyle = "bg-muted/50 border-border hover:bg-muted";
                  if (answered) {
                    if (opt.letter === answerResult?.correct_option) {
                      optStyle = "bg-success/10 border-success/50 text-foreground";
                    } else if (opt.letter === selected && !isCorrect) {
                      optStyle = "bg-destructive/10 border-destructive/50 text-foreground";
                    } else {
                      optStyle = "bg-muted/30 border-border opacity-60";
                    }
                  } else if (selected === opt.letter) {
                    optStyle = "bg-accent/10 border-accent/50 ring-2 ring-accent/30";
                  }

                  return (
                    <button
                      key={opt.letter}
                      onClick={() => !answered && setSelected(opt.letter)}
                      disabled={answered}
                      className={`w-full flex items-start gap-3 p-3 sm:p-4 rounded-lg border transition-all text-left ${optStyle}`}
                    >
                      <span className="h-7 w-7 rounded-full bg-background border border-border flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {opt.letter}
                      </span>
                      <span className="text-sm sm:text-base">{opt.text}</span>
                      {answered && opt.letter === currentQuestion.correct_option && (
                        <CheckCircle className="h-5 w-5 text-success ml-auto shrink-0 mt-0.5" />
                      )}
                      {answered && opt.letter === selected && !isCorrect && opt.letter !== currentQuestion.correct_option && (
                        <XCircle className="h-5 w-5 text-destructive ml-auto shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="px-4 sm:px-6 pb-4">
                {!answered ? (
                  <Button
                    onClick={handleAnswer}
                    disabled={!selected || saving}
                    className="w-full bg-gradient-cta text-accent-foreground shadow-cta hover:opacity-90"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Responder
                  </Button>
                ) : (
                  <div className="space-y-4">
                    {/* Feedback */}
                    <div className={`p-4 rounded-lg border ${isCorrect ? "bg-success/5 border-success/30" : "bg-destructive/5 border-destructive/30"}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {isCorrect ? (
                          <><CheckCircle className="h-5 w-5 text-success" /><span className="font-bold text-success">Correto! +10 XP</span></>
                        ) : (
                          <><XCircle className="h-5 w-5 text-destructive" /><span className="font-bold text-destructive">Incorreto</span></>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{currentQuestion.explanation}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={handleReviewLater}>
                        <RotateCcw className="h-4 w-4 mr-1" /> Revisar depois
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Flag className="h-4 w-4 mr-1" /> Reportar
                      </Button>
                    </div>
                    <Button onClick={handleNext} className="w-full bg-gradient-cta text-accent-foreground shadow-cta hover:opacity-90">
                      Próxima questão <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </ProContentOverlay>
    </AppLayout>
  );
}
