
# Heisenberg Cuts — Plan

A full barbershop management app: income tracking, commissions, cash flow, and a "Blue Sky" loyalty club, themed as Heisenberg's clandestine lab.

Before I start, a few decisions I need from you (see questions below the plan). I'll proceed with the defaults stated here unless you say otherwise.

---

## 1. Stack & Infrastructure

- **Frontend:** TanStack Start + React + Tailwind v4 (current template).
- **Backend:** Lovable Cloud (Supabase) — DB, Auth, RLS, server functions.
- **Auth:** Email + password. Two roles: `owner`, `barber` (stored in a separate `user_roles` table with a `has_role()` security-definer fn).
- **WhatsApp:** Default to `wa.me` deep links with prefilled message + clipboard copy (no credentials needed). Optional WhatsApp Cloud API path via Settings if the user later adds a token + phone-number ID as secrets.
- **PDF export:** client-side (`jspdf` + `jspdf-autotable`) for reports.

---

## 2. Database Schema (Supabase)

- `profiles` — id (=auth.users.id), full_name, alias, phone, created_at.
- `app_role` enum: `owner`, `barber`.
- `user_roles` — user_id, role (separate table, RLS via `has_role`).
- `clients` — id, full_name, alias, phone, chem_id (e.g. `Hs-104`), level_symbol, level_seq, visits_count, crystals_balance, crystals_expire_at, last_visit_at, created_at.
- `services` — id, name, kind (`base` | `extra` | `combo`), price, commission_pct, active, is_base (Pelo/Barba/Cejas locked), display_order.
- `combos` — predefined 3 combos seeded; combos reference base services (or stored as `services` rows with `kind='combo'` + a `combo_components` join table).
- `transactions` — id, client_id, barber_id, subtotal, level_discount_pct, level_discount_amount, crystals_redeemed, crystals_discount_amount, total_paid, payment_method (`cash`|`transfer`), commission_total, owner_net, crystals_earned, created_at.
- `transaction_items` — transaction_id, service_id, price, commission_pct, commission_amount.
- `expenses` (optional cash flow) — id, description, amount, category, created_at, created_by.
- `loyalty_settings` — singleton: crystals_per_peso, crystals_redeem_rate (e.g. 100 = $5), expiry_days (90), level_thresholds JSON, inactivity_grace_days (60).
- `whatsapp_settings` — method (`link`|`cloud_api`), template text.

RLS:
- Owners: full access via `has_role(auth.uid(),'owner')`.
- Barbers: read clients/services, insert transactions where `barber_id = auth.uid()`, read own commissions.

All public schema tables get explicit `GRANT`s + RLS policies (per platform rules).

---

## 3. Core Features

### 3.1 Services & Combos (Owner panel)
- Locked 3 base services (Pelo, Barba, Cejas) — price + commission % editable.
- Up to 3 extra services (CRUD).
- 3 fixed combos with their own price + commission %.

### 3.2 Quick Service Registration (Barber/Owner)
- Search/create client → pick services/combos → see live summary (subtotal, level discount, crystal redemption input, final total, crystals to earn, commissions) → pick payment method → confirm.
- On confirm: insert transaction + items, update client (visits, crystals, level, last_visit, expiry), generate WhatsApp message.

### 3.3 Loyalty "Blue Sky"
- **Crystals:** 1 per peso paid (configurable), expire after 90 days of no visit.
- **Levels by visit count:** Bronce (Cu, 5, 5%), Plata (Ag, 10, 10%), Oro (Au, 20, 15%), Heisenberg (Hs, 30, 20% + free brow). Level retained unless 60 days of inactivity (then recomputed on next visit using effective visits — or simply soft-warned; I'll use "warning state" + keep level until visit, then reset if >60 days inactive, per your spec).
- **Chemical ID:** `<level_symbol>-<seq>`, seq per level, preserved across upgrades (number is kept, prefix updated).
- **Redemption:** barber enters crystals to redeem; system caps at balance and at total.

### 3.4 Client CRM
- List + search (name / phone / chem_id).
- Status badges: Active (green), At-risk (yellow, >60d), Expired (red, >90d).
- Detail: stats, history, "Ver recompensas" preview, "Send WhatsApp" button.
- Edit basic data.

### 3.5 Cash Flow & Reports (Owner)
- Filters: day/week/month/custom.
- KPIs: total income, cash vs transfer split, commissions paid, expenses, owner net.
- Charts (test-tube styled bars using Recharts).
- Commissions report per barber.
- Transactions table with detail drawer.
- Export to PDF.

### 3.6 Dashboard Alerts
- Banner when ≥N clients have crystals expiring in next 7 days.

---

## 4. Design System (Heisenberg lab)

- Dark only. Tokens in `src/styles.css` (oklch equivalents of #111, #1C1C1C, #00E5FF, #FFD700, #39FF14, #FF1744).
- Fonts via `<link>` in `__root.tsx`: **Staatliches** (display) + **Rajdhani** (body).
- Hex-bordered cards (clip-path), metallic "drum-cap" buttons, periodic-table level indicator with `Hs` glow.
- Subtle floating-crystal particle layer on key screens (CSS-only, low cost).
- Custom Erlenmeyer/hex iconography (lucide + a few custom SVGs).
- Header with Heisenberg hat+glasses silhouette SVG; tagline "Tú pides el corte, yo pongo la química".

---

## 5. Routes

```
/auth                       public
/_authenticated/            (managed gate)
  ├─ dashboard              (owner) — KPIs, alerts
  ├─ register               (barber+owner) — quick service form
  ├─ clients                CRM list
  ├─ clients/$id            client detail
  ├─ transactions           history + filters
  ├─ reports                (owner) — cash flow + commissions + PDF
  ├─ services               (owner) — services/combos/loyalty config
  ├─ team                   (owner) — barbers + commission overrides
  └─ settings               (owner) — WhatsApp template + loyalty rules
```

---

## 6. Build Order

1. Enable Lovable Cloud + migrations (roles, all tables, RLS, seed base services + combos + default loyalty settings).
2. Design tokens, fonts, shared lab UI primitives (HexCard, DrumButton, PeriodicLevel, ParticleField).
3. Auth pages + role bootstrap (first signup = owner).
4. Services & loyalty settings admin.
5. Clients CRM (+ chem-ID generator server fn).
6. Quick register flow with live summary + commission calc + crystal redemption.
7. WhatsApp message generator + send modal (wa.me + copy-to-clipboard).
8. Transactions list + dashboard KPIs + charts + expiry alerts.
9. Reports + PDF export.
10. Optional: expenses module, WhatsApp Cloud API path.

---

## 7. Technical Notes

- Chem-ID + level transitions handled in a single Postgres function called from a server fn inside the transaction insert, to avoid races.
- Crystals expiry computed as `last_visit_at + 90d`; a nightly view/computed column gives "expired" status — no cron needed initially (computed on read).
- All money math server-side in the confirmation server fn; client only shows previews.
- WhatsApp Cloud API only wired if you later add `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_ID` secrets; otherwise `wa.me` link is used.

---

### Clarifications I'd like before building

1. **First user / seeding:** should the very first registered account auto-become `owner`, or do you want me to seed a specific owner email?
2. **WhatsApp:** start with `wa.me` link + clipboard only (recommended, zero setup), or do you already have WhatsApp Cloud API credentials to wire now?
3. **Currency symbol/locale** for displays and PDFs (e.g. ARS `$`, MXN `$`, USD)?
4. **Expenses module:** include it now or leave for later?
