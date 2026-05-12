import { useEffect, useState, createContext, useContext, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export type Alert = {
  id: string;
  patient_id: string | null;
  user_id: string | null;
  severity: string;
  title: string;
  message: string | null;
  source: string | null;
  is_read: boolean;
  created_at: string;
};

type NotifCtx = {
  alerts: Alert[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
  permission: NotificationPermission | "unsupported";
  requestBrowserPermission: () => Promise<void>;
};

const Ctx = createContext<NotifCtx>({
  alerts: [],
  unreadCount: 0,
  markRead: async () => {},
  markAllRead: async () => {},
  refresh: async () => {},
  permission: "unsupported",
  requestBrowserPermission: async () => {},
});

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setAlerts(data as Alert[]);
  };

  useEffect(() => {
    if (!user) {
      setAlerts([]);
      return;
    }
    refresh();
    const ch = supabase
      .channel("alerts-stream")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" }, (payload) => {
        const a = payload.new as Alert;
        if (a.user_id && a.user_id !== user.id) return;
        setAlerts((prev) => [a, ...prev]);
        const isHigh = a.severity === "high" || a.severity === "critical";
        if (isHigh) {
          toast.error(a.title, { description: a.message ?? undefined, duration: 8000 });
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(`🚨 ${a.title}`, { body: a.message ?? "", tag: a.id });
            } catch (e) { console.warn(e); }
          }
        } else {
          toast(a.title, { description: a.message ?? undefined });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const markRead = async (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
    await supabase.from("alerts").update({ is_read: true }).eq("id", id);
  };

  const markAllRead = async () => {
    const ids = alerts.filter((a) => !a.is_read).map((a) => a.id);
    if (!ids.length) return;
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    await supabase.from("alerts").update({ is_read: true }).in("id", ids);
  };

  const requestBrowserPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Browser notifications not supported");
      return;
    }
    const p = await Notification.requestPermission();
    setPermission(p);
    if (p === "granted") toast.success("Browser notifications enabled");
    else toast.warning("Browser notifications declined");
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <Ctx.Provider value={{ alerts, unreadCount, markRead, markAllRead, refresh, permission, requestBrowserPermission }}>
      {children}
    </Ctx.Provider>
  );
}

export const useNotifications = () => useContext(Ctx);
