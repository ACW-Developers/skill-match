import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Edit2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🔧");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase.from("service_categories").select("*").order("name");
    setCategories(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditId(null); setName(""); setIcon("🔧"); setDescription(""); setShowDialog(true); };
  const openEdit = (cat: any) => { setEditId(cat.id); setName(cat.name); setIcon(cat.icon || "🔧"); setDescription(cat.description || ""); setShowDialog(true); };

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    if (editId) {
      await supabase.from("service_categories").update({ name: name.trim(), icon, description: description.trim() || null }).eq("id", editId);
      toast({ title: "Category updated" });
    } else {
      await supabase.from("service_categories").insert({ name: name.trim(), icon, description: description.trim() || null });
      toast({ title: "Category created" });
    }
    setSaving(false);
    setShowDialog(false);
    load();
  };

  const deleteCategory = async (id: string) => {
    await supabase.from("service_categories").delete().eq("id", id);
    toast({ title: "Category deleted" });
    load();
  };

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Service Categories</h1>
          <p className="text-muted-foreground text-sm">Manage skill categories for workers</p>
        </div>
        <Button onClick={openCreate} className="active:scale-[0.97]"><Plus className="w-4 h-4 mr-2" /> Add Category</Button>
      </div>

      {categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <div key={cat.id} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{cat.icon}</span>
                  <div>
                    <p className="font-semibold text-foreground">{cat.name}</p>
                    {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEdit(cat)}><Edit2 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive" onClick={() => deleteCategory(cat.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="stat-card flex flex-col items-center py-16 text-center">
          <p className="text-foreground font-medium">No categories yet</p>
          <p className="text-sm text-muted-foreground">Add service categories for workers to select</p>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="space-y-2 w-20">
                <label className="text-sm font-medium text-foreground">Icon</label>
                <Input value={icon} onChange={(e) => setIcon(e.target.value)} className="bg-muted/50 text-center text-xl" maxLength={2} />
              </div>
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium text-foreground">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Electrician" className="bg-muted/50" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" className="bg-muted/50" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !name.trim()}>{saving ? "Saving..." : editId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
