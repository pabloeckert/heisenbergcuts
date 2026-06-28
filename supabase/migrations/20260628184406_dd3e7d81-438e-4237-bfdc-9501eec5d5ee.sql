
DROP POLICY IF EXISTS "auth insert clients" ON public.clients;
DROP POLICY IF EXISTS "auth update clients" ON public.clients;
CREATE POLICY "owners insert clients" ON public.clients
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'owner'));
CREATE POLICY "owners update clients" ON public.clients
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));

DROP POLICY IF EXISTS "barbers insert own tx" ON public.transactions;
-- All transactions must go through public.register_transaction (SECURITY DEFINER).
