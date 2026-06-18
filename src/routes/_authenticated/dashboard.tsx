import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HexPanel, PageTitle } from "@/components/lab/AppShell";
import { fmtMoney } from "@/lib/loyalty";
import { Banknote, ArrowRightLeft, Coins, AlertTriangle, TrendingUp, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { ReactNode, SVGProps } from "react";

type Stats = {
  total: number;
  cash: number;
  transfer: number;
  comm: number;
  owner: number;
  count: number;
};
type DaySeries = { day: string; total: number };

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Laboratorio · Heisenberg Cuts" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [series, setSeries] = useState<DaySeries[]>([]);
  const [expiringCount, setExpiringCount] = useState(0);
  const [clientsCount, setClientsCount] = useState(0);

  useEffect(() => {
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data: txs } = await supabase
        .from("transactions")
        .select("total_paid, commission_total, owner_net, payment_method, created_at")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });
      const list = txs ?? [];
      const total = list.reduce((s, t) => s + Number(t.total_paid), 0);
      const cash = list
        .filter((t) => t.payment_method === "cash")
        .reduce((s, t) => s + Number(t.total_paid), 0);
      const transfer = total - cash;
      const comm = list.reduce((s, t) => s + Number(t.commission_total), 0);
      const owner = list.reduce((s, t) => s + Number(t.owner_net), 0);
      setStats({ total, cash, transfer, comm, owner, count: list.length });

      const byDay: Record<string, number> = {};
      list.forEach((t) => {
        const k = new Date(t.created_at).toISOString().slice(5, 10);
        byDay[k] = (byDay[k] ?? 0) + Number(t.total_paid);
      });
      setSeries(Object.entries(byDay).map(([d, v]) => ({ day: d, total: v })));

      const sevenDays = new Date(Date.now() + 7 * 86400000).toISOString();
      const { count: expCount } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .lt("crystals_expire_at", sevenDays)
        .gte("crystals_expire_at", new Date().toISOString());
      setExpiringCount(expCount ?? 0);

      const { count: cCount } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true });
      setClientsCount(cCount ?? 0);
    })();
  }, []);

  return (
    <div>
      <PageTitle subtitle="Últimos 30 días · estado del laboratorio">EL LABORATORIO</PageTitle>

      {expiringCount > 0 && (
        <div className="mb-6 metal-panel hex-card border-l-4 border-l-[var(--hazmat)] p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-hazmat" />
          <div className="text-sm">
            <span className="text-hazmat font-semibold">{expiringCount}</span> clientes con
            cristales por caducar esta semana.
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Kpi
          icon={<TrendingUp className="w-5 h-5" />}
          label="Ingreso total"
          value={fmtMoney(stats?.total)}
          accent="crystal"
        />
        <Kpi
          icon={<Banknote className="w-5 h-5" />}
          label="Efectivo"
          value={fmtMoney(stats?.cash)}
          accent="toxic"
        />
        <Kpi
          icon={<ArrowRightLeft className="w-5 h-5" />}
          label="Transferencia"
          value={fmtMoney(stats?.transfer)}
          accent="crystal"
        />
        <Kpi
          icon={<Coins className="w-5 h-5" />}
          label="Comisiones"
          value={fmtMoney(stats?.comm)}
          accent="hazmat"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Kpi
          icon={<TrendingUp className="w-5 h-5" />}
          label="Ganancia neta dueño"
          value={fmtMoney(stats?.owner)}
          accent="toxic"
        />
        <Kpi
          icon={<Users className="w-5 h-5" />}
          label="Clientes"
          value={String(clientsCount)}
          accent="crystal"
        />
        <Kpi
          icon={<Receipt />}
          label="Transacciones"
          value={String(stats?.count ?? 0)}
          accent="hazmat"
        />
      </div>

      <HexPanel>
        <div className="display text-xl mb-4 text-crystal">TUBOS DE ENSAYO · Ingresos por día</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series}>
              <CartesianGrid stroke="#222" strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={11} />
              <Tooltip
                contentStyle={{ background: "#1a1a1a", border: "1px solid #333", color: "#fff" }}
              />
              <Bar dataKey="total" fill="var(--crystal)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </HexPanel>
    </div>
  );
}

function Receipt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 1 2V2z" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}

function Kpi({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  const color =
    accent === "crystal"
      ? "text-crystal"
      : accent === "toxic"
        ? "text-toxic"
        : accent === "hazmat"
          ? "text-hazmat"
          : "text-foreground";
  return (
    <div className="metal-panel hex-card p-4">
      <div className={`flex items-center gap-2 text-xs uppercase tracking-widest ${color}`}>
        {icon}
        {label}
      </div>
      <div className="display text-3xl mt-2">{value}</div>
    </div>
  );
}
