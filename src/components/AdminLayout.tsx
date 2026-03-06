import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Layers, Route, MessageSquare,
  Calendar, CreditCard, ArrowLeft, Zap, Shield
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Visão Geral", path: "/admin" },
  { icon: Shield, label: "Usuários", path: "/admin/usuarios" },
  { icon: BookOpen, label: "Questões", path: "/admin/questoes" },
  { icon: Layers, label: "Matérias & Assuntos", path: "/admin/materias" },
  { icon: BookOpen, label: "Estudos", path: "/admin/estudos" },
  { icon: Route, label: "Áreas Específicas", path: "/admin/trilhas" },
  { icon: MessageSquare, label: "Depoimentos", path: "/admin/depoimentos" },
  { icon: Calendar, label: "Config Global", path: "/admin/config" },
  { icon: CreditCard, label: "Planos & Limites", path: "/admin/planos" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border shrink-0 fixed inset-y-0 left-0 z-40">
        <div className="p-5 border-b border-sidebar-border">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-destructive/20 flex items-center justify-center">
              <Shield className="h-4 w-4 text-destructive" />
            </div>
            <span className="font-extrabold text-sm text-sidebar-foreground">Admin Panel</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <Link
            to="/app"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar ao App
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive" />
            <span className="font-bold text-sm text-sidebar-foreground">Admin</span>
          </div>
          <Link to="/app" className="text-xs text-sidebar-foreground/70">← App</Link>
        </div>
        <div className="flex overflow-x-auto gap-1 px-3 pb-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isActive(item.path)
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/60"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <main className="flex-1 lg:ml-64 pt-24 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
