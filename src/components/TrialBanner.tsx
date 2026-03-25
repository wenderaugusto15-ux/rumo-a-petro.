import { Clock } from "lucide-react";
import { useAssinatura } from "@/hooks/useAssinatura";

export default function TrialBanner() {
  const { isTrialActive, trialDaysLeft, isAssinante } = useAssinatura();

  if (!isTrialActive || isAssinante) return null;

  return (
    <div className="bg-accent/10 border-b border-accent/20 px-4 py-2 text-center text-sm font-medium text-accent flex items-center justify-center gap-2">
      <Clock className="h-4 w-4" />
      <span>
        Período de teste: {trialDaysLeft} {trialDaysLeft === 1 ? "dia restante" : "dias restantes"}
      </span>
    </div>
  );
}
