import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/patients/")({
  component: PatientsList,
});

function PatientsList() {
  const [patients, setPatients] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("patients").select("*").order("room").then(({ data }) => setPatients(data ?? []));
  }, []);

  const filtered = patients.filter((p) =>
    [p.full_name, p.mrn, p.room, p.diagnosis].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Patients</h1>
        <p className="text-muted-foreground mt-1">{patients.length} patients on your assignment.</p>
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    stable: "bg-success/15 text-success border-success/30",
    watch: "bg-warning/15 text-warning-foreground border-warning/40",
    critical: "bg-critical/15 text-critical border-critical/30",
  };
  return <Badge variant="outline" className={map[status] ?? ""}>{status}</Badge>;
}
