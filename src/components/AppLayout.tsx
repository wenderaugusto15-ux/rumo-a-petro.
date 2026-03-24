import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Clock, TrendingUp, User,
  Zap, LogOut, Award, CreditCard, Settings, Shield, GraduationCap, Lock
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAssinatura } from "@/hooks/useAssinatura";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import LockedFeatureDialog from "@/components/LockedFeatureDialog";

interface SidebarItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  requiresPro?: boolean;
}

const sidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/app" },
  { icon: BookOpen, label: "Questões", path: "/app/questoes", requiresPro: true },
  { icon: Clock, label: "Simulados", path: "/app/simulados" },
  { icon: TrendingUp, label: "Desempenho", path: "/app/desempenho" },
  { icon: Award, label: "Plano de Estudo", path: "/app/plano", requiresPro: true },
  { icon: GraduationCap, label: "Estudos", path: "/app/estudos", requiresPro: true },
  { icon: CreditCard, label: "Upgrade PRO", path: "/app/upgrade" },
];

const bottomNavItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: "Hoje", path: "/app" },
  { icon: BookOpen, label: "Questões", path: "/app/questoes", requiresPro: true },
  { icon: Clock, label: "Simulados", path: "/app/simulados" },
  { icon: TrendingUp, label: "Análise", path: "/app/desempenho" },
  { icon: User, label: "Perfil", path: "/app/perfil" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { isAssinante } = useAssinatura();
  const navigate = useNavigate();
  const [lockedDialog, setLockedDialog] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const { data: isAdmin } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      return !!data;
    },
    enabled: !!user,
  });

  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = (item: SidebarItem, e: React.MouseEvent) => {
    if (item.requiresPro && !isAssinante) {
      e.preventDefault();
      setLockedDialog(item.label);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border shrink-0 fixed inset-y-0 left-0 z-40">
        <div className="p-5 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-cta flex items-center justify-center">
              <Zap className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="font-extrabold text-sm text-sidebar-foreground">Rumo à Petrobras</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const locked = item.requiresPro && !isAssinante;
            return (
              <Link
                key={item.path}
                to={locked ? "#" : item.path}
                onClick={(e) => handleNavClick(item, e)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  locked
                    ? "text-sidebar-foreground/40 cursor-not-allowed"
                    : isActive(item.path)
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
                {locked && <Lock className="h-3.5 w-3.5 ml-auto text-muted-foreground" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-1">
          {isAdmin && (
            <Link to="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
              <Shield className="h-5 w-5 text-destructive" />
              Painel Admin
            </Link>
          )}
          <Link to="/app/perfil" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
            <Settings className="h-5 w-5" />
            Configurações
          </Link>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pb-20 lg:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <div className="flex items-center justify-around h-16">
          {bottomNavItems.map((item) => {
            const locked = item.requiresPro && !isAssinante;
            return (
              <Link
                key={item.path}
                to={locked ? "#" : item.path}
                onClick={(e) => handleNavClick(item, e)}
                className={`flex flex-col items-center gap-0.5 text-xs font-medium transition-colors px-3 py-1 ${
                  locked
                    ? "text-muted-foreground/40"
                    : isActive(item.path)
                    ? "text-accent"
                    : "text-muted-foreground"
                }`}
              >
                {locked ? <Lock className="h-5 w-5" /> : <item.icon className="h-5 w-5" />}
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <LockedFeatureDialog
        open={!!lockedDialog}
        onOpenChange={(open) => !open && setLockedDialog(null)}
        featureName={lockedDialog ?? ""}
      />
    </div>
  );
}
