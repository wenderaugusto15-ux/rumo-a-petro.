import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Target, Clock, TrendingUp, Award, Users, BookOpen,
  ChevronRight, Star, Zap, CheckCircle, HelpCircle, ChevronDown,
  BarChart3, Shield, Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import heroImage from "@/assets/hero-petrobras.jpg";

// Versão atualizada em 23/03/2026

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const }
  }),
};

const authorityCards = [
  { icon: Users, title: "+1.000 vagas", desc: "previstas no edital" },
  { icon: TrendingUp, title: "Até R$ 15 mil", desc: "salário inicial" },
  { icon: Shield, title: "Banca definida", desc: "Fundação Cesgranrio" },
  { icon: BarChart3, title: "Método com dados", desc: "baseado em análises reais" },
];

const avatarColors = [
  "bg-accent", "bg-success", "bg-primary", "bg-destructive", "hsl(270,60%,50%)", "hsl(200,70%,45%)"
];

const testimonials = [
  { name: "Lucas M.", age: 27, city: "Rio de Janeiro", rating: 5, role: "Técnico de Operação", text: "Em 4 meses de estudo focado, fui de 45% para 82% nos simulados. A plataforma mostrou exatamente onde eu precisava melhorar." },
  { name: "Ana C.", age: 31, city: "Salvador", rating: 5, role: "Eng. de Processamento", text: "O cronograma automático mudou minha preparação. Nunca mais perdi tempo decidindo o que estudar." },
  { name: "Pedro R.", age: 24, city: "Curitiba", rating: 5, role: "Analista de Sistemas", text: "As questões no padrão Cesgranrio fizeram toda a diferença. No dia da prova, eu já conhecia o estilo de cobrança." },
  { name: "Mariana S.", age: 29, city: "Belo Horizonte", rating: 4, role: "Administradora", text: "A gamificação me manteve motivada nos dias difíceis. A sequência de 30 dias seguidos foi minha maior conquista antes da aprovação." },
  { name: "Rafael T.", age: 33, city: "Recife", rating: 5, role: "Eng. de Petróleo", text: "Engenheiro aprovado. O plano de estudo personalizado para minha trilha foi essencial para otimizar meu tempo." },
  { name: "Camila F.", age: 26, city: "São Paulo", rating: 5, role: "Técnica de Segurança", text: "Comecei com medo do concurso. As análises de desempenho me mostraram que eu estava no caminho certo." },
];

const faqs = [
  { q: "Isso serve para qualquer cargo da Petrobras?", a: "Sim! Temos trilhas específicas para cada área (Engenharia, TI, Administrativo, Técnico) além de uma base geral para quem ainda não decidiu. Todo o conteúdo segue o padrão Cesgranrio." },
  { q: "Tem banco de questões?", a: "Sim. Nosso banco cresce constantemente com questões no estilo Cesgranrio, todas com gabarito comentado e classificação por matéria, assunto e dificuldade." },
  { q: "O que é 'padrão Cesgranrio'?", a: "A Cesgranrio tem um estilo próprio de elaborar questões — enunciados contextualizados, alternativas com pegadinhas sutis e foco em aplicação prática. Treinamos você exatamente para esse padrão." },
  { q: "Posso usar no celular?", a: "Absolutamente. A plataforma é 100% responsiva e otimizada para mobile, para você estudar de qualquer lugar." },
];

const features = [
  { icon: BookOpen, title: "Questões Comentadas", desc: "Banco com questões no padrão Cesgranrio, todas com explicação detalhada." },
  { icon: Clock, title: "Simulados com Cronômetro", desc: "Simule a prova real com tempo e pressão controlados." },
  { icon: Target, title: "Plano Personalizado", desc: "Cronograma gerado automaticamente baseado na sua disponibilidade." },
  { icon: TrendingUp, title: "Análise Inteligente", desc: "Identifique seus pontos fracos e receba recomendações de foco." },
  { icon: Zap, title: "Gamificação", desc: "XP, medalhas e níveis para manter sua motivação alta." },
  { icon: Award, title: "Ranking", desc: "Compare seu desempenho com outros candidatos em tempo real." },
];

// Countdown to exam date
function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const now = new Date().getTime();
      const diff = targetDate.getTime() - now;
      if (diff <= 0) return;
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return timeLeft;
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left font-semibold text-foreground hover:text-accent transition-colors"
      >
        <span className="flex items-center gap-3 text-sm sm:text-base">
          <HelpCircle className="h-5 w-5 text-accent shrink-0" />
          {q}
        </span>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform shrink-0 ml-2 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="pb-5 pl-8 text-muted-foreground leading-relaxed text-sm"
        >
          {a}
        </motion.div>
      )}
    </div>
  );
}

export default function Index() {
  const { user } = useAuth();
  // Target: August 2026
  const examDate = new Date("2026-08-16T09:00:00");
  const countdown = useCountdown(examDate);
  const ctaPath = user ? "/app" : "/cadastro";

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-cta flex items-center justify-center">
              <Zap className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="font-extrabold text-base sm:text-lg text-foreground">Rumo à Petrobras</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <Link to="/app">
                <Button size="sm" className="bg-gradient-cta text-accent-foreground shadow-cta hover:opacity-90 transition-opacity text-xs sm:text-sm">
                  Acessar Plataforma
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-xs sm:text-sm">Entrar</Button>
                </Link>
                <Link to="/cadastro">
                  <Button size="sm" className="bg-gradient-cta text-accent-foreground shadow-cta hover:opacity-90 transition-opacity text-xs sm:text-sm">
                    Criar conta
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-14 sm:pt-16 overflow-hidden">
        {/* Background image with dark overlay for contrast */}
        <div className="absolute inset-0">
          <img src={heroImage} alt="Plataforma de petróleo" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/80 to-primary/95" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <motion.div
            initial="hidden"
            animate="visible"
            className="max-w-3xl"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-accent/20 text-white rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium mb-6 backdrop-blur-sm border border-accent/30">
              <Star className="h-4 w-4 text-accent" />
              Concurso Petrobras 2026 — Preparação inteligente
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
              Seu nome na lista de aprovados da Petrobras{" "}
              <span className="text-accent">começa aqui.</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-base sm:text-xl text-white/80 mb-8 max-w-2xl leading-relaxed">
              Treinamento inteligente focado 100% no padrão Cesgranrio. Questões comentadas, simulados cronometrados, plano personalizado e análise de desempenho — tudo para maximizar suas chances.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link to="/cadastro" className="w-full sm:w-auto">
                <Button size="lg" className="bg-gradient-cta text-accent-foreground shadow-cta hover:opacity-90 transition-all text-lg sm:text-xl font-extrabold px-8 sm:px-10 py-6 sm:py-7 animate-pulse-glow w-full uppercase tracking-wide">
                  COMEÇAR AGORA
                  <ChevronRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} custom={4} className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-white/60 text-sm">
              <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-success" /> Comece grátis</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-success" /> Sem cartão de crédito</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Countdown */}
      <section className="bg-primary py-4 sm:py-5 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2 text-accent font-bold text-sm sm:text-base">
              <Flame className="h-5 w-5 animate-pulse" />
              <span>Prova prevista em Agosto 2026</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {[
                { value: countdown.days, label: "dias" },
                { value: countdown.hours, label: "hrs" },
                { value: countdown.minutes, label: "min" },
                { value: countdown.seconds, label: "seg" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center bg-primary-foreground/10 rounded-lg px-3 py-1.5 min-w-[52px]">
                  <span className="text-lg sm:text-xl font-black text-white tabular-nums">{String(item.value).padStart(2, '0')}</span>
                  <span className="text-[10px] text-white/50 uppercase tracking-wider">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Authority Cards */}
      <section className="py-12 sm:py-16 lg:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {authorityCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="bg-card rounded-xl p-4 sm:p-6 shadow-card hover:shadow-card-hover transition-shadow border border-border text-center"
              >
                <card.icon className="h-6 w-6 sm:h-8 sm:w-8 text-accent mx-auto mb-2 sm:mb-3" />
                <div className="text-lg sm:text-2xl font-extrabold text-foreground">{card.title}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">{card.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="como-funciona" className="py-12 sm:py-16 lg:py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-8 sm:mb-12">
            <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground mb-3 sm:mb-4">
              Tudo que você precisa para ser <span className="text-accent">aprovado</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Uma plataforma completa que transforma sua preparação em um processo estratégico, mensurável e motivador.
            </motion.p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="bg-card rounded-xl p-5 sm:p-6 shadow-card hover:shadow-card-hover transition-all border border-border group hover:-translate-y-1"
              >
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-accent/20 transition-colors">
                  <f.icon className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-1 sm:mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Emotional Section */}
      <section className="py-12 sm:py-16 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/85 to-primary/95" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-3xl lg:text-5xl font-black text-white mb-4 sm:mb-6 leading-tight">
              Não é sobre passar em um concurso.{" "}
              <span className="text-accent">É sobre mudar sua vida.</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-base sm:text-xl text-white/70 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Estabilidade, salário acima da média e propósito. A aprovação na Petrobras é o primeiro passo para a carreira dos seus sonhos.
            </motion.p>
            <motion.div variants={fadeUp} custom={2}>
              <Link to="/cadastro">
                <Button size="lg" className="bg-gradient-cta text-accent-foreground shadow-cta hover:opacity-90 transition-all text-lg sm:text-xl font-extrabold px-8 sm:px-10 py-6 sm:py-7 animate-pulse-glow uppercase tracking-wide">
                  COMEÇAR AGORA
                  <ChevronRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-16 lg:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-8 sm:mb-12">
            <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground mb-4">
              Quem treina com método, <span className="text-accent">aprova</span>
            </motion.h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="bg-card rounded-xl p-5 sm:p-6 shadow-card border border-border hover:shadow-card-hover transition-shadow"
              >
                <div className="flex items-center gap-1 mb-3 sm:mb-4">
                  {[1,2,3,4,5].map(s => (
                    <Star
                      key={s}
                      className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${s <= t.rating ? "fill-accent text-accent" : "text-border"}`}
                    />
                  ))}
                </div>
                <p className="text-foreground text-xs sm:text-sm leading-relaxed mb-4 sm:mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${["bg-accent","bg-success","bg-primary","bg-destructive","bg-primary","bg-accent"][i]}`}>
                    {t.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role} · {t.city}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-16 lg:py-24 bg-muted/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-8 sm:mb-12">
            <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground mb-4">
              Perguntas frequentes
            </motion.h2>
          </motion.div>
          <div className="bg-card rounded-xl shadow-card border border-border p-4 sm:p-6">
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-16 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4 sm:mb-6">
              Cada dia conta. Comece sua preparação <span className="text-accent">agora.</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-sm sm:text-lg text-white/70 mb-6 sm:mb-8">
              Crie sua conta gratuita e tenha acesso imediato a questões, simulados e seu plano de estudos personalizado.
            </motion.p>
            <motion.div variants={fadeUp} custom={2}>
              <Link to={ctaPath}>
                <Button size="lg" className="bg-gradient-cta text-accent-foreground shadow-cta hover:opacity-90 text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 animate-pulse-glow">
                  {user ? "Acessar Plataforma" : "Criar minha conta gratuita"}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary py-6 sm:py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
            <div className="h-6 w-6 rounded bg-gradient-cta flex items-center justify-center">
              <Zap className="h-3 w-3 text-accent-foreground" />
            </div>
            <span className="font-bold text-white text-sm">Rumo à Petrobras 2026</span>
          </div>
          <p className="text-white/50 text-xs">
            © 2026 Rumo à Petrobras. Plataforma independente de preparação para concursos.
          </p>
        </div>
      </footer>
    </div>
  );
}
