import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Users, Activity, FileText, MessageSquareWarning,
  Bell, User as UserIcon, LogOut, Stethoscope, Archive,
} from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: AuthLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "My Patients", icon: Users },
  { to: "/vitals-due", label: "Vitals Due", icon: Activity },
  { to: "/handover", label: "Handover", icon: FileText },
  { to: "/handover/records", label: "Submitted Records", icon: Archive },
  { to: "/doctor-query", label: "Doctor Query", icon: MessageSquareWarning },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/profile", label: "Profile", icon: UserIcon },
] as const;

function AuthLayout() {
  const { user, loading } = useAuth();
  const { unreadCount, permission, requestBrowserPermission } = useNotifications();
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  if (!user) return null;

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    nav({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="p-5 border-b border-sidebar-border flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-sidebar-foreground">NurseBot</div>
            <div className="text-xs text-muted-foreground">Ward assistant</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1">{label}</span>
                {to === "/alerts" && unreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-xs">{unreadCount}</Badge>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-2">
          {permission !== "granted" && permission !== "unsupported" && (
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={requestBrowserPermission}>
              Enable browser alerts
            </Button>
          )}
          <div className="text-xs text-muted-foreground truncate px-1">{user.email}</div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
