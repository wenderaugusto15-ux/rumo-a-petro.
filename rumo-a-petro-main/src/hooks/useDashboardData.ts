import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DashboardData {
  userName: string;
  xp: number;
  level: string;
  streak: number;
  overallProgress: number;
  daysUntilExam: number | null;
  weeklyChart: { day: string; acertos: number; questoes: number }[];
  todayMinutes: { done: number; planned: number };
  weekSessions: { done: number; total: number };
  totalQuestionsAnswered: number;
  last7DaysAccuracy: number;
  currentStreak: number; // consecutive correct answers
  weakestSubject: string | null;
  weakestAccuracy: number | null;
  earnedBadgeCodes: string[];
}

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1; // Mon=0
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function fetchDashboardData(userId: string): Promise<DashboardData> {
  // Parallel queries
  const [
    profileRes,
    xpRes,
    examDateRes,
    attemptsRes,
    todaySessionsRes,
    weekSessionsRes,
    badgesRes,
    subjectAccuracyRes,
  ] = await Promise.all([
    supabase.from("profiles").select("name").eq("user_id", userId).single(),
    supabase.from("user_xp").select("xp_total, level_name").eq("user_id", userId).single(),
    supabase.from("study_plan_settings").select("exam_date").eq("user_id", userId).single(),
    supabase.from("question_attempts").select("is_correct, attempted_at").eq("user_id", userId).order("attempted_at", { ascending: false }),
    supabase.from("study_sessions").select("minutes_done, minutes_planned, status").eq("user_id", userId).eq("date", new Date().toISOString().split("T")[0]),
    supabase.from("study_sessions").select("status, date").eq("user_id", userId).gte("date", getStartOfWeek(new Date()).toISOString().split("T")[0]),
    supabase.from("user_badges").select("badge_id, badges(code)").eq("user_id", userId),
    // Get per-subject accuracy for weakest subject recommendation
    supabase.from("question_attempts").select("is_correct, question_id, questions(subject_id, subjects(name))").eq("user_id", userId),
  ]);

  const profile = profileRes.data;
  const xpData = xpRes.data;
  const examDate = examDateRes.data?.exam_date;
  const attempts = attemptsRes.data || [];
  const todaySessions = todaySessionsRes.data || [];
  const weekSessions = weekSessionsRes.data || [];
  const badges = badgesRes.data || [];
  const subjectAttempts = subjectAccuracyRes.data || [];

  // Name
  const userName = profile?.name || "Candidato";

  // XP & Level
  const xp = xpData?.xp_total || 0;
  const level = xpData?.level_name || "Iniciante";

  // Days until exam
  let daysUntilExam: number | null = null;
  if (examDate) {
    const diff = Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    daysUntilExam = diff > 0 ? diff : 0;
  }

  // Streak: consecutive days with at least one attempt
  const attemptDates = [...new Set(attempts.map(a => a.attempted_at.split("T")[0]))].sort().reverse();
  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  let checkDate = new Date();
  // If no attempt today, start from yesterday
  if (attemptDates[0] !== today) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  for (const _ of attemptDates) {
    const expected = checkDate.toISOString().split("T")[0];
    if (attemptDates.includes(expected)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Weekly chart: last 7 days
  const weeklyChart: DashboardData["weeklyChart"] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayAttempts = attempts.filter(a => a.attempted_at.startsWith(dateStr));
    const correct = dayAttempts.filter(a => a.is_correct).length;
    const total = dayAttempts.length;
    weeklyChart.push({
      day: DAY_LABELS[d.getDay()],
      acertos: total > 0 ? Math.round((correct / total) * 100) : 0,
      questoes: total,
    });
  }

  // Today study
  const todayDone = todaySessions.reduce((s, ss) => s + (ss.minutes_done || 0), 0);
  const todayPlanned = todaySessions.reduce((s, ss) => s + ss.minutes_planned, 0) || 45;

  // Week sessions
  const weekDone = weekSessions.filter(s => s.status === "done").length;
  const weekTotal = weekSessions.length || 7;

  // Total questions & last 7 days accuracy
  const totalQuestionsAnswered = attempts.length;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recent = attempts.filter(a => new Date(a.attempted_at) >= sevenDaysAgo);
  const last7DaysAccuracy = recent.length > 0 ? Math.round((recent.filter(a => a.is_correct).length / recent.length) * 100) : 0;

  // Correct answer streak
  let currentStreak = 0;
  for (const a of attempts) {
    if (a.is_correct) currentStreak++;
    else break;
  }

  // Overall progress: simple heuristic based on XP toward 5000 (Aprovado)
  const overallProgress = Math.min(100, Math.round((xp / 5000) * 100));

  // Weakest subject
  let weakestSubject: string | null = null;
  let weakestAccuracy: number | null = null;
  const subjectMap: Record<string, { correct: number; total: number; name: string }> = {};
  for (const a of subjectAttempts) {
    const q = a.questions as any;
    if (!q?.subjects?.name) continue;
    const name = q.subjects.name;
    const sid = q.subject_id;
    if (!subjectMap[sid]) subjectMap[sid] = { correct: 0, total: 0, name };
    subjectMap[sid].total++;
    if (a.is_correct) subjectMap[sid].correct++;
  }
  let minAcc = 101;
  for (const s of Object.values(subjectMap)) {
    if (s.total >= 3) { // minimum 3 attempts
      const acc = Math.round((s.correct / s.total) * 100);
      if (acc < minAcc) {
        minAcc = acc;
        weakestSubject = s.name;
        weakestAccuracy = acc;
      }
    }
  }

  // Badges
  const earnedBadgeCodes = badges.map((b: any) => b.badges?.code).filter(Boolean);

  return {
    userName, xp, level, streak, overallProgress, daysUntilExam,
    weeklyChart, todayMinutes: { done: todayDone, planned: todayPlanned },
    weekSessions: { done: weekDone, total: weekTotal },
    totalQuestionsAnswered, last7DaysAccuracy, currentStreak,
    weakestSubject, weakestAccuracy, earnedBadgeCodes,
  };
}

export function useDashboardData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: () => fetchDashboardData(user!.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}
