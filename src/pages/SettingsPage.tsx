import { useEffect, useState } from "react";
import { Settings, Shield, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function SettingsPage() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [profileName, setProfileName] = useState("");
  const [phone, setPhone] = useState("");
  const [platformName, setPlatformName] = useState("FundiPlug");
  const [commissionRate, setCommissionRate] = useState("15");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commissionData, setCommissionData] = useState<any[]>([]);
  const [totalCommission, setTotalCommission] = useState(0);

  useEffect(() => {
    async function load() {
      if (user) {
        setProfileName(user.name);
        setPhone(user.phone || "");
      }
      if (user?.role === "admin") {
        const { data } = await supabase.from("platform_settings").select("key, value");
        (data || []).forEach(s => {
          if (s.key === "platform_name") setPlatformName(s.value);
          if (s.key === "commission_rate") setCommissionRate(s.value);
        });

        const { data: payments } = await supabase.from("payments").select("commission, created_at").eq("status", "completed");
        const total = (payments || []).reduce((s, p) => s + Number(p.commission || 0), 0);
        setTotalCommission(total);

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyComm: Record<string, number> = {};
        for (let i = 0; i < 6; i++) {
          const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
          monthlyComm[months[d.getMonth()]] = 0;
        }
        (payments || []).forEach(p => {
          const m = months[new Date(p.created_at).getMonth()];
          if (monthlyComm[m] !== undefined) monthlyComm[m] += Number(p.commission || 0);
        });
        setCommissionData(Object.entries(monthlyComm).map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 })));
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    await supabase.from("profiles").update({ name: profileName, phone }).eq("id", user!.id);
    await refreshProfile();
    toast({ title: "Profile updated" });
    setSaving(false);
  };

  const savePlatformSettings = async () => {
    setSaving(true);
    await supabase.from("platform_settings").upsert([
      { key: "platform_name", value: platformName },
      { key: "commission_rate", value: commissionRate },
    ], { onConflict: "key" });
    toast({ title: "Platform settings saved" });
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account and platform settings</p>
      </div>

      <div className="space-y-4">
        <div className="stat-card animate-fade-in">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" /> Profile
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="bg-muted/50 max-w-sm" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-muted/50 max-w-sm" placeholder="+254 712 345 678" />
            </div>
            <Button size="sm" onClick={saveProfile} disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>

        {user?.role === "admin" && (
          <>
            <div className="stat-card animate-fade-in" style={{ animationDelay: "100ms" }}>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" /> Platform Configuration
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Platform Name</Label>
                  <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} className="bg-muted/50 max-w-sm" />
                </div>
                <div className="space-y-2">
                  <Label>Commission Rate (%)</Label>
                  <p className="text-xs text-muted-foreground">Percentage deducted from each customer payment as platform commission</p>
                  <Input type="number" min="0" max="100" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} className="bg-muted/50 max-w-sm" />
                </div>
                <Button size="sm" onClick={savePlatformSettings} disabled={saving}>
                  {saving ? "Saving..." : "Save Platform Settings"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="stat-card animate-fade-in" style={{ animationDelay: "200ms" }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" /> Commission Earned
                  </h3>
                  <p className="text-2xl font-bold text-primary">KSH {totalCommission.toLocaleString()}</p>
                </div>
                {commissionData.some(d => d.amount > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={commissionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 20%)" />
                      <XAxis dataKey="month" stroke="hsl(220, 10%, 46%)" fontSize={12} />
                      <YAxis stroke="hsl(220, 10%, 46%)" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(222, 28%, 12%)", border: "1px solid hsl(222, 20%, 20%)", borderRadius: "8px", color: "hsl(220, 14%, 90%)" }} formatter={(value: any) => [`KSH ${Number(value).toLocaleString()}`, "Commission"]} />
                      <Bar dataKey="amount" fill="hsl(22, 93%, 49%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No commission data yet</div>
                )}
              </div>

              <div className="stat-card animate-fade-in" style={{ animationDelay: "300ms" }}>
                <h3 className="text-lg font-semibold text-foreground mb-4">Commission Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Current Rate</span>
                    <span className="text-lg font-bold text-foreground">{commissionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Total Earned</span>
                    <span className="text-lg font-bold text-primary">KSH {totalCommission.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Commission is automatically deducted from each payment. Workers receive the remaining amount.</p>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="stat-card animate-fade-in" style={{ animationDelay: "400ms" }}>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Security
          </h3>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Email: {user?.email}</p>
            <p className="text-sm text-muted-foreground">Role: <span className="capitalize font-medium text-foreground">{user?.role}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}