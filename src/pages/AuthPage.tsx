import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, User, Eye, EyeOff, ChevronRight, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const benefits = [
  "Questões no padrão Cesgranrio com explicação",
  "Simulados com cronômetro real",
  "Plano de estudos personalizado",
  "Análise inteligente de desempenho",
  "Sistema de XP, medalhas e ranking",
];

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isSignup, setIsSignup] = useState(searchParams.get("signup") === "true");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      // Check if user has completed onboarding (has track_id)
      supabase
        .from("profiles")
        .select("track_id")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.track_id) {
            navigate("/app", { replace: true });
          } else {
            navigate("/app/onboarding", { replace: true });
          }
        });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;
        toast({
          title: "Conta criada! ✉️",
          description: "Verifique seu email para confirmar o cadastro.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Algo deu errado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left - Benefits (desktop only) */}
      <div className="hidden lg:flex flex-col justify-center flex-1 bg-gradient-hero p-12 xl:p-16">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="h-10 w-10 rounded-xl bg-gradient-cta flex items-center justify-center">
              <Zap className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="font-extrabold text-xl text-primary-foreground">Rumo à Petrobras</span>
          </Link>

          <h1 className="text-4xl font-black text-primary-foreground mb-4 leading-tight">
            Sua aprovação começa com <span className="text-accent">uma decisão.</span>
          </h1>
          <p className="text-lg text-primary-foreground/70 mb-8">
            Crie sua conta e tenha acesso imediato à plataforma de preparação mais completa para o concurso Petrobras.
          </p>

          <div className="space-y-4">
            {benefits.map((b, i) => (
              <motion.div
                key={b}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 text-primary-foreground/80"
              >
                <CheckCircle className="h-5 w-5 text-success shrink-0" />
                <span>{b}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-gradient-cta flex items-center justify-center">
              <Zap className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="font-extrabold text-lg text-foreground">Rumo à Petrobras</span>
          </Link>

          <h2 className="text-2xl font-extrabold text-foreground mb-2">
            {isSignup ? "Crie sua conta gratuita" : "Acesse sua conta"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {isSignup ? "Comece sua preparação de alta performance agora." : "Continue sua preparação de onde parou."}
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="name" placeholder="Seu nome" className="pl-10" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="seu@email.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password">Senha</Label>
                {!isSignup && (
                   <button type="button" onClick={() => setForgotMode(true)} className="text-xs text-accent hover:underline">
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full bg-gradient-cta text-accent-foreground shadow-cta hover:opacity-90 transition-opacity"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isSignup ? "Criar minha conta" : "Entrar"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {/* Forgot password modal */}
          {forgotMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={() => setForgotMode(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-card rounded-xl p-6 w-full max-w-sm shadow-xl space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-foreground">Recuperar senha</h3>
                <p className="text-sm text-muted-foreground">Informe seu email para receber o link de redefinição.</p>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setForgotMode(false)}>Cancelar</Button>
                  <Button
                    className="flex-1 bg-gradient-cta text-accent-foreground"
                    disabled={forgotLoading || !email}
                    onClick={async () => {
                      setForgotLoading(true);
                      try {
                        const { error } = await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}/reset-password`,
                        });
                        if (error) throw error;
                        toast({ title: "Email enviado! ✉️", description: "Verifique sua caixa de entrada." });
                        setForgotMode(false);
                      } catch (err: any) {
                        toast({ title: "Erro", description: err.message, variant: "destructive" });
                      } finally {
                        setForgotLoading(false);
                      }
                    }}
                  >
                    {forgotLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? (
              <>
                Já tem uma conta?{" "}
                <button onClick={() => setIsSignup(false)} className="text-accent font-semibold hover:underline">
                  Entrar
                </button>
              </>
            ) : (
              <>
                Não tem uma conta?{" "}
                <button onClick={() => setIsSignup(true)} className="text-accent font-semibold hover:underline">
                  Criar conta gratuita
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
