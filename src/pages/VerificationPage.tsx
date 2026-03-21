import { useEffect, useState } from "react";
import { Check, X, FileText, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function VerificationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDocs, setViewDocs] = useState<any>(null);
  const [certs, setCerts] = useState<any[]>([]);

  async function loadPending() {
    const { data } = await supabase
      .from("worker_profiles")
      .select("*, profiles:user_id(name, email), certifications(id, name, file_url)")
      .eq("verification_status", "pending")
      .order("created_at", { ascending: false });
    setWorkers(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPending();
    const channel = supabase.channel("verification-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "worker_profiles" }, () => loadPending())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAction = async (workerId: string, userId: string, action: "approved" | "rejected") => {
    await supabase.from("worker_profiles").update({ verification_status: action }).eq("id", workerId);
    await supabase.from("activity_logs").insert({
      user_id: user!.id,
      action: action === "approved" ? "Worker Approved" : "Worker Rejected",
      detail: `Worker ${action}`, entity_type: "worker_profile", entity_id: workerId,
    });
    toast({ title: `Worker ${action}` });
    loadPending();
  };

  const viewDocuments = (worker: any) => {
    setViewDocs(worker);
    setCerts((worker.certifications || []));
  };

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Worker Verification</h1>
        <p className="text-muted-foreground text-sm">Review and approve worker applications</p>
      </div>

      {workers.length > 0 ? (
        <div className="space-y-4">
          {workers.map((w, i) => (
            <div key={w.id} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                    {((w as any).profiles?.name || "W").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{(w as any).profiles?.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{(w as any).profiles?.email}</p>
                    {w.bio && <p className="text-xs text-muted-foreground mt-0.5">{w.bio.substring(0, 80)}...</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" /> {(w.certifications || []).length} docs
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" /> {new Date(w.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => viewDocuments(w)}><Eye className="w-4 h-4 mr-1" /> View</Button>
                    <Button size="sm" className="active:scale-[0.97]" onClick={() => handleAction(w.id, w.user_id, "approved")}><Check className="w-4 h-4 mr-1" /> Approve</Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10 active:scale-[0.97]" onClick={() => handleAction(w.id, w.user_id, "rejected")}><X className="w-4 h-4 mr-1" /> Reject</Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
          <Check className="w-12 h-12 text-green-500 mb-3" />
          <p className="text-foreground font-medium">All caught up!</p>
          <p className="text-sm text-muted-foreground">No pending worker verifications</p>
        </div>
      )}

      <Dialog open={!!viewDocs} onOpenChange={(o) => !o && setViewDocs(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Worker Documents — {viewDocs?.profiles?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-muted/50"><p className="text-muted-foreground text-xs">Bio</p><p className="text-foreground">{viewDocs?.bio || "Not provided"}</p></div>
              <div className="p-3 rounded-lg bg-muted/50"><p className="text-muted-foreground text-xs">Rate</p><p className="text-foreground">{viewDocs?.hourly_rate ? `$${viewDocs.hourly_rate}/hr` : "—"}</p></div>
              <div className="p-3 rounded-lg bg-muted/50"><p className="text-muted-foreground text-xs">Experience</p><p className="text-foreground">{viewDocs?.years_experience || 0} years</p></div>
              <div className="p-3 rounded-lg bg-muted/50"><p className="text-muted-foreground text-xs">Area</p><p className="text-foreground">{viewDocs?.service_area || "—"}</p></div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Uploaded Documents ({certs.length})</h4>
              {certs.length > 0 ? certs.map((cert: any) => (
                <div key={cert.id} className="flex items-center justify-between p-2 rounded bg-muted/50 mb-1">
                  <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /><span className="text-sm">{cert.name}</span></div>
                  {cert.file_url && <a href={cert.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View File</a>}
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
