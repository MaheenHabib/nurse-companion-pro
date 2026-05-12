import { createFileRoute } from "@tanstack/react-router";
import { useNotifications } from "@/lib/notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCheck, Bell } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/alerts")({
  component: AlertsPage,
});

function AlertsPage() {
  const { alerts, unreadCount, markRead, markAllRead, permission, requestBrowserPermission } = useNotifications();

  const sevColor = (s: string) =>
    s === "critical" ? "bg-critical text-critical-foreground" : s === "high" ? "bg-warning text-warning-foreground" : "bg-secondary";

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground mt-1">{unreadCount} unread · live updates enabled</p>
        </div>
        <div className="flex gap-2">
          {permission !== "granted" && permission !== "unsupported" && (
            <Button variant="outline" onClick={requestBrowserPermission}><Bell className="w-4 h-4 mr-2" />Enable browser alerts</Button>
          )}
          <Button onClick={markAllRead} disabled={unreadCount === 0}><CheckCheck className="w-4 h-4 mr-2" />Mark all read</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Inbox</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {alerts.length === 0 && <p className="text-sm text-muted-foreground">No alerts.</p>}
          {alerts.map((a) => (
            <div key={a.id} className={`p-4 rounded-lg border ${a.is_read ? "border-border opacity-70" : "border-primary/40 bg-accent/20"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge className={sevColor(a.severity)}>{a.severity}</Badge>
                    <span className="font-medium">{a.title}</span>
                  </div>
                  {a.message && <div className="text-sm text-muted-foreground mt-1">{a.message}</div>}
                  <div className="text-xs text-muted-foreground mt-1.5">
                    {a.source && <>Source: {a.source} · </>}{format(new Date(a.created_at), "PPp")}
                  </div>
                </div>
                {!a.is_read && <Button size="sm" variant="ghost" onClick={() => markRead(a.id)}>Mark read</Button>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
