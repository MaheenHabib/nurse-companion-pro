import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Save, Activity } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";


export const Route = createFileRoute("/_authenticated/handover/")({
  component: HandoverPage,
  validateSearch: (s: Record<string, unknown>) => ({ patientId: (s.patientId as string) || "" }),
});

function HandoverPage() {
  const { patientId: initialId } = Route.useSearch();
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [patientId, setPatientId] = useState<string>(initialId);
  const [shiftFrom, setShiftFrom] = useState("Day");
  const [shiftTo, setShiftTo] = useState("Night");
  const [narrative, setNarrative] = useState("");
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("patients").select("id, full_name, room, mrn").order("room").then(({ data }) => {
      setPatients(data ?? []);
      if (!patientId && data?.length) setPatientId(data[0].id);
    });
  }, []);

  const generate = async () => {
    if (!patientId) return toast.error("Pick a patient");
    setGenerating(true);
    try {
      const [{ data: patient }, { data: vitals }, { data: reminders }] = await Promise.all([
        supabase.from("patients").select("*").eq("id", patientId).maybeSingle(),
        supabase.from("vitals").select("*").eq("patient_id", patientId).order("recorded_at", { ascending: false }).limit(8),
        supabase.from("reminders").select("*").eq("patient_id", patientId).eq("status", "pending"),
      ]);
      const { data, error } = await supabase.functions.invoke("clinical-ai", {
        body: { mode: "handover", patient, vitals, reminders },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setNarrative((data as any).content ?? "");
      toast.success("Handover narrative generated");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  const submit = async () => {
    if (!narrative.trim()) return toast.error("Generate or write a narrative first");
    setSubmitting(true);
    const { error } = await supabase.from("handovers").insert({
      patient_id: patientId,
      shift_from: shiftFrom,
      shift_to: shiftTo,
      narrative,
      status: "submitted",
      submitted_by: user?.id,
      submitted_at: new Date().toISOString(),
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Handover submitted");
    setNarrative("");
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shift Handover</h1>
        <p className="text-muted-foreground mt-1">AI-assisted SBAR narrative — eliminate the broken-telephone effect.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Configure</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">Patient</label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name} · Rm {p.room}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Shift from</label>
            <Select value={shiftFrom} onValueChange={setShiftFrom}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Day">Day</SelectItem>
                <SelectItem value="Evening">Evening</SelectItem>
                <SelectItem value="Night">Night</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Shift to</label>
            <Select value={shiftTo} onValueChange={setShiftTo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Day">Day</SelectItem>
                <SelectItem value="Evening">Evening</SelectItem>
                <SelectItem value="Night">Night</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <DailyHealthCard patientId={patientId} userId={user?.id} />

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Narrative</CardTitle>
          <Button onClick={generate} disabled={generating}>
            <Sparkles className="w-4 h-4 mr-2" /> {generating ? "Generating…" : "Generate with AI"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea rows={12} value={narrative} onChange={(e) => setNarrative(e.target.value)} placeholder="Click Generate, or write your own SBAR narrative." />
          {narrative && (
            <div className="prose prose-sm max-w-none p-4 rounded-lg bg-accent/20 border border-border">
              <ReactMarkdown>{narrative}</ReactMarkdown>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={submit} disabled={submitting || !narrative.trim()}>
              <Save className="w-4 h-4 mr-2" /> {submitting ? "Submitting…" : "Submit handover"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DailyHealthCard({ patientId, userId }: { patientId: string; userId?: string }) {
  const [v, setV] = useState({ hr: "", bp_sys: "", bp_dia: "", spo2: "", resp_rate: "", temp: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!patientId) return toast.error("Pick a patient first");
    setSaving(true);
    const { error } = await supabase.from("vitals").insert({
      patient_id: patientId,
      hr: v.hr ? parseInt(v.hr) : null,
      bp_sys: v.bp_sys ? parseInt(v.bp_sys) : null,
      bp_dia: v.bp_dia ? parseInt(v.bp_dia) : null,
      spo2: v.spo2 ? parseInt(v.spo2) : null,
      resp_rate: v.resp_rate ? parseInt(v.resp_rate) : null,
      temp: v.temp ? parseFloat(v.temp) : null,
      notes: v.notes || null,
      recorded_by: userId,
      recorded_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Daily health record updated");
    setV({ hr: "", bp_sys: "", bp_dia: "", spo2: "", resp_rate: "", temp: "", notes: "" });
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4" /> Update daily health record</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><Label className="block mb-1.5 text-xs">Heart rate (bpm)</Label><Input type="number" value={v.hr} onChange={(e) => setV({ ...v, hr: e.target.value })} /></div>
          <div><Label className="block mb-1.5 text-xs">BP systolic</Label><Input type="number" value={v.bp_sys} onChange={(e) => setV({ ...v, bp_sys: e.target.value })} /></div>
          <div><Label className="block mb-1.5 text-xs">BP diastolic</Label><Input type="number" value={v.bp_dia} onChange={(e) => setV({ ...v, bp_dia: e.target.value })} /></div>
          <div><Label className="block mb-1.5 text-xs">SpO2 (%)</Label><Input type="number" value={v.spo2} onChange={(e) => setV({ ...v, spo2: e.target.value })} /></div>
          <div><Label className="block mb-1.5 text-xs">Resp rate</Label><Input type="number" value={v.resp_rate} onChange={(e) => setV({ ...v, resp_rate: e.target.value })} /></div>
          <div><Label className="block mb-1.5 text-xs">Temp (°C)</Label><Input type="number" step="0.1" value={v.temp} onChange={(e) => setV({ ...v, temp: e.target.value })} /></div>
        </div>
        <div>
          <Label className="block mb-1.5 text-xs">Notes</Label>
          <Textarea rows={2} value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} placeholder="Observations for today's record…" />
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-2" /> {saving ? "Saving…" : "Save record"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
