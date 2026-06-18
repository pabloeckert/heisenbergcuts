import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HeisenbergLogo } from "@/components/lab/Logo";
import { ParticleField } from "@/components/lab/ParticleField";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Acceso · Heisenberg Cuts" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Cuenta creada. Iniciando sesión…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error de autenticación");
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
          <h1 className="display text-5xl mt-3 text-crystal">HEISENBERG CUTS</h1>
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground italic mt-2">
            Tú pides el corte · yo pongo la química
          </p>
        </div>
        <form onSubmit={submit} className="metal-panel hex-card p-6 space-y-4">
          <div className="flex border border-border rounded-sm overflow-hidden">
            {(["signin", "signup"] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-xs uppercase tracking-widest font-display ${mode === m ? "bg-crystal text-[oklch(0.14_0.02_240)]" : "text-muted-foreground"}`}
              >
                {m === "signin" ? "Iniciar sesión" : "Registrarse"}
              </button>
            ))}
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Nombre completo
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-input border border-border px-3 py-2 rounded-sm text-foreground focus:outline-none focus:border-crystal"
              />
            </div>
          )}
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
              Correo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-input border border-border px-3 py-2 rounded-sm text-foreground focus:outline-none focus:border-crystal"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
              Contraseña
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
            {loading ? "..." : mode === "signin" ? "Entrar al laboratorio" : "Cocinar cuenta"}
          </button>
          {mode === "signup" && (
            <p className="text-[11px] text-muted-foreground">
              El primer usuario registrado obtendrá el rol de{" "}
              <span className="text-hazmat">Dueño</span>.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
