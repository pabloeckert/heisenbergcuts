import { fmtDate } from "./loyalty";

export function buildWhatsAppMessage(opts: {
  template: string;
  client_name: string;
  services: string;
  total: number;
  crystals_earned: number;
  total_crystals: number;
  expires_at: string | null;
  chem_id: string;
}) {
  return opts.template
    .replace(/\{nombre\}/g, opts.client_name)
    .replace(/\{servicios\}/g, opts.services)
    .replace(/\{monto\}/g, opts.total.toFixed(2))
    .replace(/\{cristales_ganados\}/g, String(opts.crystals_earned))
    .replace(/\{total_cristales\}/g, String(opts.total_crystals))
    .replace(/\{fecha_vencimiento\}/g, fmtDate(opts.expires_at))
    .replace(/\{id_quimico\}/g, opts.chem_id);
}

export function waLink(phone: string, message: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}