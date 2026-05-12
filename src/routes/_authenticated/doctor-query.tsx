import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/doctor-query")({
  component: DoctorQuery,
  validateSearch: (s: Record<string, unknown>) => ({ patientId: (s.patientId as string) || "" }),
});

function DoctorQuery() {
  const { patientId: initialId } = Route.useSearch();
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [patientId, setPatientId] = useState(initialId);
  const [observation, setObservation] = useState("");
  const [insight, setInsight] = useState("");
  const [urgency, setUrgency] = useState("routine");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const loadHistory = async () => {
    const { data } = await supabase
      .from("doctor_queries")
      .select("*, patients(full_name, room)")
      .order("created_at", { ascending: false })
      .limit(10);
    setHistory(data ?? []);
  };

  useEffect(() => {
    supabase.from("patients").select("id, full_name, room").order("room").then(({ data }) => {
      setPatients(data ?? []);
      if (!patientId && data?.length) setPatientId(data[0].id);
    });
    loadHistory();
  }, []);

  const generate = async () => {
    if (!patientId || !observation.trim()) return toast.error("Pick patient and describe the observation");
    setLoading(true);
    try {
      const [{ data: patient }, { data: vitals }] = await Promise.all([
        supabase.from("patients").select("*").eq("id", patientId).maybeSingle(),
        supabase.from("vitals").select("*").eq("patient_id", patientId).order("recorded_at", { ascending: false }).limit(6),
      ]);
      const { data, error } = await supabase.functions.invoke("clinical-ai", {
        body: { mode: "doctor_query", patient, vitals, observation },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setInsight((data as any).content ?? "");
      const text = ((data as any).content ?? "").toLowerCase();
      setUrgency(text.includes("emergent") ? "emergent" : text.includes("urgent") ? "urgent" : "routine");
      toast.success("Pre-flight briefing generated");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  const sendQuery = async () => {
    if (!insight) return toast.error("Generate the briefing first");
    const { error } = await supabase.from("doctor_queries").insert({
      patient_id: patientId,
      nurse_id: user?.id,
      observation,
      ai_insight: insight,
      urgency,
      status: "open",
    });
    if (error) return toast.error(error.message);

    // Auto-create alert if urgency is urgent/emergent
    if (urgency !== "routine") {
      await supabase.from("alerts").insert({
        patient_id: patientId,
        user_id: user?.id,
        severity: urgency === "emergent" ? "critical" : "high",
        title: `Query escalated: ${urgency}`,
        message: observation.slice(0, 140),
        source: "doctor_query",
      });
    }
    toast.success("Query logged for the on-call physician");
    setObservation("");
    setInsight("");
    loadHistory();
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Doctor Query</h1>
        <p className="text-muted-foreground mt-1">Pre-flight briefing — be ready before you call.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">New query</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Patient</label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name} · Rm {p.room}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Your observation</label>
            <Textarea rows={4} value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="e.g. Pt's SpO2 has trended from 95% to 87% over 6h, mildly increased work of breathing, no fever." />
          </div>
          <div className="flex justify-end">
            <Button onClick={generate} disabled={loading}>
              <Sparkles className="w-4 h-4 mr-2" /> {loading ? "Thinking…" : "Generate AI briefing"}
            </Button>
          </div>
          {insight && (
            <div className="space-y-3">
              <div className="prose prose-sm max-w-none p-4 rounded-lg bg-accent/20 border border-border">
                <ReactMarkdown>{insight}</ReactMarkdown>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm">Urgency:</span>
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="emergent">Emergent</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={sendQuery} className="ml-auto">
                  <Send className="w-4 h-4 mr-2" /> Send to physician
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent queries</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {history.length === 0 && <p className="text-sm text-muted-foreground">No queries yet.</p>}
          {history.map((q) => (
            <div key={q.id} className="p-3 border border-border rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{q.patients?.full_name} · Rm {q.patients?.room}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(q.created_at), "PPp")}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{q.observation}</div>
              <div className="text-xs mt-2">
                <span className="font-medium">Urgency:</span> {q.urgency} · <span className="font-medium">Status:</span> {q.status}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
