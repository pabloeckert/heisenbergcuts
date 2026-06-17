import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, HexPanel } from "@/components/lab/AppShell";
import { effectiveCrystals, fmtMoney, levelForVisits } from "@/lib/loyalty";
import { buildWhatsAppMessage, waLink } from "@/lib/whatsapp";
import { Check, Search, Send, Copy, X, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/register")({
  head: () => ({ meta: [{ title: "Atender · Heisenberg Cuts" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ client: (s.client as string) || undefined }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [services, setServices] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [waTpl, setWaTpl] = useState<string>("");
  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState<any[]>([]);
  const [client, setClient] = useState<any>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [redeem, setRedeem] = useState(0);
  const [method, setMethod] = useState<"cash" | "transfer">("cash");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await (supabase as any).from("services").select("*").eq("active", true).order("display_order");
      setServices(s ?? []);
      const { data: ls } = await (supabase as any).from("loyalty_settings").select("*").eq("id", 1).single();
      setSettings(ls);
      const { data: w } = await (supabase as any).from("whatsapp_settings").select("*").eq("id", 1).single();
      setWaTpl(w?.template ?? "");
      if (search.client) {
        const { data: c } = await (supabase as any).from("clients").select("*").eq("id", search.client).single();
        if (c) setClient(c);
      }
    })();
  }, [search.client]);

  useEffect(() => {
    if (!clientQuery || client) { setClientResults([]); return; }
    const t = setTimeout(async () => {
      const term = clientQuery.toLowerCase();
      const { data } = await (supabase as any).from("clients").select("*")
        .or(`full_name.ilike.%${clientQuery}%,phone.ilike.%${clientQuery}%,chem_id.ilike.%${clientQuery}%`).limit(8);
      setClientResults(data ?? []);
    }, 200);
    return () => clearTimeout(t);
  }, [clientQuery, client]);

  const chosen = useMemo(() => services.filter((s) => selected[s.id]), [services, selected]);
  const subtotal = chosen.reduce((s, x) => s + Number(x.price), 0);
  const balance = client ? effectiveCrystals(client) : 0;
  const level = client && settings ? levelForVisits(client.visits_count + 1, settings) : null;
  const levelDiscPct = level?.discount ?? 0;
  const levelDisc = +(subtotal * levelDiscPct / 100).toFixed(2);
  const cappedRedeem = Math.max(0, Math.min(redeem, balance));
  const redeemDisc = settings ? +(cappedRedeem / settings.crystals_redeem_rate).toFixed(2) : 0;
  const total = Math.max(0, +(subtotal - levelDisc - redeemDisc).toFixed(2));
  const crystalsEarn = settings ? Math.floor(total * settings.crystals_per_peso) : 0;

  const submit = async () => {
    if (!client || chosen.length === 0) { toast.error("Selecciona cliente y servicios"); return; }
    setSubmitting(true);
    const { data, error } = await (supabase as any).rpc("register_transaction", {
      _client_id: client.id,
      _service_ids: chosen.map((s) => s.id),
      _crystals_to_redeem: cappedRedeem,
      _payment_method: method,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    const { data: refreshed } = await (supabase as any).from("clients").select("*").eq("id", client.id).single();
    setResult({ tx: data, client: refreshed, services: chosen.map((s) => s.name).join(", ") });
    toast.success("Transacción registrada");
  };

  if (result) return <Receipt result={result} waTpl={waTpl} onClose={() => { setResult(null); setClient(null); setSelected({}); setRedeem(0); navigate({ to: "/register", search: {} as any }); }} />;

  return (
    <div>
      <PageTitle subtitle="Cocinar la transacción">ATENDER CLIENTE</PageTitle>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <HexPanel>
            <div className="display text-lg text-crystal mb-3">1 · CLIENTE</div>
            {!client ? (
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={clientQuery} onChange={(e) => setClientQuery(e.target.value)} autoFocus
                    placeholder="Buscar por nombre, teléfono o ID químico…"
                    className="w-full bg-input border border-border pl-9 pr-3 py-2 rounded-sm" />
                </div>
                {clientResults.length > 0 && (
                  <div className="mt-2 border border-border rounded-sm divide-y divide-border bg-popover">
                    {clientResults.map((c) => (
                      <button key={c.id} onClick={() => setClient(c)} className="w-full text-left p-3 hover:bg-accent flex justify-between">
                        <span><span className="text-crystal font-display mr-2">{c.chem_id}</span>{c.full_name}</span>
                        <span className="text-muted-foreground text-xs">{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-crystal font-display text-2xl">{client.chem_id}</div>
                  <div className="text-foreground">{client.full_name} · <span className="text-muted-foreground">{client.phone}</span></div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Visitas: {client.visits_count} · Cristales: <span className={balance > 0 ? "text-crystal" : "text-danger"}>{balance}</span>
                    {level && level.discount > 0 && <> · Descuento de nivel: <span className="text-toxic">{level.discount}%</span></>}
                  </div>
                </div>
                <button onClick={() => setClient(null)} className="text-muted-foreground hover:text-danger"><X className="w-5 h-5" /></button>
              </div>
            )}
          </HexPanel>

          <HexPanel>
            <div className="display text-lg text-crystal mb-3">2 · SERVICIOS</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {services.map((s) => {
                const on = !!selected[s.id];
                return (
                  <button key={s.id} onClick={() => setSelected({ ...selected, [s.id]: !on })}
                    className={`hex-card p-3 text-left transition-all border ${on ? "bg-crystal/15 border-crystal shadow-[inset_0_0_18px_color-mix(in_oklab,var(--crystal)_25%,transparent)]" : "metal-panel"}`}>
                    <div className="flex justify-between items-start">
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.kind === "combo" ? "Combo" : s.kind === "base" ? "Base" : "Extra"}</div>
                      {on && <Check className="w-4 h-4 text-crystal" />}
                    </div>
                    <div className="font-display text-lg mt-1">{s.name}</div>
                    <div className="text-hazmat font-semibold">{fmtMoney(s.price)}</div>
                  </button>
                );
              })}
            </div>
          </HexPanel>

          <HexPanel>
            <div className="display text-lg text-crystal mb-3">3 · PAGO</div>
            <div className="flex gap-2">
              {(["cash", "transfer"] as const).map((m) => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`flex-1 py-3 hex-card border text-sm uppercase tracking-widest ${method === m ? "bg-crystal text-[oklch(0.14_0.02_240)] border-crystal" : "metal-panel"}`}>
                  {m === "cash" ? "Efectivo" : "Transferencia"}
                </button>
              ))}
            </div>
            {client && balance > 0 && (
              <div className="mt-4">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Canjear cristales (máx {balance})</label>
                <input type="number" min={0} max={balance} value={redeem} onChange={(e) => setRedeem(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full bg-input border border-border px-3 py-2 rounded-sm mt-1" />
                {cappedRedeem > 0 && <div className="text-toxic text-xs mt-1">Descuento por cristales: {fmtMoney(redeemDisc)}</div>}
              </div>
            )}
          </HexPanel>
        </div>

        <HexPanel className="h-fit sticky top-4">
          <div className="display text-xl text-crystal mb-4">RESUMEN</div>
          <div className="space-y-2 text-sm">
            <Row label="Subtotal" value={fmtMoney(subtotal)} />
            {levelDiscPct > 0 && <Row label={`Descuento ${levelDiscPct}%`} value={`− ${fmtMoney(levelDisc)}`} color="text-toxic" />}
            {cappedRedeem > 0 && <Row label={`Canje ${cappedRedeem} cristales`} value={`− ${fmtMoney(redeemDisc)}`} color="text-toxic" />}
            <div className="border-t border-border my-3" />
            <Row label="TOTAL A COBRAR" value={fmtMoney(total)} big />
            <Row label="Cristales que ganará" value={`+${crystalsEarn}`} color="text-crystal" />
          </div>
          <button onClick={submit} disabled={submitting || !client || chosen.length === 0} className="drum-button w-full py-3 mt-5 rounded-sm disabled:opacity-50">
            {submitting ? "..." : "Confirmar cobro"}
          </button>
        </HexPanel>
      </div>
    </div>
  );
}

function Row({ label, value, color, big }: { label: string; value: string; color?: string; big?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`uppercase tracking-widest text-xs ${color ?? "text-muted-foreground"}`}>{label}</span>
      <span className={`${color ?? ""} ${big ? "display text-3xl text-hazmat" : "font-semibold"}`}>{value}</span>
    </div>
  );
}

function Receipt({ result, waTpl, onClose }: { result: any; waTpl: string; onClose: () => void }) {
  const { tx, client, services } = result;
  const msg = buildWhatsAppMessage({
    template: waTpl, client_name: client.full_name, services,
    total: Number(tx.total_paid), crystals_earned: tx.crystals_earned,
    total_crystals: client.crystals_balance, expires_at: client.crystals_expire_at, chem_id: client.chem_id,
  });
  const link = waLink(client.phone, msg);
  const copy = () => { navigator.clipboard.writeText(msg); toast.success("Copiado"); };
  return (
    <div>
      <PageTitle subtitle="Reacción completada">RECIBO</PageTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HexPanel>
          <div className="display text-2xl text-crystal mb-3">{client.chem_id} · {client.full_name}</div>
          <Row label="Total cobrado" value={fmtMoney(tx.total_paid)} big />
          <Row label="Servicios" value={services} />
          <Row label="Método" value={tx.payment_method.toUpperCase()} />
          <Row label="Cristales ganados" value={`+${tx.crystals_earned}`} color="text-crystal" />
          <Row label="Cristales totales" value={String(client.crystals_balance)} color="text-crystal" />
          <Row label="Comisión barbero" value={fmtMoney(tx.commission_total)} color="text-hazmat" />
          <Row label="Neto dueño" value={fmtMoney(tx.owner_net)} color="text-toxic" />
        </HexPanel>
        <HexPanel>
          <div className="display text-xl text-crystal mb-3">MENSAJE WHATSAPP</div>
          <div className="metal-panel rounded-sm p-3 text-sm whitespace-pre-wrap text-foreground">{msg}</div>
          <div className="flex gap-2 mt-4">
            <a href={link} target="_blank" rel="noreferrer" className="drum-button flex-1 py-3 rounded-sm text-center text-sm flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Abrir WhatsApp</a>
            <button onClick={copy} className="metal-panel px-4 py-3 rounded-sm text-sm flex items-center gap-2"><Copy className="w-4 h-4" /> Copiar</button>
          </div>
          <button onClick={onClose} className="w-full mt-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-crystal flex items-center justify-center gap-2"><Plus className="w-3 h-3" /> Nueva atención</button>
        </HexPanel>
      </div>
    </div>
  );
}