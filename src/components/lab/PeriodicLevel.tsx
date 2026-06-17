import { cn } from "@/lib/utils";

type Cell = { symbol: string; name: string; visits: number; discount: number };

export function PeriodicLevel({ current, visits, settings }: { current: string; visits: number; settings: any }) {
  const cells: Cell[] = [
    { symbol: "Cu", name: "Bronce", visits: settings.bronze_visits, discount: settings.bronze_discount },
    { symbol: "Ag", name: "Plata", visits: settings.silver_visits, discount: settings.silver_discount },
    { symbol: "Au", name: "Oro", visits: settings.gold_visits, discount: settings.gold_discount },
    { symbol: "Hs", name: "Heisenberg", visits: settings.heisenberg_visits, discount: settings.heisenberg_discount },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {cells.map((c) => {
        const active = c.symbol === current;
        const reached = visits >= c.visits;
        return (
          <div
            key={c.symbol}
            className={cn(
              "hex-card metal-panel p-2 text-center transition-all",
              active && "ring-2 ring-[var(--crystal)]",
              active && c.symbol === "Hs" && "shadow-[0_0_24px_var(--crystal)]",
              !reached && "opacity-50",
            )}
          >
            <div className="text-[10px] text-muted-foreground">{c.visits}+</div>
            <div className={cn("display text-3xl leading-none", active ? "text-crystal" : "text-foreground")}>{c.symbol}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.name}</div>
            <div className="text-[11px] text-hazmat font-semibold">{c.discount}%</div>
          </div>
        );
      })}
    </div>
  );
}