import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { permission, requestBrowserPermission } = useNotifications();
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      setProfile(data ?? { id: user.id, full_name: "", role: "Registered Nurse", ward: "", shift: "Day", phone: "", notif_high_priority: true, notif_vitals: true, notif_handover: true, notif_doctor_reply: true });
    });
  }, [user?.id]);

  const save = async () => {
    if (!user || !profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ ...profile, id: user.id, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
  };

  if (!profile) return <div className="p-8">Loading…</div>;
  const set = (k: string, v: any) => setProfile({ ...profile, [k]: v });

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">Personalize your account and notifications.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Personal info</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div><Label>Full name</Label><Input value={profile.full_name ?? ""} onChange={(e) => set("full_name", e.target.value)} /></div>
          <div><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
          <div><Label>Role</Label><Input value={profile.role ?? ""} onChange={(e) => set("role", e.target.value)} /></div>
          <div><Label>Ward</Label><Input value={profile.ward ?? ""} onChange={(e) => set("ward", e.target.value)} placeholder="e.g. Cardiology 3W" /></div>
          <div>
            <Label>Shift</Label>
            <Select value={profile.shift ?? "Day"} onValueChange={(v) => set("shift", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Day">Day</SelectItem>
                <SelectItem value="Evening">Evening</SelectItem>
                <SelectItem value="Night">Night</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Phone</Label><Input value={profile.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Notification preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {permission !== "granted" && permission !== "unsupported" && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border">
              <div className="text-sm">Browser notifications are off. Enable them so you don't miss high-priority alerts.</div>
              <Button size="sm" onClick={requestBrowserPermission}><Bell className="w-4 h-4 mr-2" />Enable</Button>
            </div>
          )}
          <Pref label="High-priority alerts" desc="Critical patient changes" v={profile.notif_high_priority} onChange={(v) => set("notif_high_priority", v)} />
          <Pref label="Vitals reminders" desc="Scheduled vitals checks" v={profile.notif_vitals} onChange={(v) => set("notif_vitals", v)} />
          <Pref label="Handover updates" desc="When handovers are submitted" v={profile.notif_handover} onChange={(v) => set("notif_handover", v)} />
          <Pref label="Doctor responses" desc="Replies to your queries" v={profile.notif_doctor_reply} onChange={(v) => set("notif_doctor_reply", v)} />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </div>
    </div>
  );
}

function Pref({ label, desc, v, onChange }: { label: string; desc: string; v: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={!!v} onCheckedChange={onChange} />
    </div>
  );
}
