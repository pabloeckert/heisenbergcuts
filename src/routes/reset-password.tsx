import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HeisenbergLogo } from "@/components/lab/Logo";
import { ParticleField } from "@/components/lab/ParticleField";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Restablecer contraseña · Heisenberg Cuts" }] }),
  component: ResetPasswordPage,
});

// Reached via the link Supabase emails after resetPasswordForEmail(): it
// drops the user back here with a recovery session already active in the
// URL hash, which supabase-js exchanges automatically on load.
function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Contraseña actualizada");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <ParticleField />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block text-crystal">
            <HeisenbergLogo size={72} />
          </div>
          <h1 className="display text-4xl mt-3 text-crystal">NUEVA CONTRASEÑA</h1>
        </div>
        <form onSubmit={submit} className="metal-panel hex-card p-6 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
              Contraseña nueva
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-input border border-border px-3 py-2 rounded-sm text-foreground focus:outline-none focus:border-crystal"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="drum-button w-full py-3 rounded-sm disabled:opacity-60"
          >
            {loading ? "..." : "Guardar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
