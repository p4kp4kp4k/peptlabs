import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PlanLink {
  plan_id: string;
  checkout_url: string;
  is_active: boolean;
  price: number;
}

function formatPrice(value: number) {
  const intPart = Math.floor(value);
  const cents = Math.round((value - intPart) * 100);
  return {
    main: `R$ ${intPart}`,
    cents: cents > 0 ? `,${cents.toString().padStart(2, "0")}` : "",
    display: cents > 0
      ? `R$ ${intPart},${cents.toString().padStart(2, "0")}`
      : `R$ ${intPart}`,
  };
}

export function usePlanPrices() {
  const { data: planLinks = [] } = useQuery({
    queryKey: ["plan-links"],
    queryFn: async () => {
      const { data } = await supabase.from("plan_links").select("*");
      return (data ?? []) as PlanLink[];
    },
    staleTime: 60_000,
  });

  const getLink = (planId: string) => {
    const link = planLinks.find((l) => l.plan_id === planId && l.is_active && l.checkout_url);
    return link?.checkout_url ?? null;
  };

  const getPrice = (planId: string) => {
    const link = planLinks.find((l) => l.plan_id === planId && l.is_active && l.price > 0);
    return link?.price ?? null;
  };

  const proPrice = getPrice("pro_monthly");
  const lifetimePrice = getPrice("pro_lifetime");

  // Formatted display values
  const proDisplay = proPrice ? formatPrice(proPrice) : { main: "R$ 59", cents: ",90", display: "R$ 59,90" };
  const lifetimeDisplay = lifetimePrice ? formatPrice(lifetimePrice) : { main: "R$ 397", cents: "", display: "R$ 397" };

  const originalLifetimePrice = lifetimePrice ? lifetimePrice * 2 : 794;
  const originalLifetimeDisplay = `R$ ${Math.floor(originalLifetimePrice)}`;

  const installments = lifetimePrice
    ? `ou 12x de R$ ${(lifetimePrice / 12).toFixed(2).replace(".", ",")} no cartão`
    : "ou 12x de R$ 41,06 no cartão";

  const annualEquiv = proPrice
    ? `Equivale a R$ ${(proPrice * 12).toFixed(2).replace(".", ",")} por ano`
    : "Equivale a R$ 718,80 por ano";

  const savings = proPrice && lifetimePrice && (proPrice * 12 - lifetimePrice) > 0
    ? `Economize R$ ${(proPrice * 12 - lifetimePrice).toFixed(2).replace(".", ",")} vs mensal no 1º ano`
    : "Economize R$ 321,80 vs mensal no 1º ano";

  const savingsFull = proPrice && lifetimePrice && (proPrice * 12 - lifetimePrice) > 0
    ? `Você economiza R$ ${(proPrice * 12 - lifetimePrice).toFixed(2).replace(".", ",")} comparado ao plano mensal no 1º ano.`
    : "Você economiza R$ 321,80 comparado ao plano mensal no 1º ano.";

  return {
    planLinks,
    getLink,
    getPrice,
    proPrice,
    lifetimePrice,
    proDisplay,
    lifetimeDisplay,
    originalLifetimeDisplay,
    installments,
    annualEquiv,
    savings,
    savingsFull,
  };
}
