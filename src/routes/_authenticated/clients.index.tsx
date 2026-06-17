import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, HexPanel } from "@/components/lab/AppShell";
import { fmtDate, clientStatus, effectiveCrystals } from "@/lib/loyalty";
import { Plus, Search, Phone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/clients/")({
  head: () => ({ meta: [{ title: "Clientes · Heisenberg Cuts" }] }),
  component: ClientsPage,
});

function ClientsPage() {
  const [q, setQ] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ inactivity_grace_days: 60 });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", alias: "" });
  const navigate = useNavigate();

  const load = async () => {
    const { data } = await (supabase as any).from("clients").select("*").order("created_at", { ascending: false }).limit(500);
    setClients(data ?? []);
    const { data: s } = await (supabase as any).from("loyalty_settings").select("*").eq("id", 1).single();
    if (s) setSettings(s);
  };
  useEffect(() => { load(); }, []);

  const filtered = clients.filter((c) => {
    if (!q) return true;
    const term = q.toLowerCase();
    return c.full_name.toLowerCase().includes(term) || c.phone.includes(term) || c.chem_id.toLowerCase().includes(term);
  });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await (supabase as any).rpc("create_client", {
      _full_name: form.full_name, _phone: form.phone, _alias: form.alias || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Cliente creado: ${data.chem_id}`);
    setOpen(false);
    setForm({ full_name: "", phone: "", alias: "" });
    navigate({ to: "/clients/$id", params: { id: data.id } });
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-6 flex-wrap gap-4">
        <PageTitle subtitle="CRM · base de sujetos químicos">CLIENTES</PageTitle>
        <button onClick={() => setOpen(true)} className="drum-button px-4 py-2.5 rounded-sm flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Nuevo cliente
        </button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, teléfono o ID químico…"
          className="w-full bg-input border border-border pl-9 pr-3 py-2 rounded-sm focus:outline-none focus:border-crystal" />
      </div>

      <HexPanel className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sidebar text-[11px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">Teléfono</th>
              <th className="text-right p-3">Visitas</th>
              <th className="text-right p-3">Cristales</th>
              <th className="text-left p-3">Última visita</th>
              <th className="text-left p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const st = clientStatus(c, settings);
              return (
                <tr key={c.id} className="border-t border-border hover:bg-accent/40 cursor-pointer" onClick={() => navigate({ to: "/clients/$id", params: { id: c.id } })}>
                  <td className="p-3 font-display text-crystal">{c.chem_id}</td>
                  <td className="p-3">{c.full_name}{c.alias && <span className="text-muted-foreground text-xs"> · {c.alias}</span>}</td>
                  <td className="p-3 flex items-center gap-1 text-muted-foreground"><Phone className="w-3 h-3" />{c.phone}</td>
                  <td className="p-3 text-right">{c.visits_count}</td>
                  <td className="p-3 text-right text-crystal">{effectiveCrystals(c)}</td>
                  <td className="p-3 text-muted-foreground">{fmtDate(c.last_visit_at)}</td>
                  <td className={`p-3 ${st.color} text-xs uppercase tracking-widest`}>● {st.label}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Sin clientes registrados aún.</td></tr>
            )}
          </tbody>
        </table>
      </HexPanel>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <form onSubmit={create} onClick={(e) => e.stopPropagation()} className="metal-panel hex-card p-6 w-full max-w-md space-y-4">
            <div className="display text-2xl text-crystal">NUEVO SUJETO</div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Nombre completo</label>
              <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full bg-input border border-border px-3 py-2 rounded-sm" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Teléfono (WhatsApp con código país)</label>
              <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="5491133334444"
                className="w-full bg-input border border-border px-3 py-2 rounded-sm" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Alias (opcional)</label>
              <input value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })}
                className="w-full bg-input border border-border px-3 py-2 rounded-sm" />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground">Cancelar</button>
              <button type="submit" className="drum-button px-5 py-2.5 rounded-sm text-sm">Cocinar registro</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}