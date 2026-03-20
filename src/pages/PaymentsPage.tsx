import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function PaymentsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!user) return;
    async function load() {
      let query = supabase.from("payments").select("*, jobs:job_id(title)").order("created_at", { ascending: false });
      if (!isAdmin) {
        // For customers, show payments they made
        query = query.eq("payer_id", user!.id);
      }
      const { data } = await query;

      // Get payer/payee names
      const allIds = [...new Set((data || []).flatMap(p => [p.payer_id, p.payee_id]))];
      const { data: profiles } = allIds.length > 0 ? await supabase.from("profiles").select("id, name").in("id", allIds) : { data: [] };
      const nameMap: Record<string, string> = {};
      (profiles || []).forEach(p => { nameMap[p.id] = p.name; });

      setPayments((data || []).map(p => ({
        ...p,
        payerName: nameMap[p.payer_id] || "—",
        payeeName: nameMap[p.payee_id] || "—",
        jobTitle: (p as any).jobs?.title || "—",
      })));
      setLoading(false);
    }
    load();
  }, [user]);

  const filtered = payments.filter(p =>
    p.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
    p.payerName.toLowerCase().includes(search.toLowerCase()) ||
    p.payeeName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 rounded-xl" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground text-sm">{isAdmin ? "All platform transactions" : "Your payment history"}</p>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search payments..." className="pl-10 bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {filtered.length > 0 ? (
        <div className="stat-card overflow-hidden p-0 animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 text-muted-foreground font-medium">Job</th>
                  {isAdmin && <th className="text-left p-4 text-muted-foreground font-medium">Payer</th>}
                  {isAdmin && <th className="text-left p-4 text-muted-foreground font-medium">Payee</th>}
                  <th className="text-left p-4 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Commission</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4 text-foreground">{p.jobTitle}</td>
                    {isAdmin && <td className="p-4 text-muted-foreground">{p.payerName}</td>}
                    {isAdmin && <td className="p-4 text-muted-foreground">{p.payeeName}</td>}
                    <td className="p-4 text-foreground tabular-nums">${Number(p.amount).toLocaleString()}</td>
                    <td className="p-4 text-muted-foreground tabular-nums">{p.commission ? `$${Number(p.commission).toLocaleString()}` : "—"}</td>
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
        </div>
      ) : (
        <div className="stat-card flex flex-col items-center py-16 text-center">
          <CreditCard className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-foreground font-medium">No payments yet</p>
          <p className="text-sm text-muted-foreground">Transaction records will appear here</p>
        </div>
      )}
    </div>
  );
}
