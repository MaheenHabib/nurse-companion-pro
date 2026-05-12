import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/patients/")({
  component: PatientsList,
});

function PatientsList() {
  const [patients, setPatients] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "", mrn: "", age: "", sex: "M", room: "", ward: "",
    diagnosis: "", attending_physician: "", allergies: "", status: "stable", condition_notes: "",
  });

  const load = () => {
    supabase.from("patients").select("*").order("room").then(({ data }) => setPatients(data ?? []));
  };
  useEffect(() => { load(); }, []);

  const filtered = patients.filter((p) =>
    [p.full_name, p.mrn, p.room, p.diagnosis].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  const submit = async () => {
    if (!form.full_name.trim() || !form.mrn.trim()) return toast.error("Name and MRN required");
    setSaving(true);
    const { error } = await supabase.from("patients").insert({
      full_name: form.full_name,
      mrn: form.mrn,
      age: form.age ? parseInt(form.age) : null,
      sex: form.sex,
      room: form.room,
      ward: form.ward,
      diagnosis: form.diagnosis,
      attending_physician: form.attending_physician,
      allergies: form.allergies,
      status: form.status,
      condition_notes: form.condition_notes,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Patient added");
    setOpen(false);
    setForm({ full_name: "", mrn: "", age: "", sex: "M", room: "", ward: "", diagnosis: "", attending_physician: "", allergies: "", status: "stable", condition_notes: "" });
    load();
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Patients</h1>
          <p className="text-muted-foreground mt-1">{patients.length} patients on your assignment.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="w-4 h-4 mr-2" />Add patient</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add new patient</DialogTitle></DialogHeader>
            <div className="grid md:grid-cols-2 gap-4 py-2">
              <Field label="Full name *"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
              <Field label="MRN *"><Input value={form.mrn} onChange={(e) => setForm({ ...form, mrn: e.target.value })} /></Field>
              <Field label="Age"><Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></Field>
              <Field label="Sex">
                <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="F">F</SelectItem>
                    <SelectItem value="O">O</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Room"><Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></Field>
              <Field label="Ward"><Input value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} /></Field>
              <Field label="Diagnosis" className="md:col-span-2"><Input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} /></Field>
              <Field label="Attending physician"><Input value={form.attending_physician} onChange={(e) => setForm({ ...form, attending_physician: e.target.value })} /></Field>
              <Field label="Allergies"><Input value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} /></Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stable">Stable</SelectItem>
                    <SelectItem value="watch">Watch</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Condition notes" className="md:col-span-2">
                <Textarea rows={3} value={form.condition_notes} onChange={(e) => setForm({ ...form, condition_notes: e.target.value })} />
              </Field>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save patient"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name, MRN, room…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <Link key={p.id} to="/patients/$id" params={{ id: p.id }}>
            <Card className="hover:border-primary/50 transition cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{p.full_name}</CardTitle>
                    <div className="text-xs text-muted-foreground mt-0.5">{p.mrn} · {p.age}{p.sex} · Room {p.room}</div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">{p.diagnosis}</div>
                <div className="text-xs text-muted-foreground mt-2">{p.ward} · Dr. {p.attending_physician?.replace(/^Dr\.\s*/, "")}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && <p className="text-muted-foreground col-span-full">No patients match.</p>}
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="block mb-1.5">{label}</Label>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    stable: "bg-success/15 text-success border-success/30",
    watch: "bg-warning/15 text-warning-foreground border-warning/40",
    critical: "bg-critical/15 text-critical border-critical/30",
  };
  return <Badge variant="outline" className={map[status] ?? ""}>{status}</Badge>;
}
