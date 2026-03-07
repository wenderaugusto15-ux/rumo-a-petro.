import { motion } from "framer-motion";
import { Check, X, Zap, Crown, Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { getCheckoutUrl } from "@/lib/checkoutLinks";
import { useMetaPixel } from "@/hooks/useMetaPixel";

const plans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "para sempre",
    cta: "Plano atual",
    current: true,
    features: [
      { text: "1 simulado rápido (20 questões)", included: true },
      { text: "Resultado básico do simulado", included: true },
      { text: "Acesso à página de desempenho", included: true },
      { text: "Simulados ilimitados", included: false },
      { text: "+500 questões comentadas", included: false },
      { text: "Simulados completos (60 questões)", included: false },
      { text: "Análise detalhada por matéria", included: false },
      { text: "Plano de estudos personalizado", included: false },
      { text: "Ranking com outros alunos", included: false },
      { text: "Acesso a todas as áreas", included: false },
    ],
  },
  {
    name: "PRO Mensal",
    originalPrice: "R$ 97,00",
    price: "R$ 47,00",
    period: "/mês",
    cta: "Assinar Mensal",
    current: false,
    popular: false,
    checkoutUrl: "https://pay.cakto.com.br/se87fy8_791351",
    features: [
      { text: "Questões ilimitadas", included: true },
      { text: "Simulados ilimitados", included: true },
      { text: "Análises avançadas de desempenho", included: true },
      { text: "Plano automático completo", included: true },
      { text: "Ranking completo", included: true },
      { text: "Revisão espaçada inteligente", included: true },
      { text: "Recomendações personalizadas", included: true },
      { text: "Suporte prioritário", included: true },
    ],
  },
  {
    name: "PRO Semestral",
    originalPrice: "R$ 597,00",
    price: "R$ 297,00",
    period: "/6 meses",
    savings: "Economize R$ 300",
    cta: "Quero garantir minha aprovação",
    current: false,
    popular: true,
    checkoutUrl: "https://pay.cakto.com.br/324ye97_793187",
    features: [
      { text: "Questões ilimitadas", included: true },
      { text: "Simulados ilimitados", included: true },
      { text: "Análises avançadas de desempenho", included: true },
      { text: "Plano automático completo", included: true },
      { text: "Ranking completo", included: true },
      { text: "Revisão espaçada inteligente", included: true },
      { text: "Recomendações personalizadas", included: true },
      { text: "Suporte prioritário", included: true },
    ],
  },
];

export default function UpgradePage() {
  const { user } = useAuth();
  const { trackInitiateCheckout } = useMetaPixel();

  const buildCheckoutUrl = (plan: { checkoutUrl?: string; name: string }) => {
    if (!plan.checkoutUrl) return "";
    const planType = plan.name.includes("Semestral") ? "semestral" : "mensal";
    return getCheckoutUrl(planType as "mensal" | "semestral", user?.id);
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent rounded-full px-4 py-1.5 text-sm font-bold mb-4">
            <Crown className="h-4 w-4" />
            Upgrade PRO
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-3">
            Invista na sua <span className="text-accent">aprovação</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Candidatos PRO têm 3x mais chances de atingir a nota de corte. Desbloqueie todo o potencial da plataforma.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className={`rounded-2xl p-6 border ${
                plan.current
                  ? "bg-card border-border shadow-card"
                  : plan.popular
                    ? "bg-card border-accent shadow-card-hover ring-2 ring-accent/30 relative"
                    : "bg-card border-border shadow-card-hover relative"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-4 bg-gradient-cta text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">
                  Melhor custo-benefício
                </div>
              )}
              {plan.savings && (
                <div className="absolute -top-3 right-4 bg-success text-white text-xs font-bold px-3 py-1 rounded-full">
                  {plan.savings}
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-foreground mb-1">{plan.name}</h3>
                {plan.originalPrice && (
                  <div className="text-base font-semibold text-destructive line-through mb-1">
                    De {plan.originalPrice}
                  </div>
                )}
                <div className="flex items-baseline justify-center gap-1">
                  <span className={`text-3xl font-black uppercase ${plan.originalPrice ? "text-success" : "text-foreground"}`}>
                    {plan.originalPrice ? `POR ${plan.price}` : plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-2 text-sm">
                    {f.included ? (
                      <Check className="h-4 w-4 text-success shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={f.included ? "text-foreground" : "text-muted-foreground/50"}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full text-sm leading-tight py-3 h-auto whitespace-normal ${
                  plan.current
                    ? "bg-muted text-muted-foreground cursor-default"
                    : "bg-gradient-cta text-accent-foreground shadow-cta hover:opacity-90 animate-pulse-glow"
                }`}
                disabled={plan.current}
                onClick={() => {
                  if (!plan.current && plan.checkoutUrl) {
                    trackInitiateCheckout({ plan: plan.name });
                    window.open(buildCheckoutUrl(plan), "_blank");
                  }
                }}
              >
                {plan.cta}
                {!plan.current && <ChevronRight className="ml-1 h-4 w-4 shrink-0" />}
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            Cancele a qualquer momento · Sem compromisso
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
