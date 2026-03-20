import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, MapPin, DollarSign, Clock, Search, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WorkerMyJobsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [assignedJobs, setAssignedJobs] = useState<any[]>([]);
  const [applyDialog, setApplyDialog] = useState<any>(null);
  const [coverNote, setCoverNote] = useState("");
  const [proposedRate, setProposedRate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    if (!user) return;
    const [availRes, appsRes, assignedRes] = await Promise.all([
      supabase.from("jobs").select("*, service_categories:category_id(name, icon), profiles:customer_id(name)").eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("job_applications").select("*, jobs:job_id(title, budget, status, address, profiles:customer_id(name))").eq("worker_id", user.id).order("created_at", { ascending: false }),
      supabase.from("jobs").select("*, service_categories:category_id(name, icon), profiles:customer_id(name)").eq("worker_id", user.id).in("status", ["accepted", "in_progress", "completed"]).order("created_at", { ascending: false }),
    ]);

    // Filter out jobs the worker already applied to
    const appliedJobIds = new Set((appsRes.data || []).map((a: any) => a.job_id));
    setAvailableJobs((availRes.data || []).filter((j: any) => !appliedJobIds.has(j.id)));
    setMyApplications(appsRes.data || []);
    setAssignedJobs(assignedRes.data || []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [user]);

  const applyToJob = async () => {
    if (!applyDialog || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from("job_applications").insert({
      job_id: applyDialog.id,
      worker_id: user.id,
      cover_note: coverNote || null,
      proposed_rate: proposedRate ? Number(proposedRate) : null,
    });
    if (error) {
      toast({ title: "Application failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Application sent!" });
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        action: "Job Application",
        detail: `Applied to "${applyDialog.title}"`,
        entity_type: "job",
        entity_id: applyDialog.id,
      });
    }
    setApplyDialog(null);
    setCoverNote("");
    setProposedRate("");
    setSubmitting(false);
    loadData();
  };

  const updateJobStatus = async (jobId: string, status: string) => {
    await supabase.from("jobs").update({ status: status as any }).eq("id", jobId);
    toast({ title: `Job marked as ${status.replace("_", " ")}` });
    loadData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Jobs</h1>
        <p className="text-muted-foreground text-sm">Browse available jobs and manage your applications</p>
      </div>

      <Tabs defaultValue="available" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="available">Available ({availableJobs.length})</TabsTrigger>
          <TabsTrigger value="applications">Applications ({myApplications.length})</TabsTrigger>
          <TabsTrigger value="assigned">Assigned ({assignedJobs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {availableJobs.length > 0 ? availableJobs.map((job, i) => (
            <div key={job.id} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{(job as any).service_categories?.icon || "🔧"}</span>
                    <h3 className="font-semibold text-foreground">{job.title}</h3>
                  </div>
                  {job.description && <p className="text-sm text-muted-foreground">{job.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.address || "No location"}</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {job.budget ? `$${job.budget}` : "Open"}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(job.created_at).toLocaleDateString()}</span>
                    <span>by {(job as any).profiles?.name || "Customer"}</span>
                  </div>
                </div>
                <Button size="sm" onClick={() => setApplyDialog(job)} className="active:scale-[0.97]">
                  <Send className="w-4 h-4 mr-1" /> Apply
                </Button>
              </div>
            </div>
          )) : (
            <div className="stat-card flex flex-col items-center py-16 text-center">
              <Search className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-foreground font-medium">No available jobs</p>
              <p className="text-sm text-muted-foreground">New jobs posted by customers will appear here</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          {myApplications.length > 0 ? myApplications.map((app, i) => (
            <div key={app.id} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-medium text-foreground">{(app as any).jobs?.title || "Job"}</p>
                  <p className="text-xs text-muted-foreground">
                    by {(app as any).jobs?.profiles?.name || "Customer"} · Applied {new Date(app.created_at).toLocaleDateString()}
                    {app.proposed_rate && ` · Proposed: $${app.proposed_rate}`}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                  app.status === "accepted" ? "bg-green-500/10 text-green-500" :
                  app.status === "rejected" ? "bg-destructive/10 text-destructive" :
                  "bg-chart-4/10 text-chart-4"
                }`}>{app.status}</span>
              </div>
            </div>
          )) : (
            <div className="stat-card flex flex-col items-center py-16 text-center">
              <Briefcase className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-foreground font-medium">No applications yet</p>
              <p className="text-sm text-muted-foreground">Apply to available jobs to get started</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="assigned" className="space-y-4">
          {assignedJobs.length > 0 ? assignedJobs.map((job, i) => (
            <div key={job.id} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-medium text-foreground">{job.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {(job as any).profiles?.name} · {job.budget ? `$${job.budget}` : "No budget"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                    job.status === "completed" ? "bg-green-500/10 text-green-500" :
                    job.status === "in_progress" ? "bg-primary/10 text-primary" :
                    "bg-chart-4/10 text-chart-4"
                  }`}>{job.status.replace("_", " ")}</span>
                  {job.status === "accepted" && (
                    <Button size="sm" variant="outline" onClick={() => updateJobStatus(job.id, "in_progress")}>Start</Button>
                  )}
                  {job.status === "in_progress" && (
                    <Button size="sm" onClick={() => updateJobStatus(job.id, "completed")}>Complete</Button>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="stat-card flex flex-col items-center py-16 text-center">
              <Briefcase className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-foreground font-medium">No assigned jobs</p>
              <p className="text-sm text-muted-foreground">Jobs you're hired for will appear here</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Apply Dialog */}
      <Dialog open={!!applyDialog} onOpenChange={(open) => !open && setApplyDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to: {applyDialog?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Cover Note</label>
              <Textarea value={coverNote} onChange={(e) => setCoverNote(e.target.value)} placeholder="Why are you a good fit?" className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Proposed Rate ($)</label>
              <Input type="number" value={proposedRate} onChange={(e) => setProposedRate(e.target.value)} placeholder={applyDialog?.budget?.toString() || "Enter rate"} className="bg-muted/50" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyDialog(null)}>Cancel</Button>
            <Button onClick={applyToJob} disabled={submitting}>{submitting ? "Sending..." : "Send Application"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
