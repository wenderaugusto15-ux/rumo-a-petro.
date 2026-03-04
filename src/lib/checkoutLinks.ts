export const CHECKOUT_URLS = {
  mensal: "https://pay.cakto.com.br/se87fy8_791351",
  semestral: "https://pay.cakto.com.br/324ye97_793187",
} as const;

export function getCheckoutUrl(plan: keyof typeof CHECKOUT_URLS, userId?: string): string {
  const base = CHECKOUT_URLS[plan];
  if (!userId) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}client_ref=${userId}&metadata[user_id]=${userId}&metadata[plan_type]=${plan}`;
}

export function openCheckout(plan: keyof typeof CHECKOUT_URLS, userId?: string) {
  window.open(getCheckoutUrl(plan, userId), "_blank");
}
