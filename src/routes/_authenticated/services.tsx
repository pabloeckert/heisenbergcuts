import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, HexPanel } from "@/components/lab/AppShell";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/services")({
  head: () => ({ meta: [{ title: "Servicios · Heisenberg Cuts" }] }),
  component: ServicesPage,
});

function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [newSvc, setNewSvc] = useState({ name: "", price: 0, commission_pct: 50 });

  const load = async () => {
    const { data } = await (supabase as any).from("services").select("*").order("display_order").order("created_at");
    setServices(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: any) => {
    const { error } = await (supabase as any).from("services").update(patch).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Actualizado");
    load();
  };

  const extras = services.filter((s) => s.kind === "extra");
  const addExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (extras.length >= 3) { toast.error("Máximo 3 servicios extra"); return; }
    const { error } = await (supabase as any).from("services").insert({
      name: newSvc.name, kind: "extra", price: newSvc.price, commission_pct: newSvc.commission_pct, display_order: 20 + extras.length,
    });
    if (error) toast.error(error.message);
    setNewSvc({ name: "", price: 0, commission_pct: 50 });
    load();
  };

  const del = async (id: string) => {
    if (!confirm("¿Eliminar?")) return;
    const { error } = await (supabase as any).from("services").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  const renderGroup = (label: string, items: any[]) => (
    <HexPanel className="mb-6">
      <div className="display text-xl text-crystal mb-4">{label}</div>
      <div className="space-y-2">
        {items.map((s) => (
          <ServiceRow key={s.id} s={s} onSave={(p) => update(s.id, p)} onDelete={!s.is_locked ? () => del(s.id) : undefined} />
        ))}
      </div>
    </HexPanel>
  );

  return (
    <div>
      <PageTitle subtitle="Configura precios y comisiones">SERVICIOS · COMBOS</PageTitle>
      {renderGroup("BASE (fijos)", services.filter((s) => s.kind === "base"))}
      {renderGroup("COMBOS", services.filter((s) => s.kind === "combo"))}
      {renderGroup("EXTRA", extras)}
      {extras.length < 3 && (
        <HexPanel>
          <div className="display text-lg text-crystal mb-3">AGREGAR EXTRA</div>
          <form onSubmit={addExtra} className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <input required placeholder="Nombre" value={newSvc.name} onChange={(e) => setNewSvc({ ...newSvc, name: e.target.value })} className="bg-input border border-border px-3 py-2 rounded-sm md:col-span-2" />
            <input type="number" placeholder="Precio" value={newSvc.price} onChange={(e) => setNewSvc({ ...newSvc, price: Number(e.target.value) })} className="bg-input border border-border px-3 py-2 rounded-sm" />
            <input type="number" placeholder="Comisión %" value={newSvc.commission_pct} onChange={(e) => setNewSvc({ ...newSvc, commission_pct: Number(e.target.value) })} className="bg-input border border-border px-3 py-2 rounded-sm" />
            <button type="submit" className="drum-button col-span-full py-2 rounded-sm flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Agregar</button>
          </form>
        </HexPanel>
      )}
    </div>
  );
}

function ServiceRow({ s, onSave, onDelete }: { s: any; onSave: (p: any) => void; onDelete?: () => void }) {
  const [price, setPrice] = useState(Number(s.price));
  const [comm, setComm] = useState(Number(s.commission_pct));
  const [active, setActive] = useState<boolean>(s.active);
  useEffect(() => { setPrice(Number(s.price)); setComm(Number(s.commission_pct)); setActive(s.active); }, [s.id]);
  const dirty = price !== Number(s.price) || comm !== Number(s.commission_pct) || active !== s.active;
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 metal-panel rounded-sm">
      <div className="flex-1 min-w-[180px]">
        <div className="font-display text-lg">{s.name}</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.kind}{s.is_locked && " · fijo"}</div>
      </div>
      <label className="text-xs text-muted-foreground">Precio<input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="block w-24 bg-input border border-border px-2 py-1 rounded-sm" /></label>
      <label className="text-xs text-muted-foreground">Comisión %<input type="number" value={comm} onChange={(e) => setComm(Number(e.target.value))} className="block w-20 bg-input border border-border px-2 py-1 rounded-sm" /></label>
      <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Activo</label>
      {dirty && <button onClick={() => onSave({ price, commission_pct: comm, active })} className="drum-button px-3 py-1.5 rounded-sm text-xs flex items-center gap-1"><Save className="w-3 h-3" />Guardar</button>}
      {onDelete && <button onClick={onDelete} className="text-danger hover:opacity-70"><Trash2 className="w-4 h-4" /></button>}
    </div>
  );
}