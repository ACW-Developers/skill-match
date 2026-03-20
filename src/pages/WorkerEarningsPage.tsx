import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, TrendingUp, DollarSign } from "lucide-react";

export default function WorkerEarningsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

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

      <div className="stat-card animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Earnings</p>
            <p className="text-3xl font-bold text-foreground tabular-nums">${total.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      {payments.length > 0 ? (
        <div className="stat-card overflow-hidden p-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-muted-foreground font-medium">Job</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Amount</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="p-4 text-foreground">{(p as any).jobs?.title || "—"}</td>
                  <td className="p-4 text-foreground tabular-nums">${Number(p.amount).toLocaleString()}</td>
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
