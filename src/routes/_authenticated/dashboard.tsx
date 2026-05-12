import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/lib/notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Users, AlertTriangle, FileText, ArrowRight, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { unreadCount, alerts } = useNotifications();
  const [stats, setStats] = useState({ patients: 0, dueNow: 0, critical: 0, handoversToday: 0 });
  const [dueSoon, setDueSoon] = useState<any[]>([]);

  const load = async () => {
    const [{ count: pCount }, { data: reminders }, { count: critCount }, { count: hCount }] = await Promise.all([
      supabase.from("patients").select("id", { count: "exact", head: true }),
      supabase.from("reminders").select("*, patients(full_name, room)").eq("status", "pending").order("due_at").limit(8),
      supabase.from("patients").select("id", { count: "exact", head: true }).eq("status", "critical"),
      supabase.from("handovers").select("id", { count: "exact", head: true }).eq("status", "submitted").gte("submitted_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString()),
    ]);
    const dueNow = (reminders ?? []).filter((r) => new Date(r.due_at) <= new Date()).length;
    setStats({ patients: pCount ?? 0, dueNow, critical: critCount ?? 0, handoversToday: hCount ?? 0 });
    setDueSoon(reminders ?? []);
  };

  useEffect(() => { load(); }, []);

  const triggerHighPriorityDemo = async () => {
    const { data: pt } = await supabase.from("patients").select("id, full_name").eq("status", "critical").limit(1).maybeSingle();
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("alerts").insert({
      patient_id: pt?.id ?? null,
      user_id: u.user?.id ?? null,
      severity: "critical",
      title: pt ? `🚨 ${pt.full_name}: SpO2 declining` : "🚨 High-priority alert",
      message: "Trend over last 6h: 95% → 89% → 87%. Consider escalation.",
      source: "monitor",
    });
    if (error) toast.error(error.message);
    else toast.success("High-priority alert dispatched");
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ward Dashboard</h1>
          <p className="text-muted-foreground mt-1">Live overview — reduce cognitive load, focus on patients.</p>
        </div>
        <Button onClick={triggerHighPriorityDemo} variant="destructive">
          <AlertTriangle className="w-4 h-4 mr-2" /> Trigger high-priority alert
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="My patients" value={stats.patients} />
        <StatCard icon={Clock} label="Tasks due now" value={stats.dueNow} accent={stats.dueNow > 0 ? "warning" : undefined} />
        <StatCard icon={AlertTriangle} label="Critical pts" value={stats.critical} accent={stats.critical > 0 ? "critical" : undefined} />
        <StatCard icon={FileText} label="Handovers (24h)" value={stats.handoversToday} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming reminders</CardTitle>
            <Link to="/vitals-due" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {dueSoon.length === 0 && <p className="text-sm text-muted-foreground">No pending reminders.</p>}
            {dueSoon.map((r) => {
              const overdue = new Date(r.due_at) < new Date();
              return (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/30 transition">
                  <div className={`w-2 h-2 rounded-full ${r.priority === "high" ? "bg-critical" : r.priority === "medium" ? "bg-warning" : "bg-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{r.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {r.patients?.full_name} · Room {r.patients?.room}
                    </div>
                  </div>
                  <Badge variant={overdue ? "destructive" : "secondary"} className="text-xs">
                    {overdue ? "Overdue · " : ""}{formatDistanceToNow(new Date(r.due_at), { addSuffix: true })}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recent alerts</CardTitle>
            {unreadCount > 0 && <Badge variant="destructive">{unreadCount} new</Badge>}
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.slice(0, 5).length === 0 && <p className="text-sm text-muted-foreground">No alerts yet.</p>}
            {alerts.slice(0, 5).map((a) => (
              <div key={a.id} className="p-3 rounded-lg border border-border">
                <div className="text-sm font-medium">{a.title}</div>
                {a.message && <div className="text-xs text-muted-foreground mt-1">{a.message}</div>}
                <div className="text-[10px] text-muted-foreground mt-1.5">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent?: "warning" | "critical" }) {
  const tone = accent === "critical" ? "text-critical" : accent === "warning" ? "text-warning" : "text-primary";
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl bg-accent/40 flex items-center justify-center ${tone}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
