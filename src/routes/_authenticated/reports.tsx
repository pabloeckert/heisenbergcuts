import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { PageTitle, HexPanel } from "@/components/lab/AppShell";
import { fmtDate, fmtMoney } from "@/lib/loyalty";
import { Download, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type TransactionItem = Tables<"transaction_items">;
type TransactionWithItems = Tables<"transactions"> & { transaction_items: TransactionItem[] };
type Expense = Tables<"expenses">;
type Profile = Tables<"profiles">;

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Cash Flow · Heisenberg Cuts" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const [range, setRange] = useState<"day" | "week" | "month">("week");
  const [tx, setTx] = useState<TransactionWithItems[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExp, setNewExp] = useState({ description: "", amount: 0, category: "" });
  const [barbers, setBarbers] = useState<Record<string, string>>({});

  const since = useMemo(() => {
    const d = new Date();
    if (range === "day") d.setHours(0, 0, 0, 0);
    else if (range === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    return d.toISOString();
  }, [range]);

  const load = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*, transaction_items(*)")
      .gte("created_at", since)
      .order("created_at", { ascending: false });
    setTx(data ?? []);
    const { data: e } = await supabase
      .from("expenses")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false });
    setExpenses(e ?? []);
    const { data: p } = await supabase.from("profiles").select("id, full_name");
    const map: Record<string, string> = {};
    (p ?? []).forEach((u: Pick<Profile, "id" | "full_name">) => {
      map[u.id] = u.full_name || "—";
    });
    setBarbers(map);
  };
  useEffect(() => {
    load();
  }, [since]);

  const total = tx.reduce((s, t) => s + Number(t.total_paid), 0);
  const cash = tx
    .filter((t) => t.payment_method === "cash")
    .reduce((s, t) => s + Number(t.total_paid), 0);
  const transfer = total - cash;
  const commission = tx.reduce((s, t) => s + Number(t.commission_total), 0);
  const ownerGross = tx.reduce((s, t) => s + Number(t.owner_net), 0);
  const expTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const ownerNet = ownerGross - expTotal;

  const byBarber: Record<string, number> = {};
  tx.forEach((t) => {
    byBarber[t.barber_id] = (byBarber[t.barber_id] ?? 0) + Number(t.commission_total);
  });

  const addExp = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("expenses").insert(newExp);
    if (error) toast.error(error.message);
    setNewExp({ description: "", amount: 0, category: "" });
    load();
  };
  const delExp = async (id: string) => {
    if (!confirm("Eliminar?")) return;
    await supabase.from("expenses").delete().eq("id", id);
    load();
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Heisenberg Cuts — Reporte Cash Flow", 14, 18);
    doc.setFontSize(10);
    doc.text(`Periodo: ${range} · desde ${fmtDate(since)}`, 14, 26);
    autoTable(doc, {
      startY: 32,
      head: [["Concepto", "Monto"]],
      body: [
        ["Ingreso total", fmtMoney(total)],
        ["Efectivo", fmtMoney(cash)],
        ["Transferencia", fmtMoney(transfer)],
        ["Comisiones", fmtMoney(commission)],
        ["Gastos", fmtMoney(expTotal)],
        ["Neto dueño", fmtMoney(ownerNet)],
      ],
    });
    autoTable(doc, {
      head: [["Barbero", "Comisión"]],
      body: Object.entries(byBarber).map(([id, v]) => [barbers[id] ?? id, fmtMoney(v)]),
    });
    doc.save(`heisenberg-cuts-${range}-${Date.now()}.pdf`);
  };

  return (
    <div>
      <div className="flex justify-between items-end flex-wrap gap-4 mb-6">
        <PageTitle subtitle="Flujo de caja del laboratorio">CASH FLOW</PageTitle>
        <div className="flex gap-2">
          {(["day", "week", "month"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 text-xs uppercase tracking-widest border ${range === r ? "border-crystal text-crystal" : "border-border text-muted-foreground"}`}
            >
              {r === "day" ? "Día" : r === "week" ? "Semana" : "Mes"}
            </button>
          ))}
          <button
            onClick={exportPdf}
            className="drum-button px-4 py-2 rounded-sm flex items-center gap-2 text-xs"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Kpi label="Ingreso" value={fmtMoney(total)} accent="text-crystal" />
        <Kpi label="Efectivo" value={fmtMoney(cash)} accent="text-toxic" />
        <Kpi label="Transferencia" value={fmtMoney(transfer)} accent="text-crystal" />
        <Kpi label="Comisiones" value={fmtMoney(commission)} accent="text-hazmat" />
        <Kpi label="Gastos" value={fmtMoney(expTotal)} accent="text-danger" />
        <Kpi label="Neto bruto" value={fmtMoney(ownerGross)} accent="text-toxic" />
        <Kpi label="Neto dueño" value={fmtMoney(ownerNet)} accent="text-toxic" />
        <Kpi label="Visitas" value={String(tx.length)} accent="text-crystal" />
      </div>

      <HexPanel className="mb-6">
        <div className="display text-xl text-crystal mb-4">COMISIONES POR BARBERO</div>
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left p-2">Barbero</th>
              <th className="text-right p-2">Comisión</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(byBarber).map(([id, v]) => (
              <tr key={id} className="border-t border-border">
                <td className="p-2">{barbers[id] ?? id.slice(0, 8)}</td>
                <td className="p-2 text-right text-hazmat">{fmtMoney(v)}</td>
              </tr>
            ))}
            {Object.keys(byBarber).length === 0 && (
              <tr>
                <td colSpan={2} className="p-4 text-center text-muted-foreground">
                  Sin datos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </HexPanel>

      <HexPanel>
        <div className="display text-xl text-crystal mb-4">GASTOS</div>
        <form onSubmit={addExp} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
          <input
            required
            placeholder="Descripción"
            value={newExp.description}
            onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
            className="md:col-span-2 bg-input border border-border px-3 py-2 rounded-sm"
          />
          <input
            type="number"
            placeholder="Monto"
            required
            value={newExp.amount}
            onChange={(e) => setNewExp({ ...newExp, amount: Number(e.target.value) })}
            className="bg-input border border-border px-3 py-2 rounded-sm"
          />
          <input
            placeholder="Categoría"
            value={newExp.category}
            onChange={(e) => setNewExp({ ...newExp, category: e.target.value })}
            className="bg-input border border-border px-3 py-2 rounded-sm"
          />
          <button
            type="submit"
            className="drum-button col-span-full py-2 rounded-sm flex items-center justify-center gap-2 text-xs"
          >
            <Plus className="w-4 h-4" /> Registrar gasto
          </button>
        </form>
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left p-2">Fecha</th>
              <th className="text-left p-2">Descripción</th>
              <th className="text-left p-2">Categoría</th>
              <th className="text-right p-2">Monto</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="p-2 text-muted-foreground">{fmtDate(e.created_at)}</td>
                <td className="p-2">{e.description}</td>
                <td className="p-2 text-muted-foreground">{e.category}</td>
                <td className="p-2 text-right text-danger">{fmtMoney(e.amount)}</td>
                <td className="p-2">
                  <button onClick={() => delExp(e.id)} className="text-danger">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted-foreground">
                  Sin gastos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </HexPanel>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="metal-panel hex-card p-4">
      <div className={`text-xs uppercase tracking-widest ${accent}`}>{label}</div>
      <div className="display text-2xl mt-2">{value}</div>
    </div>
  );
}
