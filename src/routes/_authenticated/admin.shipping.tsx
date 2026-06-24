import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/shipping")({
  component: AdminShipping,
});

function AdminShipping() {
  const qc = useQueryClient();
  const { data: methods } = useQuery({
    queryKey: ["admin", "shipping"],
    queryFn: async () => (await supabase.from("shipping_methods").select("*").order("price_paise")).data ?? [],
  });

  async function toggle(id: string, active: boolean) {
    await supabase.from("shipping_methods").update({ is_active: active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "shipping"] });
  }

  async function remove(id: string) {
    if (!confirm("Delete this shipping method?")) return;
    const { error } = await supabase.from("shipping_methods").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "shipping"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl">Shipping methods</h1>
        <ShippingDialog onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "shipping"] })}>
          <Button><Plus className="mr-1 h-4 w-4" /> Add method</Button>
        </ShippingDialog>
      </div>

      <div className="mt-6 space-y-3">
        {methods?.map((m: any) => (
          <div key={m.id} className="flex items-center justify-between rounded-2xl border border-border/60 bg-card p-4">
            <div>
              <p className="font-display text-lg">{m.name}</p>
              <p className="text-sm text-muted-foreground">{m.description} · {m.estimated_days}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-display text-xl">{formatINR(m.price_paise)}</span>
              <Switch checked={m.is_active} onCheckedChange={(v) => toggle(m.id, v)} />
              <Button size="icon" variant="ghost" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShippingDialog({ children, onSaved }: { children: React.ReactNode; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price_rupees: "", estimated_days: "" });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("shipping_methods").insert({
      name: form.name,
      description: form.description || null,
      price_paise: Math.round(parseFloat(form.price_rupees || "0") * 100),
      estimated_days: form.estimated_days || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Added");
    onSaved();
    setOpen(false);
    setForm({ name: "", description: "", price_rupees: "", estimated_days: "" });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add shipping method</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Price (₹)</Label><Input type="number" step="0.01" value={form.price_rupees} onChange={(e) => setForm({ ...form, price_rupees: e.target.value })} required /></div>
            <div><Label>Estimated days</Label><Input value={form.estimated_days} onChange={(e) => setForm({ ...form, estimated_days: e.target.value })} placeholder="2-3 days" /></div>
          </div>
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
