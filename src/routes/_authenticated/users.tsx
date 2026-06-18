import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { PageTitle, HexPanel } from "@/components/lab/AppShell";
import { Plus, KeyRound, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";

type AppUser = Database["public"]["Functions"]["list_users"]["Returns"][number];

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "Usuarios · Heisenberg Cuts" }] }),
  component: UsersPage,
});

// A second, session-less client: creating a user via signUp() must never
// touch the owner's own session (the default `supabase` client persists to
// localStorage and would log the owner out into the new account).
function scratchClient() {
  const url = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    alias: "",
    phone: "",
    role: "barber" as "owner" | "barber",
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("list_users");
    if (error) toast.error(error.message);
    setUsers(data ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const setRole = async (id: string, role: "owner" | "barber") => {
    const { error } = await supabase.rpc("admin_set_role", { _user_id: id, _role: role });
    if (error) {
      toast.error(error.message);
      return;
    }
    setUsers((u) => u.map((x) => (x.id === id ? { ...x, role } : x)));
    toast.success("Rol actualizado");
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success(`Email de recupero enviado a ${email}`);
  };

  const removeUser = async (id: string, name: string) => {
    if (!window.confirm(`¿Quitar acceso a ${name}? Esto borra su perfil y rol (no se puede deshacer).`)) return;
    const { error } = await supabase.rpc("admin_remove_user", { _user_id: id });
    if (error) {
      toast.error(error.message);
      return;
    }
    setUsers((u) => u.filter((x) => x.id !== id));
    toast.success("Usuario eliminado");
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const scratch = scratchClient();
      const { data, error } = await scratch.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name } },
      });
      if (error) throw error;
      const newId = data.user?.id;
      if (!newId) throw new Error("No se pudo crear el usuario");

      const { error: roleErr } = await supabase.rpc("admin_set_role", { _user_id: newId, _role: form.role });
      if (roleErr) throw roleErr;

      if (form.alias || form.phone) {
        const { error: profErr } = await supabase.rpc("admin_update_profile", {
          _user_id: newId,
          _full_name: form.full_name,
          _alias: form.alias || undefined,
          _phone: form.phone || undefined,
        });
        if (profErr) throw profErr;
      }

      toast.success(`Usuario creado: ${form.email}`);
      setOpen(false);
      setForm({ email: "", password: "", full_name: "", alias: "", phone: "", role: "barber" });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear usuario");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-6 flex-wrap gap-4">
        <PageTitle subtitle="ABM de acceso al laboratorio">USUARIOS</PageTitle>
        <button
          onClick={() => setOpen(true)}
          className="drum-button px-4 py-2.5 rounded-sm flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Nuevo usuario
        </button>
      </div>

      <HexPanel className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sidebar text-[11px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Teléfono</th>
              <th className="text-left p-3">Rol</th>
              <th className="text-right p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border hover:bg-accent/40">
                <td className="p-3">
                  {u.full_name || "—"}
                  {u.alias && <span className="text-muted-foreground text-xs"> · {u.alias}</span>}
                </td>
                <td className="p-3 text-muted-foreground">{u.email}</td>
                <td className="p-3 text-muted-foreground">{u.phone || "—"}</td>
                <td className="p-3">
                  <select
                    value={u.role ?? "barber"}
                    onChange={(e) => setRole(u.id, e.target.value as "owner" | "barber")}
                    className="bg-input border border-border px-2 py-1 rounded-sm text-xs uppercase tracking-wider focus:outline-none focus:border-crystal"
                  >
                    <option value="barber">Barbero</option>
                    <option value="owner">Dueño</option>
                  </select>
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      title="Restablecer contraseña"
                      onClick={() => resetPassword(u.email)}
                      className="p-2 border border-border rounded-sm hover:border-crystal hover:text-crystal"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Eliminar"
                      onClick={() => removeUser(u.id, u.full_name || u.email)}
                      className="p-2 border border-border rounded-sm hover:border-danger hover:text-danger"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  Sin usuarios para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </HexPanel>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={createUser}
            onClick={(e) => e.stopPropagation()}
            className="metal-panel hex-card p-6 w-full max-w-md space-y-4"
          >
            <div className="display text-2xl text-crystal flex items-center gap-2">
              <UserCog className="w-5 h-5" /> NUEVO USUARIO
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Nombre completo</label>
              <input
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full bg-input border border-border px-3 py-2 rounded-sm"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Correo</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-input border border-border px-3 py-2 rounded-sm"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Contraseña inicial</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-input border border-border px-3 py-2 rounded-sm"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Teléfono (opcional)</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-input border border-border px-3 py-2 rounded-sm"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Rol</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as "owner" | "barber" })}
                className="w-full bg-input border border-border px-3 py-2 rounded-sm"
              >
                <option value="barber">Barbero</option>
                <option value="owner">Dueño</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground"
              >
                Cancelar
              </button>
              <button type="submit" disabled={creating} className="drum-button px-5 py-2.5 rounded-sm text-sm disabled:opacity-60">
                {creating ? "..." : "Crear usuario"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
