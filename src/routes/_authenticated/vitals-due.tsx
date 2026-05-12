import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vitals-due")({
  component: VitalsDuePage,
});

function VitalsDuePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reminders")
      .select("*, patients(id, full_name, room, mrn, status)")
      .eq("status", "pending")
      .order("due_at");
    setItems(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const complete = async (id: string) => {
    const { error } = await supabase.from("reminders").update({ status: "done" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Marked complete");
    load();
  };

  if (loading) return <div className="p-8">Loading…</div>;

  const now = new Date();
  const overdue = items.filter((r) => new Date(r.due_at) <= now);
  const upcoming = items.filter((r) => new Date(r.due_at) > now);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vitals & Tasks Due</h1>
        <p className="text-muted-foreground mt-1">Active monitoring · {items.length} pending</p>
      </div>

      <Section title={`Overdue (${overdue.length})`} tone="critical">
        {overdue.map((r) => <Row key={r.id} r={r} onDone={complete} overdue />)}
        {overdue.length === 0 && <p className="text-sm text-muted-foreground p-3">Nothing overdue. Great work.</p>}
      </Section>

      <Section title={`Upcoming (${upcoming.length})`}>
        {upcoming.map((r) => <Row key={r.id} r={r} onDone={complete} />)}
        {upcoming.length === 0 && <p className="text-sm text-muted-foreground p-3">No upcoming reminders.</p>}
      </Section>
    </div>
  );
}

function Section({ title, tone, children }: { title: string; tone?: "critical"; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle className={`text-base ${tone === "critical" ? "text-critical" : ""}`}>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

function Row({ r, onDone, overdue }: { r: any; onDone: (id: string) => void; overdue?: boolean }) {
  const due = new Date(r.due_at);
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/20">
      <div className={`w-2 h-2 rounded-full ${r.priority === "high" ? "bg-critical" : r.priority === "medium" ? "bg-warning" : "bg-muted-foreground"}`} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm flex items-center gap-2">
          {r.title}
          {r.priority === "high" && <Badge variant="destructive" className="text-[10px] h-4 px-1">HIGH</Badge>}
        </div>
        <div className="text-xs text-muted-foreground">
          <Link to="/patients/$id" params={{ id: r.patients?.id }} className="hover:underline">
            {r.patients?.full_name} · Room {r.patients?.room}
          </Link>
          {r.description && ` · ${r.description}`}
        </div>
      </div>
      <div className="text-right text-xs">
        <div className={overdue ? "text-critical font-medium" : "text-muted-foreground"}>
          {formatDistanceToNow(due, { addSuffix: true })}
        </div>
        <div className="text-muted-foreground">{format(due, "HH:mm")}</div>
      </div>
      <Button size="sm" variant="outline" onClick={() => onDone(r.id)}>
        <Check className="w-4 h-4" />
      </Button>
    </div>
  );
}
