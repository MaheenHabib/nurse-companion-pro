import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Activity, FileText, MessageSquareWarning, Heart, Thermometer, Droplet, Wind } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/patients/$id")({
  component: PatientProfile,
});

function PatientProfile() {
  const { id } = Route.useParams();
  const [patient, setPatient] = useState<any>(null);
  const [vitals, setVitals] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("patients").select("*").eq("id", id).maybeSingle(),
      supabase.from("vitals").select("*").eq("patient_id", id).order("recorded_at", { ascending: false }).limit(10),
      supabase.from("reminders").select("*").eq("patient_id", id).eq("status", "pending").order("due_at"),
    ]).then(([p, v, r]) => {
      setPatient(p.data);
      setVitals(v.data ?? []);
      setReminders(r.data ?? []);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="p-8">Loading…</div>;
  if (!patient) return <div className="p-8">Patient not found. <Link to="/patients" className="text-primary underline">Back</Link></div>;

  const latest = vitals[0];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <Link to="/patients" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4 mr-1" /> All patients
      </Link>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{patient.full_name}</h1>
                <Badge variant="outline">{patient.status}</Badge>
              </div>
              <div className="text-muted-foreground mt-1">
                {patient.mrn} · {patient.age}{patient.sex} · Room {patient.room} · {patient.ward}
              </div>
              <div className="mt-3 text-sm">
                <span className="font-medium">Diagnosis:</span> {patient.diagnosis}
              </div>
              <div className="text-sm mt-1"><span className="font-medium">Attending:</span> {patient.attending_physician}</div>
              <div className="text-sm mt-1"><span className="font-medium">Allergies:</span> {patient.allergies}</div>
              <div className="text-sm mt-1"><span className="font-medium">Admitted:</span> {patient.admission_date}</div>
            </div>
            <div className="flex flex-col gap-2">
              <Link to="/handover" search={{ patientId: patient.id } as any}><Button variant="outline" size="sm" className="w-full"><FileText className="w-4 h-4 mr-2" />Generate handover</Button></Link>
              <Link to="/doctor-query" search={{ patientId: patient.id } as any}><Button variant="outline" size="sm" className="w-full"><MessageSquareWarning className="w-4 h-4 mr-2" />Doctor query</Button></Link>
            </div>
          </div>
          {patient.condition_notes && (
            <div className="mt-4 p-3 bg-accent/30 rounded-lg text-sm">
              <span className="font-medium">Condition notes:</span> {patient.condition_notes}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Latest vitals</CardTitle></CardHeader>
          <CardContent>
            {!latest ? <p className="text-sm text-muted-foreground">No vitals recorded.</p> : (
              <div className="grid grid-cols-2 gap-3">
                <Vital icon={Heart} label="Heart rate" value={`${latest.hr} bpm`} />
                <Vital icon={Activity} label="Blood pressure" value={`${latest.bp_sys}/${latest.bp_dia}`} />
                <Vital icon={Droplet} label="SpO2" value={`${latest.spo2}%`} />
                <Vital icon={Wind} label="Resp rate" value={`${latest.resp_rate}/min`} />
                <Vital icon={Thermometer} label="Temp" value={`${latest.temp}°C`} />
                <div className="col-span-2 text-xs text-muted-foreground">
                  Recorded {format(new Date(latest.recorded_at), "PPp")}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Vitals trend (last 10)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {vitals.map((v) => (
                <div key={v.id} className="text-xs grid grid-cols-6 gap-2 py-1.5 border-b border-border last:border-0">
                  <span className="text-muted-foreground col-span-2">{format(new Date(v.recorded_at), "MMM d HH:mm")}</span>
                  <span>HR {v.hr}</span>
                  <span>BP {v.bp_sys}/{v.bp_dia}</span>
                  <span>SpO2 {v.spo2}</span>
                  <span>T {v.temp}</span>
                </div>
              ))}
              {vitals.length === 0 && <p className="text-sm text-muted-foreground">No vitals.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Pending reminders</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {reminders.length === 0 && <p className="text-sm text-muted-foreground">No pending reminders.</p>}
          {reminders.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <div className="font-medium text-sm">{r.title}</div>
                <div className="text-xs text-muted-foreground">{r.description ?? r.type}</div>
              </div>
              <Badge variant="secondary">{format(new Date(r.due_at), "HH:mm")}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Vital({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/20">
      <Icon className="w-5 h-5 text-primary" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}
