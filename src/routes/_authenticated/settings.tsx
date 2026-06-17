import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, HexPanel } from "@/components/lab/AppShell";
import { Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Ajustes · Heisenberg Cuts" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [loyalty, setLoyalty] = useState<any>(null);
  const [wa, setWa] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: l } = await (supabase as any).from("loyalty_settings").select("*").eq("id", 1).single();
      setLoyalty(l);
      const { data: w } = await (supabase as any).from("whatsapp_settings").select("*").eq("id", 1).single();
      setWa(w);
    })();
  }, []);

  const saveLoyalty = async () => {
    const { error } = await (supabase as any).from("loyalty_settings").update({ ...loyalty, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) toast.error(error.message); else toast.success("Lealtad guardada");
  };
  const saveWa = async () => {
    const { error } = await (supabase as any).from("whatsapp_settings").update({ template: wa.template, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) toast.error(error.message); else toast.success("Plantilla guardada");
  };

  if (!loyalty || !wa) return null;

  const F = ({ k, label, step }: { k: string; label: string; step?: number }) => (
    <label className="text-xs uppercase tracking-widest text-muted-foreground">
      {label}
      <input type="number" step={step ?? 1} value={loyalty[k]} onChange={(e) => setLoyalty({ ...loyalty, [k]: Number(e.target.value) })}
        className="block w-full bg-input border border-border px-3 py-2 rounded-sm mt-1 text-foreground" />
    </label>
  );

  return (
    <div className="space-y-6">
      <PageTitle subtitle="Reglas del club Blue Sky y WhatsApp">AJUSTES</PageTitle>
      <HexPanel>
        <div className="display text-xl text-crystal mb-4">CLUB BLUE SKY</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <F k="crystals_per_peso" label="Cristales por peso" step={0.1} />
          <F k="crystals_redeem_rate" label="Cristales = $1" />
          <F k="expiry_days" label="Vencimiento (días)" />
          <F k="inactivity_grace_days" label="Inactividad alerta (días)" />
          <F k="bronze_visits" label="Bronce visitas" />
          <F k="bronze_discount" label="Bronce % desc" />
          <F k="silver_visits" label="Plata visitas" />
          <F k="silver_discount" label="Plata % desc" />
          <F k="gold_visits" label="Oro visitas" />
          <F k="gold_discount" label="Oro % desc" />
          <F k="heisenberg_visits" label="Heisenberg visitas" />
          <F k="heisenberg_discount" label="Heisenberg % desc" />
        </div>
        <button onClick={saveLoyalty} className="drum-button mt-4 px-4 py-2 rounded-sm flex items-center gap-2 text-sm"><Save className="w-4 h-4" /> Guardar lealtad</button>
      </HexPanel>

      <HexPanel>
        <div className="display text-xl text-crystal mb-2">PLANTILLA WHATSAPP</div>
        <div className="text-xs text-muted-foreground mb-3">Variables: {"{nombre} {servicios} {monto} {cristales_ganados} {total_cristales} {fecha_vencimiento} {id_quimico}"}</div>
        <textarea value={wa.template} onChange={(e) => setWa({ ...wa, template: e.target.value })} rows={6}
          className="w-full bg-input border border-border px-3 py-2 rounded-sm font-mono text-sm" />
        <button onClick={saveWa} className="drum-button mt-3 px-4 py-2 rounded-sm flex items-center gap-2 text-sm"><Save className="w-4 h-4" /> Guardar plantilla</button>
      </HexPanel>
    </div>
  );
}