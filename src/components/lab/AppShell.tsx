import type { ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Scissors, Users, Receipt, BarChart3, FlaskConical, Settings, LogOut, MessageSquareText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { HeisenbergLogo } from "./Logo";
import { ParticleField } from "./ParticleField";

const navAll = [
  { to: "/dashboard", label: "Laboratorio", icon: LayoutDashboard, ownerOnly: false },
  { to: "/register", label: "Atender", icon: Scissors, ownerOnly: false },
  { to: "/clients", label: "Clientes", icon: Users, ownerOnly: false },
  { to: "/transactions", label: "Transacciones", icon: Receipt, ownerOnly: false },
  { to: "/reports", label: "Cash Flow", icon: BarChart3, ownerOnly: true },
  { to: "/services", label: "Servicios", icon: FlaskConical, ownerOnly: true },
  { to: "/settings", label: "Ajustes", icon: Settings, ownerOnly: true },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const nav = navAll.filter((n) => !n.ownerOnly || role === "owner");

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="relative min-h-screen text-foreground">
      <ParticleField />
      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar/80 backdrop-blur">
          <div className="p-5 border-b border-border flex items-center gap-3">
            <span className="text-crystal"><HeisenbergLogo size={42} /></span>
            <div>
              <div className="display text-2xl leading-none">HEISENBERG</div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Cuts · Lab</div>
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {nav.map((n) => {
              const active = path === n.to || path.startsWith(n.to + "/");
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm uppercase tracking-wider font-medium rounded-sm border border-transparent transition-all",
                    active
                      ? "bg-accent text-crystal border-[color-mix(in_oklab,var(--crystal)_40%,transparent)] shadow-[inset_0_0_18px_color-mix(in_oklab,var(--crystal)_25%,transparent)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/40",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-border space-y-2">
            <div className="text-[11px] text-muted-foreground truncate">
              {user?.email}
              <span className="ml-2 text-hazmat uppercase text-[10px]">{role ?? "—"}</span>
            </div>
            <button onClick={signOut} className="w-full text-xs uppercase tracking-wider flex items-center justify-center gap-2 py-2 border border-border hover:border-danger hover:text-danger rounded-sm">
              <LogOut className="w-3.5 h-3.5" /> Salir
            </button>
          </div>
        </aside>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b border-border bg-card/60 backdrop-blur px-4 md:px-8 py-4 flex items-center justify-between">
            <div>
              <div className="display text-xl md:text-2xl text-crystal">HEISENBERG CUTS</div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground italic flex items-center gap-2">
                <MessageSquareText className="w-3 h-3" />
                Tú pides el corte, yo pongo la química
              </div>
            </div>
            <div className="md:hidden">
              <button onClick={signOut} className="text-xs uppercase tracking-wider text-muted-foreground"><LogOut className="w-4 h-4" /></button>
            </div>
          </header>
          {/* mobile nav */}
          <nav className="md:hidden flex overflow-x-auto border-b border-border bg-sidebar/80">
            {nav.map((n) => {
              const active = path === n.to;
              const Icon = n.icon;
              return (
                <Link key={n.to} to={n.to} className={cn("flex flex-col items-center px-3 py-2 text-[10px] uppercase", active ? "text-crystal" : "text-muted-foreground")}>
                  <Icon className="w-4 h-4 mb-1" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function PageTitle({ children, subtitle }: { children: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="display text-4xl md:text-5xl text-foreground">{children}</h1>
      {subtitle && <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>}
    </div>
  );
}

export function HexPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("metal-panel hex-card p-5", className)}>{children}</div>;
}