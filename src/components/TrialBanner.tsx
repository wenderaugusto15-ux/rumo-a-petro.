import { Clock } from "lucide-react";
import { useAssinatura } from "@/hooks/useAssinatura";
import { useState, useEffect } from "react";

function formatCountdown(trialEndsAt: Date) {
  const now = new Date();
  const diff = trialEndsAt.getTime() - now.getTime();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(`${String(hours).padStart(2, "0")}h`);
  parts.push(`${String(minutes).padStart(2, "0")}min`);
  return parts.join(" ");
}

export default function TrialBanner() {
  const { isTrialActive, isAssinante, trialEndsAt } = useAssinatura();
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    if (!trialEndsAt || !isTrialActive) return;
    setCountdown(formatCountdown(trialEndsAt));
    const interval = setInterval(() => {
      const val = formatCountdown(trialEndsAt);
      setCountdown(val);
    }, 60_000);
    return () => clearInterval(interval);
  }, [trialEndsAt, isTrialActive]);

  if (!isTrialActive || isAssinante || !countdown) return null;

  return (
    <div className="bg-accent/10 border-b border-accent/20 px-4 py-2 text-center text-sm font-medium text-accent flex items-center justify-center gap-2">
      <Clock className="h-4 w-4" />
      <span>Período de teste: {countdown} restantes</span>
    </div>
  );
}
