import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { Loader2 } from "lucide-react";

// Lazy loaded pages
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const QuestionsPage = lazy(() => import("./pages/QuestionsPage"));
const MockExamsPage = lazy(() => import("./pages/MockExamsPage"));
const MockExamTakingPage = lazy(() => import("./pages/MockExamTakingPage"));
const PerformancePage = lazy(() => import("./pages/PerformancePage"));
const StudyPlanPage = lazy(() => import("./pages/StudyPlanPage"));
const UpgradePage = lazy(() => import("./pages/UpgradePage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminQuestionsPage = lazy(() => import("./pages/admin/AdminQuestionsPage"));
const AdminSubjectsPage = lazy(() => import("./pages/admin/AdminSubjectsPage"));
const AdminTracksPage = lazy(() => import("./pages/admin/AdminTracksPage"));
const AdminTestimonialsPage = lazy(() => import("./pages/admin/AdminTestimonialsPage"));
const AdminConfigPage = lazy(() => import("./pages/admin/AdminConfigPage"));
const AdminPlansPage = lazy(() => import("./pages/admin/AdminPlansPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/app/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
                <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/app/questoes" element={<ProtectedRoute><QuestionsPage /></ProtectedRoute>} />
                <Route path="/app/simulados" element={<ProtectedRoute><MockExamsPage /></ProtectedRoute>} />
                <Route path="/app/simulado/:examId" element={<ProtectedRoute><MockExamTakingPage /></ProtectedRoute>} />
                <Route path="/app/desempenho" element={<ProtectedRoute><PerformancePage /></ProtectedRoute>} />
                <Route path="/app/plano" element={<ProtectedRoute><StudyPlanPage /></ProtectedRoute>} />
                <Route path="/app/upgrade" element={<ProtectedRoute><UpgradePage /></ProtectedRoute>} />
                <Route path="/app/perfil" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/questoes" element={<AdminRoute><AdminQuestionsPage /></AdminRoute>} />
                <Route path="/admin/materias" element={<AdminRoute><AdminSubjectsPage /></AdminRoute>} />
                <Route path="/admin/trilhas" element={<AdminRoute><AdminTracksPage /></AdminRoute>} />
                <Route path="/admin/depoimentos" element={<AdminRoute><AdminTestimonialsPage /></AdminRoute>} />
                <Route path="/admin/config" element={<AdminRoute><AdminConfigPage /></AdminRoute>} />
                <Route path="/admin/planos" element={<AdminRoute><AdminPlansPage /></AdminRoute>} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
