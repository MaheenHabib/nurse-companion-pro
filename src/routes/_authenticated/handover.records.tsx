import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/_authenticated/handover/records")({
  component: HandoverRecords,
});

function HandoverRecords() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("handovers")
      .select("*, patients(full_name, room, mrn)")
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false })
      .then(({ data }) => setItems(data ?? []));
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Submitted Handover Records</h1>
        <p className="text-muted-foreground mt-1">{items.length} submitted handover{items.length === 1 ? "" : "s"}.</p>
      </div>

      {items.length === 0 && (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No handovers submitted yet.</CardContent></Card>
      )}

      <div className="space-y-3">
        {items.map((h) => {
          const isOpen = open === h.id;
          return (
            <Card key={h.id}>
              <CardHeader className="cursor-pointer" onClick={() => setOpen(isOpen ? null : h.id)}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">
                      {h.patients?.full_name} <span className="text-muted-foreground font-normal text-sm">· Rm {h.patients?.room}</span>
                    </CardTitle>
                    <div className="text-xs text-muted-foreground mt-1">
                      {h.shift_from} → {h.shift_to} · Submitted {h.submitted_at ? format(new Date(h.submitted_at), "PPp") : "—"}
                    </div>
                  </div>
                  <Badge variant="secondary">{isOpen ? "Hide" : "View"}</Badge>
                </div>
              </CardHeader>
              {isOpen && (
                <CardContent>
                  <div className="prose prose-sm max-w-none p-4 rounded-lg bg-accent/20 border border-border">
                    <ReactMarkdown>{h.narrative ?? ""}</ReactMarkdown>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
