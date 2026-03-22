import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, TrendingUp, DollarSign, ArrowUpRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function WorkerEarningsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pending, setPending] = useState(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data } = await supabase
        .from("payments")
        .select("*, jobs:job_id(title)")
        .eq("payee_id", user!.id)
        .order("created_at", { ascending: false });
      const all = data || [];
      setPayments(all);
      setTotal(all.filter(p => p.status === "completed").reduce((s, p) => s + Number(p.amount), 0));
      setPending(all.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0));

      // Weekly earnings chart
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayCounts: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        dayCounts[days[d.getDay()]] = 0;
      }
      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      all.filter(p => p.status === "completed" && new Date(p.created_at) >= sevenDaysAgo).forEach(p => {
        const day = days[new Date(p.created_at).getDay()];
        dayCounts[day] = (dayCounts[day] || 0) + Number(p.amount);
      });
      setWeeklyData(Object.entries(dayCounts).map(([day, amount]) => ({ day, amount })));
      setLoading(false);
    }
    load();
  }, [user]);

  if (loading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 rounded-xl" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Earnings</h1>
        <p className="text-muted-foreground text-sm">Track your income from completed jobs</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className="text-3xl font-bold text-foreground tabular-nums">${total.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
        <div className="stat-card animate-fade-in" style={{ animationDelay: "80ms" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-3xl font-bold text-foreground tabular-nums">${pending.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-chart-4/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-chart-4" />
            </div>
          </div>
        </div>
        <div className="stat-card animate-fade-in" style={{ animationDelay: "160ms" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-3xl font-bold text-foreground tabular-nums">{payments.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-chart-2/10 flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-chart-2" />
            </div>
          </div>
        </div>
      </div>

      <div className="stat-card animate-fade-in" style={{ animationDelay: "200ms" }}>
        <h3 className="text-lg font-semibold text-foreground mb-4">Weekly Earnings</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={weeklyData}>
            <defs>
              <linearGradient id="earnGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(22, 93%, 49%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(22, 93%, 49%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 20%)" />
            <XAxis dataKey="day" stroke="hsl(220, 10%, 46%)" fontSize={12} />
            <YAxis stroke="hsl(220, 10%, 46%)" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(222, 28%, 12%)", border: "1px solid hsl(222, 20%, 20%)", borderRadius: "8px", color: "hsl(220, 14%, 90%)" }} />
            <Area type="monotone" dataKey="amount" stroke="hsl(22, 93%, 49%)" fill="url(#earnGrad2)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {payments.length > 0 ? (
        <div className="stat-card overflow-hidden p-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-muted-foreground font-medium">Job</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Earned</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Commission</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="p-4 text-foreground">{(p as any).jobs?.title || "—"}</td>
                  <td className="p-4 text-foreground tabular-nums">${Number(p.amount).toLocaleString()}</td>
                  <td className="p-4 text-muted-foreground tabular-nums">${Number(p.commission || 0).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                      p.status === "completed" ? "bg-green-500/10 text-green-500" :
                      p.status === "pending" ? "bg-chart-4/10 text-chart-4" :
                      "bg-destructive/10 text-destructive"
                    }`}>{p.status}</span>
                  </td>
                  <td className="p-4 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="stat-card flex flex-col items-center py-16 text-center">
          <CreditCard className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-foreground font-medium">No earnings yet</p>
          <p className="text-sm text-muted-foreground">Complete jobs to start earning</p>
        </div>
      )}
    </div>
  );
}
