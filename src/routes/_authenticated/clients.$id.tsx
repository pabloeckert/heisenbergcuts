import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, HexPanel } from "@/components/lab/AppShell";
import { PeriodicLevel } from "@/components/lab/PeriodicLevel";
import { clientStatus, effectiveCrystals, fmtDate, fmtDateTime, fmtMoney, levelForVisits } from "@/lib/loyalty";
import { Phone, ArrowLeft, Scissors } from "lucide-react";

export const Route = createFileRoute("/_authenticated/clients/$id")({
  head: () => ({ meta: [{ title: "Ficha de cliente · Heisenberg Cuts" }] }),
  component: ClientDetail,
});

function ClientDetail() {
  const { id } = Route.useParams();
  const [client, setClient] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: c } = await (supabase as any).from("clients").select("*").eq("id", id).single();
      setClient(c);
      const { data: t } = await (supabase as any).from("transactions")
        .select("*, transaction_items(*)").eq("client_id", id).order("created_at", { ascending: false });
      setHistory(t ?? []);
      const { data: s } = await (supabase as any).from("loyalty_settings").select("*").eq("id", 1).single();
      setSettings(s);
    })();
  }, [id]);

  if (!client || !settings) return <div className="text-muted-foreground">Cargando…</div>;
  const status = clientStatus(client, settings);
  const level = levelForVisits(client.visits_count, settings);
  const balance = effectiveCrystals(client);

  return (
    <div>
      <Link to="/clients" className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1 mb-3"><ArrowLeft className="w-3 h-3" /> Volver</Link>
      <div className="flex justify-between items-end mb-6 flex-wrap gap-4">
        <PageTitle subtitle={<span><span className="text-crystal font-display text-lg">{client.chem_id}</span> · <span className={status.color}>● {status.label}</span></span>}>
          {client.full_name}
        </PageTitle>
        <Link to="/register" search={{ client: client.id } as any} className="drum-button px-4 py-2.5 rounded-sm text-sm flex items-center gap-2">
          <Scissors className="w-4 h-4" /> Atender ahora
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <HexPanel>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Cristales azules</div>
          <div className={`display text-5xl ${balance > 0 ? "text-crystal" : "text-danger"}`}>{balance}</div>
          <div className="text-xs text-muted-foreground mt-2">
            {client.crystals_expire_at ? `Vencen ${fmtDate(client.crystals_expire_at)}` : "Sin vencimiento"}
          </div>
          {balance === 0 && client.crystals_balance > 0 && (
            <div className="text-danger text-xs mt-1">Saldo {client.crystals_balance} expirado por inactividad</div>
          )}
          <div className="text-xs text-muted-foreground mt-3">
            Canje: {settings.crystals_redeem_rate} cristales = $1
            {balance > 0 && <span className="text-toxic"> · disponible {fmtMoney(balance / settings.crystals_redeem_rate)}</span>}
          </div>
        </HexPanel>
        <HexPanel>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Visitas</div>
          <div className="display text-5xl">{client.visits_count}</div>
          <div className="text-xs text-muted-foreground mt-2">
            Última: {fmtDate(client.last_visit_at)}
          </div>
          <div className="text-sm mt-3">
            Nivel actual: <span className="text-hazmat font-display text-lg">{level.name}</span> · descuento <span className="text-toxic">{level.discount}%</span>
          </div>
        </HexPanel>
        <HexPanel>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Contacto</div>
          <a href={`https://wa.me/${client.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer"
             className="text-crystal hover:text-toxic flex items-center gap-2 text-lg">
            <Phone className="w-4 h-4" /> {client.phone}
          </a>
          {client.alias && <div className="text-sm text-muted-foreground mt-2">Alias: {client.alias}</div>}
          <div className="text-xs text-muted-foreground mt-2">Registrado: {fmtDate(client.created_at)}</div>
        </HexPanel>
      </div>

      <HexPanel className="mb-6">
        <div className="display text-xl mb-4 text-crystal">TABLA PERIÓDICA · NIVEL</div>
        <PeriodicLevel current={client.level_symbol} visits={client.visits_count} settings={settings} />
      </HexPanel>

      <HexPanel className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border display text-xl text-crystal">HISTORIAL</div>
        <table className="w-full text-sm">
          <thead className="bg-sidebar text-[11px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left p-3">Fecha</th>
              <th className="text-left p-3">Servicios</th>
              <th className="text-right p-3">Total</th>
              <th className="text-right p-3">Cristales</th>
              <th className="text-left p-3">Pago</th>
            </tr>
          </thead>
          <tbody>
            {history.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="p-3 text-muted-foreground">{fmtDateTime(t.created_at)}</td>
                <td className="p-3">{(t.transaction_items ?? []).map((i: any) => i.service_name).join(", ")}</td>
                <td className="p-3 text-right">{fmtMoney(t.total_paid)}</td>
                <td className="p-3 text-right text-crystal">+{t.crystals_earned} / −{t.crystals_redeemed}</td>
                <td className="p-3 uppercase text-xs">{t.payment_method}</td>
              </tr>
            ))}
            {history.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Sin visitas todavía.</td></tr>}
          </tbody>
        </table>
      </HexPanel>
    </div>
  );
}