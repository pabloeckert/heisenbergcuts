export type LoyaltySettings = {
  crystals_per_peso: number;
  crystals_redeem_rate: number;
  expiry_days: number;
  inactivity_grace_days: number;
  bronze_visits: number;
  silver_visits: number;
  gold_visits: number;
  heisenberg_visits: number;
  bronze_discount: number;
  silver_discount: number;
  gold_discount: number;
  heisenberg_discount: number;
};

export type Level = {
  symbol: "Cu" | "Ag" | "Au" | "Hs" | "—";
  name: string;
  discount: number;
  threshold: number;
};

export function levelForVisits(visits: number, s: LoyaltySettings): Level {
  if (visits >= s.heisenberg_visits) return { symbol: "Hs", name: "Heisenberg", discount: s.heisenberg_discount, threshold: s.heisenberg_visits };
  if (visits >= s.gold_visits) return { symbol: "Au", name: "Oro", discount: s.gold_discount, threshold: s.gold_visits };
  if (visits >= s.silver_visits) return { symbol: "Ag", name: "Plata", discount: s.silver_discount, threshold: s.silver_visits };
  if (visits >= s.bronze_visits) return { symbol: "Cu", name: "Bronce", discount: s.bronze_discount, threshold: s.bronze_visits };
  return { symbol: "—", name: "Sin nivel", discount: 0, threshold: s.bronze_visits };
}

export function clientStatus(client: { crystals_expire_at: string | null; last_visit_at: string | null }, s: LoyaltySettings) {
  if (!client.last_visit_at) return { label: "Nuevo", color: "text-crystal" };
  const expire = client.crystals_expire_at ? new Date(client.crystals_expire_at) : null;
  const last = new Date(client.last_visit_at);
  const daysSince = Math.floor((Date.now() - last.getTime()) / 86400000);
  if (expire && expire.getTime() < Date.now()) return { label: "Puntos expirados", color: "text-danger" };
  if (daysSince >= s.inactivity_grace_days) return { label: "En riesgo", color: "text-hazmat" };
  return { label: "Activo", color: "text-toxic" };
}

export function effectiveCrystals(c: { crystals_balance: number; crystals_expire_at: string | null }) {
  if (c.crystals_expire_at && new Date(c.crystals_expire_at).getTime() < Date.now()) return 0;
  return c.crystals_balance;
}

export function fmtMoney(n: number | null | undefined) {
  const v = Number(n ?? 0);
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDateTime(d: string | Date | null | undefined) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleString();
}