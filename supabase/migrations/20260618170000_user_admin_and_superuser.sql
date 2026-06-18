-- =====================
-- HIDDEN SUPERUSER
-- =====================
-- pabloeckert@gmail.com always behaves as 'owner', regardless of whether a
-- user_roles row exists for them. This is a single chokepoint (has_role)
-- rather than touching every "owners ..." policy across the schema.
CREATE OR REPLACE FUNCTION public.is_superuser(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE id = _user_id AND email = 'pabloeckert@gmail.com'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
     OR (_role = 'owner' AND public.is_superuser(_user_id));
$$;

-- =====================
-- OWNERS CAN EDIT ANY PROFILE (was: only own profile)
-- =====================
CREATE POLICY "owners update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'owner'))
  WITH CHECK (public.has_role(auth.uid(),'owner'));

-- =====================
-- USER ABM (owner-only RPCs; SECURITY DEFINER to read auth.users.email
-- and to bypass per-row RLS while still self-checking the caller's role)
-- =====================

-- List every user with their email + role, for the ABM screen. The hidden
-- superuser never appears here, by design.
CREATE OR REPLACE FUNCTION public.list_users()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  alias TEXT,
  phone TEXT,
  email TEXT,
  role public.app_role,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'owner') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
    SELECT p.id, p.full_name, p.alias, p.phone, u.email::TEXT, ur.role, p.created_at
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    LEFT JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE u.email IS DISTINCT FROM 'pabloeckert@gmail.com'
    ORDER BY p.created_at ASC;
END; $$;
GRANT EXECUTE ON FUNCTION public.list_users() TO authenticated;

-- Set (upsert) a user's role. Refuses to touch the hidden superuser.
CREATE OR REPLACE FUNCTION public.admin_set_role(_user_id UUID, _role public.app_role)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'owner') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF public.is_superuser(_user_id) THEN
    RAISE EXCEPTION 'Cannot modify this user';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role);
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_set_role(UUID, public.app_role) TO authenticated;

-- Update another user's profile fields.
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  _user_id UUID, _full_name TEXT, _alias TEXT DEFAULT NULL, _phone TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'owner') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF public.is_superuser(_user_id) THEN
    RAISE EXCEPTION 'Cannot modify this user';
  END IF;
  UPDATE public.profiles SET full_name = _full_name, alias = _alias, phone = _phone
  WHERE id = _user_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- Remove a user's access (no admin API available client-side to delete the
-- actual auth.users row, so this revokes role + profile data — a soft
-- removal that immediately locks them out of every RLS-protected table).
CREATE OR REPLACE FUNCTION public.admin_remove_user(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'owner') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF public.is_superuser(_user_id) THEN
    RAISE EXCEPTION 'Cannot modify this user';
  END IF;
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE id = _user_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_remove_user(UUID) TO authenticated;
