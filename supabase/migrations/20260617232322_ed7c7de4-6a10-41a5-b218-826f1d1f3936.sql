
-- =====================
-- ENUMS
-- =====================
CREATE TYPE public.app_role AS ENUM ('owner','barber');
CREATE TYPE public.service_kind AS ENUM ('base','extra','combo');
CREATE TYPE public.payment_method AS ENUM ('cash','transfer');

-- =====================
-- PROFILES
-- =====================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  alias TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================
-- USER ROLES
-- =====================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'owner'));
CREATE POLICY "owners manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner'))
  WITH CHECK (public.has_role(auth.uid(),'owner'));

CREATE POLICY "read own or owner reads all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'owner'));
CREATE POLICY "update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "owners delete profiles" ON public.profiles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'owner'));

-- Trigger: auto-create profile + first-user-is-owner
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INT;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  SELECT count(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'barber');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- LOYALTY SETTINGS (singleton)
-- =====================
CREATE TABLE public.loyalty_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  crystals_per_peso NUMERIC NOT NULL DEFAULT 1,
  crystals_redeem_rate NUMERIC NOT NULL DEFAULT 20, -- 20 crystals = $1
  expiry_days INT NOT NULL DEFAULT 90,
  inactivity_grace_days INT NOT NULL DEFAULT 60,
  bronze_visits INT NOT NULL DEFAULT 5,
  silver_visits INT NOT NULL DEFAULT 10,
  gold_visits INT NOT NULL DEFAULT 20,
  heisenberg_visits INT NOT NULL DEFAULT 30,
  bronze_discount NUMERIC NOT NULL DEFAULT 5,
  silver_discount NUMERIC NOT NULL DEFAULT 10,
  gold_discount NUMERIC NOT NULL DEFAULT 15,
  heisenberg_discount NUMERIC NOT NULL DEFAULT 20,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.loyalty_settings TO authenticated;
GRANT ALL ON public.loyalty_settings TO service_role;
ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "any auth read settings" ON public.loyalty_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "owners write settings" ON public.loyalty_settings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));
INSERT INTO public.loyalty_settings (id) VALUES (1);

-- =====================
-- WHATSAPP SETTINGS
-- =====================
CREATE TABLE public.whatsapp_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  template TEXT NOT NULL DEFAULT 'Hola {nombre}, tu visita en Heisenberg Cuts: Servicio: {servicios} | Pagaste: ${monto} | Cristales ganados: +{cristales_ganados} | Cristales totales: {total_cristales} | Vencen: {fecha_vencimiento} | Tu ID: {id_quimico}. ¡Nos vemos pronto!',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.whatsapp_settings TO authenticated;
GRANT ALL ON public.whatsapp_settings TO service_role;
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "any auth read wa" ON public.whatsapp_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "owners write wa" ON public.whatsapp_settings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));
INSERT INTO public.whatsapp_settings (id) VALUES (1);

-- =====================
-- SERVICES & COMBOS
-- =====================
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  kind public.service_kind NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  commission_pct NUMERIC NOT NULL DEFAULT 50,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "any auth read services" ON public.services FOR SELECT TO authenticated USING (true);
CREATE POLICY "owners manage services" ON public.services
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'owner'));
CREATE POLICY "owners update services" ON public.services
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));
CREATE POLICY "owners delete services" ON public.services
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'owner'));

-- Seed base services and combos
INSERT INTO public.services (name, kind, price, commission_pct, is_locked, display_order) VALUES
  ('Corte de Pelo','base',15,50,true,1),
  ('Corte de Barba','base',10,50,true,2),
  ('Corte de Cejas','base',5,50,true,3),
  ('Pelo + Barba + Cejas','combo',25,50,true,10),
  ('Barba + Cejas','combo',13,50,true,11),
  ('Pelo + Barba','combo',22,50,true,12);

-- =====================
-- CLIENTS
-- =====================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  alias TEXT,
  phone TEXT NOT NULL,
  chem_id TEXT NOT NULL UNIQUE,
  level_symbol TEXT NOT NULL DEFAULT 'Cu', -- starts as Cu (bronze) seq even before first level
  level_seq INT NOT NULL,
  visits_count INT NOT NULL DEFAULT 0,
  crystals_balance INT NOT NULL DEFAULT 0,
  crystals_expire_at TIMESTAMPTZ,
  last_visit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX clients_phone_idx ON public.clients (phone);
CREATE INDEX clients_name_idx ON public.clients (full_name);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update clients" ON public.clients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "owners delete clients" ON public.clients FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'owner'));

-- Sequence helper for chem id
CREATE SEQUENCE public.chem_seq START 100;

-- Create client function
CREATE OR REPLACE FUNCTION public.create_client(_full_name TEXT, _phone TEXT, _alias TEXT DEFAULT NULL)
RETURNS public.clients
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_seq INT;
  new_client public.clients;
BEGIN
  new_seq := nextval('public.chem_seq');
  INSERT INTO public.clients (full_name, phone, alias, chem_id, level_symbol, level_seq)
  VALUES (_full_name, _phone, _alias, 'Cu-' || new_seq, 'Cu', new_seq)
  RETURNING * INTO new_client;
  RETURN new_client;
END; $$;
GRANT EXECUTE ON FUNCTION public.create_client(TEXT,TEXT,TEXT) TO authenticated;

-- =====================
-- TRANSACTIONS
-- =====================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  barber_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  subtotal NUMERIC NOT NULL,
  level_discount_pct NUMERIC NOT NULL DEFAULT 0,
  level_discount_amount NUMERIC NOT NULL DEFAULT 0,
  crystals_redeemed INT NOT NULL DEFAULT 0,
  crystals_discount_amount NUMERIC NOT NULL DEFAULT 0,
  total_paid NUMERIC NOT NULL,
  payment_method public.payment_method NOT NULL,
  commission_total NUMERIC NOT NULL DEFAULT 0,
  owner_net NUMERIC NOT NULL DEFAULT 0,
  crystals_earned INT NOT NULL DEFAULT 0,
  level_after TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX tx_created_idx ON public.transactions (created_at DESC);
CREATE INDEX tx_barber_idx ON public.transactions (barber_id);
CREATE INDEX tx_client_idx ON public.transactions (client_id);
GRANT SELECT, INSERT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads all tx, barber reads own" ON public.transactions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'owner') OR barber_id = auth.uid());
CREATE POLICY "barbers insert own tx" ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (barber_id = auth.uid());

CREATE TABLE public.transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id),
  service_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  commission_pct NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL
);
GRANT SELECT, INSERT ON public.transaction_items TO authenticated;
GRANT ALL ON public.transaction_items TO service_role;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read items if can read parent" ON public.transaction_items
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_id
            AND (public.has_role(auth.uid(),'owner') OR t.barber_id = auth.uid())));
CREATE POLICY "insert items" ON public.transaction_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND t.barber_id = auth.uid()));

-- =====================
-- EXPENSES
-- =====================
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners manage expenses" ON public.expenses
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));

-- =====================
-- REGISTER TRANSACTION (atomic)
-- =====================
CREATE OR REPLACE FUNCTION public.register_transaction(
  _client_id UUID,
  _service_ids UUID[],
  _crystals_to_redeem INT,
  _payment_method public.payment_method
)
RETURNS public.transactions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s public.loyalty_settings;
  cli public.clients;
  svc public.services;
  subtotal NUMERIC := 0;
  level_pct NUMERIC := 0;
  level_discount NUMERIC := 0;
  redeem INT := COALESCE(_crystals_to_redeem,0);
  redeem_disc NUMERIC := 0;
  total NUMERIC := 0;
  comm_total NUMERIC := 0;
  crystals_earned INT := 0;
  new_visits INT;
  new_symbol TEXT;
  tx public.transactions;
  uid UUID := auth.uid();
  effective_balance INT;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO s FROM public.loyalty_settings WHERE id = 1;
  SELECT * INTO cli FROM public.clients WHERE id = _client_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Client not found'; END IF;

  -- Validate services and compute subtotal + commissions (compute later after discount)
  FOR svc IN SELECT * FROM public.services WHERE id = ANY(_service_ids) AND active = true LOOP
    subtotal := subtotal + svc.price;
  END LOOP;

  IF subtotal = 0 THEN RAISE EXCEPTION 'No valid services'; END IF;

  -- Compute level discount based on current visits (BEFORE this visit)
  new_visits := cli.visits_count + 1;
  IF new_visits >= s.heisenberg_visits THEN level_pct := s.heisenberg_discount;
  ELSIF new_visits >= s.gold_visits THEN level_pct := s.gold_discount;
  ELSIF new_visits >= s.silver_visits THEN level_pct := s.silver_discount;
  ELSIF new_visits >= s.bronze_visits THEN level_pct := s.bronze_discount;
  ELSE level_pct := 0; END IF;
  -- But only apply level discount on visits AFTER reaching threshold? Spec: discount applies at level.
  -- Apply discount when current visits_count already met threshold (so first qualifying visit also gets it)
  level_discount := round(subtotal * level_pct / 100, 2);

  -- Crystals expired?
  effective_balance := cli.crystals_balance;
  IF cli.crystals_expire_at IS NOT NULL AND cli.crystals_expire_at < now() THEN
    effective_balance := 0;
  END IF;
  IF redeem > effective_balance THEN RAISE EXCEPTION 'Not enough crystals'; END IF;
  redeem_disc := round(redeem::NUMERIC / s.crystals_redeem_rate, 2);

  total := subtotal - level_discount - redeem_disc;
  IF total < 0 THEN total := 0; END IF;

  -- Commissions: proportional on each item by (item_price / subtotal) * total
  FOR svc IN SELECT * FROM public.services WHERE id = ANY(_service_ids) AND active = true LOOP
    DECLARE
      portion NUMERIC := round(svc.price * total / subtotal, 2);
      comm NUMERIC := round(portion * svc.commission_pct / 100, 2);
    BEGIN
      comm_total := comm_total + comm;
    END;
  END LOOP;

  -- Crystals earned on FINAL paid amount
  crystals_earned := floor(total * s.crystals_per_peso)::INT;

  -- Determine level after
  IF new_visits >= s.heisenberg_visits THEN new_symbol := 'Hs';
  ELSIF new_visits >= s.gold_visits THEN new_symbol := 'Au';
  ELSIF new_visits >= s.silver_visits THEN new_symbol := 'Ag';
  ELSIF new_visits >= s.bronze_visits THEN new_symbol := 'Cu';
  ELSE new_symbol := cli.level_symbol; END IF;

  -- Insert transaction
  INSERT INTO public.transactions(
    client_id, barber_id, subtotal, level_discount_pct, level_discount_amount,
    crystals_redeemed, crystals_discount_amount, total_paid, payment_method,
    commission_total, owner_net, crystals_earned, level_after
  ) VALUES (
    _client_id, uid, subtotal, level_pct, level_discount,
    redeem, redeem_disc, total, _payment_method,
    comm_total, total - comm_total, crystals_earned, new_symbol
  ) RETURNING * INTO tx;

  -- Insert items
  FOR svc IN SELECT * FROM public.services WHERE id = ANY(_service_ids) AND active = true LOOP
    DECLARE
      portion NUMERIC := round(svc.price * total / subtotal, 2);
      comm NUMERIC := round(portion * svc.commission_pct / 100, 2);
    BEGIN
      INSERT INTO public.transaction_items(transaction_id, service_id, service_name, price, commission_pct, commission_amount)
      VALUES (tx.id, svc.id, svc.name, svc.price, svc.commission_pct, comm);
    END;
  END LOOP;

  -- Update client (preserve level_seq, update level_symbol)
  UPDATE public.clients SET
    visits_count = new_visits,
    crystals_balance = effective_balance - redeem + crystals_earned,
    crystals_expire_at = now() + (s.expiry_days || ' days')::interval,
    last_visit_at = now(),
    level_symbol = new_symbol,
    chem_id = new_symbol || '-' || level_seq
  WHERE id = _client_id;

  RETURN tx;
END; $$;
GRANT EXECUTE ON FUNCTION public.register_transaction(UUID,UUID[],INT,public.payment_method) TO authenticated;
