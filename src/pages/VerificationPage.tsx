import { useEffect, useState } from "react";
import { Check, X, FileText, Clock, Eye, ShieldCheck, ShieldX, ShieldAlert, User, MapPin, GraduationCap, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function VerificationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewWorker, setViewWorker] = useState<any>(null);
  const [certs, setCerts] = useState<any[]>([]);

  async function loadAll() {
    setLoading(true);
    const { data } = await supabase
      .from("worker_profiles")
      .select("*, profiles:user_id(name, email, avatar_url, phone), certifications(id, name, file_url)")
      .order("created_at", { ascending: false });
    setWorkers(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    const channel = supabase.channel("verification-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "worker_profiles" }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAction = async (workerId: string, action: "approved" | "rejected") => {
    await supabase.from("worker_profiles").update({ verification_status: action }).eq("id", workerId);
    await supabase.from("activity_logs").insert({
      user_id: user!.id,
      action: action === "approved" ? "Fundi Approved" : "Fundi Rejected",
      detail: `Fundi ${action}`, entity_type: "worker_profile", entity_id: workerId,
    });
    toast({ title: `Fundi ${action}` });
    loadAll();
  };

  const viewDocuments = (worker: any) => {
    setViewWorker(worker);
    setCerts(worker.certifications || []);
  };

  const pending = workers.filter(w => w.verification_status === "pending");
  const approved = workers.filter(w => w.verification_status === "approved");
  const rejected = workers.filter(w => w.verification_status === "rejected");

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-green-500/15 text-green-600 border-green-500/30 hover:bg-green-500/20">Approved</Badge>;
    if (status === "rejected") return <Badge className="bg-red-500/15 text-red-600 border-red-500/30 hover:bg-red-500/20">Rejected</Badge>;
    return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/20">Pending</Badge>;
  };

  const renderWorkerCard = (w: any, i: number, showActions: boolean) => (
    <div key={w.id} className="rounded-xl border bg-card p-4 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm overflow-hidden">
            {w.profiles?.avatar_url
              ? <img src={w.profiles.avatar_url} className="w-full h-full object-cover rounded-full" />
              : (w.profiles?.name || "F").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground text-sm">{w.profiles?.name || "Unknown"}</p>
              {statusBadge(w.verification_status)}
            </div>
            <p className="text-xs text-muted-foreground">{w.profiles?.email}</p>
            {w.bio && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{w.bio}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {(w.certifications || []).length} docs</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(w.created_at).toLocaleDateString()}</span>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => viewDocuments(w)}><Eye className="w-3.5 h-3.5 mr-1" /> View</Button>
            {showActions && w.verification_status !== "approved" && (
              <Button size="sm" className="h-8 text-xs" onClick={() => handleAction(w.id, "approved")}><Check className="w-3.5 h-3.5 mr-1" /> Approve</Button>
            )}
            {showActions && w.verification_status !== "rejected" && (
              <Button size="sm" variant="outline" className="h-8 text-xs text-destructive hover:bg-destructive/10" onClick={() => handleAction(w.id, "rejected")}><X className="w-3.5 h-3.5 mr-1" /> Reject</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const emptyState = (icon: React.ReactNode, title: string, sub: string) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon}
      <p className="text-foreground font-medium mt-2">{title}</p>
      <p className="text-sm text-muted-foreground">{sub}</p>
    </div>
  );

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div></div>;
  }

  // Categorize certs for the detail dialog
  const requiredDocNames = ["national id", "nca document"];
  const licenseDocNames = ["certificate of good conduct"];
  const academicDocNames = ["academic certificate"];

  const categorizeCert = (name: string) => {
    const lower = name.toLowerCase();
    if (requiredDocNames.some(d => lower.includes(d))) return "id";
    if (licenseDocNames.some(d => lower.includes(d))) return "license";
    if (academicDocNames.some(d => lower.includes(d))) return "academic";
    return "other";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fundi Verification</h1>
        <p className="text-muted-foreground text-sm">Review and manage fundi verification status</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><ShieldAlert className="w-5 h-5 text-amber-500" /></div>
          <div><p className="text-2xl font-bold text-foreground">{pending.length}</p><p className="text-xs text-muted-foreground">Pending Review</p></div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-green-500" /></div>
          <div><p className="text-2xl font-bold text-foreground">{approved.length}</p><p className="text-xs text-muted-foreground">Approved</p></div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center"><ShieldX className="w-5 h-5 text-red-500" /></div>
          <div><p className="text-2xl font-bold text-foreground">{rejected.length}</p><p className="text-xs text-muted-foreground">Rejected</p></div>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="pending" className="gap-1.5"><ShieldAlert className="w-4 h-4" /> Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved" className="gap-1.5"><ShieldCheck className="w-4 h-4" /> Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1.5"><ShieldX className="w-4 h-4" /> Rejected ({rejected.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="space-y-3 mt-4">
          {pending.length > 0 ? pending.map((w, i) => renderWorkerCard(w, i, true)) : emptyState(<Check className="w-10 h-10 text-green-500" />, "All caught up!", "No pending verifications")}
        </TabsContent>
        <TabsContent value="approved" className="space-y-3 mt-4">
          {approved.length > 0 ? approved.map((w, i) => renderWorkerCard(w, i, true)) : emptyState(<ShieldCheck className="w-10 h-10 text-muted-foreground" />, "No approved fundis yet", "Approve pending fundis to see them here")}
        </TabsContent>
        <TabsContent value="rejected" className="space-y-3 mt-4">
          {rejected.length > 0 ? rejected.map((w, i) => renderWorkerCard(w, i, true)) : emptyState(<ShieldX className="w-10 h-10 text-muted-foreground" />, "No rejected fundis", "Rejected fundis will appear here")}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog with Tabs */}
      <Dialog open={!!viewWorker} onOpenChange={(o) => !o && setViewWorker(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Fundi Details - {viewWorker?.profiles?.name}</DialogTitle></DialogHeader>
          {viewWorker && (
            <Tabs defaultValue="personal" className="space-y-4">
              <TabsList className="flex flex-wrap h-auto gap-1">
                <TabsTrigger value="personal"><User className="w-3.5 h-3.5 mr-1" /> Personal</TabsTrigger>
                <TabsTrigger value="skills"><Award className="w-3.5 h-3.5 mr-1" /> Skills</TabsTrigger>
                <TabsTrigger value="location"><MapPin className="w-3.5 h-3.5 mr-1" /> Location</TabsTrigger>
                <TabsTrigger value="docs"><FileText className="w-3.5 h-3.5 mr-1" /> Documents</TabsTrigger>
                <TabsTrigger value="academic"><GraduationCap className="w-3.5 h-3.5 mr-1" /> Academic</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-muted-foreground text-xs">Name</p><p className="text-foreground">{viewWorker.profiles?.name || "-"}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-muted-foreground text-xs">Email</p><p className="text-foreground">{viewWorker.profiles?.email || "-"}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-muted-foreground text-xs">Phone</p><p className="text-foreground">{viewWorker.profiles?.phone || "-"}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-muted-foreground text-xs">Gender</p><p className="text-foreground capitalize">{viewWorker.gender || "-"}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-muted-foreground text-xs">Date of Birth</p><p className="text-foreground">{viewWorker.date_of_birth || "-"}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-muted-foreground text-xs">ID Number</p><p className="text-foreground">{viewWorker.id_number || "-"}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50 col-span-2"><p className="text-muted-foreground text-xs">Bio</p><p className="text-foreground">{viewWorker.bio || "Not provided"}</p></div>
                </div>
              </TabsContent>

              <TabsContent value="skills" className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-muted-foreground text-xs">Rate</p><p className="text-foreground">{viewWorker.hourly_rate ? `KSH ${viewWorker.hourly_rate}/hr` : "-"}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-muted-foreground text-xs">Experience</p><p className="text-foreground">{viewWorker.years_experience || 0} years</p></div>
                </div>
              </TabsContent>

              <TabsContent value="location" className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-muted-foreground text-xs">Country</p><p className="text-foreground">{viewWorker.country || "-"}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-muted-foreground text-xs">County</p><p className="text-foreground">{viewWorker.county || "-"}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-muted-foreground text-xs">Constituency</p><p className="text-foreground">{viewWorker.constituency || "-"}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-muted-foreground text-xs">Ward</p><p className="text-foreground">{viewWorker.ward || "-"}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50 col-span-2"><p className="text-muted-foreground text-xs">Service Area</p><p className="text-foreground">{viewWorker.service_area || "-"}</p></div>
                </div>
              </TabsContent>

              <TabsContent value="docs" className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">ID & Certifications ({certs.filter(c => categorizeCert(c.name) === "id" || categorizeCert(c.name) === "license" || categorizeCert(c.name) === "other").length})</h4>
                {certs.filter(c => ["id", "license", "other"].includes(categorizeCert(c.name))).map((cert: any) => (
                  <div key={cert.id} className="flex items-center justify-between p-2 rounded bg-muted/50 mb-1">
                    <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /><span className="text-sm">{cert.name}</span></div>
                    {cert.file_url && <a href={cert.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View File</a>}
                  </div>
                ))}
                {certs.filter(c => ["id", "license", "other"].includes(categorizeCert(c.name))).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded</p>
                )}
              </TabsContent>

              <TabsContent value="academic" className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Academic Documents</h4>
                {certs.filter(c => categorizeCert(c.name) === "academic").map((cert: any) => (
                  <div key={cert.id} className="flex items-center justify-between p-2 rounded bg-muted/50 mb-1">
                    <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-primary" /><span className="text-sm">{cert.name}</span></div>
                    {cert.file_url && <a href={cert.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View File</a>}
                  </div>
                ))}
                {certs.filter(c => categorizeCert(c.name) === "academic").length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No academic documents uploaded</p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
