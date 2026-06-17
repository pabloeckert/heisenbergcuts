import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, HexPanel } from "@/components/lab/AppShell";
import { fmtDateTime, fmtMoney } from "@/lib/loyalty";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({ meta: [{ title: "Transacciones · Heisenberg Cuts" }] }),
  component: TxPage,
});

function TxPage() {
  const [tx, setTx] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("transactions")
        .select("*, clients(full_name, chem_id), transaction_items(service_name)")
        .order("created_at", { ascending: false }).limit(300);
      setTx(data ?? []);
    })();
  }, []);
  return (
    <div>
      <PageTitle subtitle="Bitácora del laboratorio">TRANSACCIONES</PageTitle>
      <HexPanel className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sidebar text-[11px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left p-3">Fecha</th>
              <th className="text-left p-3">Cliente</th>
              <th className="text-left p-3">Servicios</th>
              <th className="text-right p-3">Total</th>
              <th className="text-right p-3">Comisión</th>
              <th className="text-right p-3">Neto</th>
              <th className="text-left p-3">Pago</th>
            </tr>
          </thead>
          <tbody>
            {tx.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="p-3 text-muted-foreground">{fmtDateTime(t.created_at)}</td>
                <td className="p-3"><span className="text-crystal font-display mr-2">{t.clients?.chem_id}</span>{t.clients?.full_name}</td>
                <td className="p-3 text-xs">{(t.transaction_items ?? []).map((i: any) => i.service_name).join(", ")}</td>
                <td className="p-3 text-right">{fmtMoney(t.total_paid)}</td>
                <td className="p-3 text-right text-hazmat">{fmtMoney(t.commission_total)}</td>
                <td className="p-3 text-right text-toxic">{fmtMoney(t.owner_net)}</td>
                <td className="p-3 uppercase text-xs">{t.payment_method}</td>
              </tr>
            ))}
            {tx.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Sin transacciones aún.</td></tr>}
          </tbody>
        </table>
      </HexPanel>
    </div>
  );
}