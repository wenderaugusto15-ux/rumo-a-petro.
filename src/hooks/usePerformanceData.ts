import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SubjectPerformance {
  subjectId: string;
  subject: string;
  acerto: number;
  questoes: number;
}

export interface PerformanceData {
  totalQuestions: number;
  overallAccuracy: number;
  avgTimeSeconds: number;
  streakDays: number;
  subjectData: SubjectPerformance[];
  strengths: { subject: string; rate: string; trend: string }[];
  weaknesses: { subject: string; rate: string; tip: string }[];
}

async function fetchPerformanceData(userId: string): Promise<PerformanceData> {
  // Fetch question_attempts (prática avulsa)
  const { data: attempts } = await supabase
    .from("question_attempts")
    .select("is_correct, attempted_at, time_spent_seconds, question_id, questions(subject_id, subjects(name))")
    .eq("user_id", userId);

  // Fetch mock_exam_answers (simulados)
  const { data: mockExams } = await supabase
    .from("mock_exams")
    .select("id, started_at")
    .eq("user_id", userId);

  let mockAnswers: any[] = [];
  if (mockExams && mockExams.length > 0) {
    const examIds = mockExams.map(e => e.id);
    const { data: answers } = await supabase
      .from("mock_exam_answers")
      .select("is_correct, time_spent_seconds, question_id, mock_exam_id, questions(subject_id, subjects(name))")
      .in("mock_exam_id", examIds);

    if (answers) {
      const examDateMap = Object.fromEntries(mockExams.map(e => [e.id, e.started_at]));
      mockAnswers = answers.map(a => ({
        ...a,
        attempted_at: examDateMap[a.mock_exam_id] || new Date().toISOString(),
      }));
    }
  }

  // Deduplicar: se a mesma questão aparece em ambos, preferir question_attempts
  const attemptQuestionIds = new Set((attempts || []).map(a => a.question_id));
  const uniqueMockAnswers = mockAnswers.filter(a => !attemptQuestionIds.has(a.question_id));

  const allAttempts = [...(attempts || []), ...uniqueMockAnswers];
  const totalQuestions = allAttempts.length;

  // Overall accuracy
  const correctCount = allAttempts.filter(a => a.is_correct).length;
  const overallAccuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Average time per question
  const timesWithValue = allAttempts.filter(a => a.time_spent_seconds && a.time_spent_seconds > 0);
  const avgTimeSeconds = timesWithValue.length > 0
    ? Math.round(timesWithValue.reduce((s, a) => s + (a.time_spent_seconds || 0), 0) / timesWithValue.length)
    : 0;

  // Streak: consecutive days with at least one attempt
  const attemptDates = [...new Set(allAttempts.map(a => a.attempted_at.split("T")[0]))].sort().reverse();
  let streakDays = 0;
  const today = new Date().toISOString().split("T")[0];
  let checkDate = new Date();
  if (attemptDates[0] !== today) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  for (const _ of attemptDates) {
    const expected = checkDate.toISOString().split("T")[0];
    if (attemptDates.includes(expected)) {
      streakDays++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Per-subject accuracy
  const subjectMap: Record<string, { correct: number; total: number; name: string }> = {};
  for (const a of allAttempts) {
    const q = a.questions as any;
    if (!q?.subjects?.name) continue;
    const sid = q.subject_id;
    const name = q.subjects.name;
    if (!subjectMap[sid]) subjectMap[sid] = { correct: 0, total: 0, name };
    subjectMap[sid].total++;
    if (a.is_correct) subjectMap[sid].correct++;
  }

  const subjectData: SubjectPerformance[] = Object.entries(subjectMap)
    .map(([id, s]) => ({
      subjectId: id,
      subject: s.name.length > 12 ? s.name.substring(0, 12) + "." : s.name,
      acerto: Math.round((s.correct / s.total) * 100),
      questoes: s.total,
    }))
    .sort((a, b) => b.questoes - a.questoes);

  // Last 7 days attempts for trend
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const recentBySubject: Record<string, { correct: number; total: number }> = {};
  const prevBySubject: Record<string, { correct: number; total: number }> = {};

  for (const a of allAttempts) {
    const q = a.questions as any;
    if (!q?.subjects?.name) continue;
    const sid = q.subject_id;
    const date = new Date(a.attempted_at);
    if (date >= sevenDaysAgo) {
      if (!recentBySubject[sid]) recentBySubject[sid] = { correct: 0, total: 0 };
      recentBySubject[sid].total++;
      if (a.is_correct) recentBySubject[sid].correct++;
    } else if (date >= fourteenDaysAgo) {
      if (!prevBySubject[sid]) prevBySubject[sid] = { correct: 0, total: 0 };
      prevBySubject[sid].total++;
      if (a.is_correct) prevBySubject[sid].correct++;
    }
  }

  // Build strengths & weaknesses
  const ranked = Object.entries(subjectMap)
    .filter(([, s]) => s.total >= 3)
    .map(([id, s]) => {
      const acc = Math.round((s.correct / s.total) * 100);
      const recentAcc = recentBySubject[id]?.total
        ? Math.round((recentBySubject[id].correct / recentBySubject[id].total) * 100)
        : acc;
      const prevAcc = prevBySubject[id]?.total
        ? Math.round((prevBySubject[id].correct / prevBySubject[id].total) * 100)
        : acc;
      const trend = recentAcc - prevAcc;
      return { id, name: s.name, acc, trend };
    })
    .sort((a, b) => b.acc - a.acc);

  const strengths = ranked.slice(0, 2).map(s => ({
    subject: s.name,
    rate: `${s.acc}%`,
    trend: `${s.trend >= 0 ? "+" : ""}${s.trend}%`,
  }));

  const weaknesses = ranked.slice(-2).reverse().map(s => ({
    subject: s.name,
    rate: `${s.acc}%`,
    tip: s.acc < 60 ? "Revisar teoria básica" : "Praticar mais questões",
  }));

  return {
    totalQuestions,
    overallAccuracy,
    avgTimeSeconds,
    streakDays,
    subjectData,
    strengths,
    weaknesses,
  };
}

export function usePerformanceData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["performance", user?.id],
    queryFn: () => fetchPerformanceData(user!.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}
