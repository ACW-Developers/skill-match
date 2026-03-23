import { useEffect, useState } from "react";
import { Activity, User, Shield, Briefcase, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const iconMap: Record<string, any> = {
  "User Registered": User, "Worker Approved": Shield, "Worker Rejected": Shield,
  "New Booking": Briefcase, "Job Completed": Briefcase, "Payment Processed": Activity,
  "Job Posted": Briefcase, "Job Application": Briefcase, "Role Changed": Shield,
  "User Deactivated": User, "User Activated": User, "User Deleted": User,
  "User Login": User, "Profile Submitted": User, "Worker Selected": Briefcase,
};

const colorMap: Record<string, string> = {
  "User Registered": "text-chart-3", "Worker Approved": "text-green-500",
  "Worker Rejected": "text-destructive", "New Booking": "text-primary",
  "Job Completed": "text-chart-2", "Payment Processed": "text-chart-4",
  "Job Posted": "text-primary", "Job Application": "text-chart-3",
  "Role Changed": "text-chart-5", "User Deactivated": "text-destructive",
  "User Activated": "text-green-500", "User Deleted": "text-destructive",
  "User Login": "text-chart-3", "Profile Submitted": "text-chart-4",
  "Worker Selected": "text-primary",
};

const PAGE_SIZE = 20;

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [chartData, setChartData] = useState<any[]>([]);
  const [page, setPage] = useState(1);

  async function load() {
    const { data } = await supabase
      .from("activity_logs")
      .select("*, profiles:user_id(name)")
      .order("created_at", { ascending: false })
      .limit(500);
    const allLogs = data || [];
    setLogs(allLogs);

    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days[d.toLocaleDateString("en-US", { month: "short", day: "numeric" })] = 0;
    }
    allLogs.forEach(l => {
      const key = new Date(l.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (days[key] !== undefined) days[key]++;
    });
    setChartData(Object.entries(days).map(([date, count]) => ({ date, count })));
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase.channel("activity-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_logs" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const actions = [...new Set(logs.map(l => l.action))];

  const filtered = logs.filter(l => {
    if (actionFilter !== "all" && l.action !== actionFilter) return false;
    if (dateFilter !== "all") {
      const logDate = new Date(l.created_at);
      const now = new Date();
      if (dateFilter === "today" && logDate.toDateString() !== now.toDateString()) return false;
      if (dateFilter === "week") {
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        if (logDate < weekAgo) return false;
      }
      if (dateFilter === "month") {
        const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
        if (logDate < monthAgo) return false;
      }
    }
    if (search && !l.action.toLowerCase().includes(search.toLowerCase()) && !(l as any).profiles?.name?.toLowerCase().includes(search.toLowerCase()) && !l.detail?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, actionFilter, dateFilter]);

  function formatTimestamp(date: string) {
    return new Date(date).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
        <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Activity Logs</h1>
        <p className="text-muted-foreground text-sm">All platform actions, visits, and events</p>
      </div>

      <div className="stat-card animate-fade-in">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> Activity (Last 7 Days)
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 20%)" />
            <XAxis dataKey="date" stroke="hsl(220, 10%, 46%)" fontSize={12} />
            <YAxis stroke="hsl(220, 10%, 46%)" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(222, 28%, 12%)", border: "1px solid hsl(222, 20%, 20%)", borderRadius: "8px", color: "hsl(220, 14%, 90%)" }} />
            <Bar dataKey="count" fill="hsl(22, 93%, 49%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search logs..." className="pl-10 bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48 bg-card"><SelectValue placeholder="Filter by action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-40 bg-card"><SelectValue placeholder="Date range" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Log entries */}
      <div className="stat-card animate-fade-in p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-muted-foreground font-medium">Action</th>
                <th className="text-left p-4 text-muted-foreground font-medium">User</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Details</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? paginated.map((log) => {
                const Icon = iconMap[log.action] || Activity;
                const color = colorMap[log.action] || "text-muted-foreground";
                return (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${color}`} />
                        <span className="text-foreground font-medium">{log.action}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{(log as any).profiles?.name || "System"}</td>
                    <td className="p-4 text-muted-foreground max-w-xs truncate">{log.detail || "-"}</td>
                    <td className="p-4 text-muted-foreground whitespace-nowrap text-xs">
                      {formatTimestamp(log.created_at)}
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground text-sm">No activity logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>
            <span className="text-sm text-foreground font-medium px-2">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}