import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: AdminProducts,
});

type Product = {
  id: string; name: string; slug: string; description: string | null;
  price_paise: number; unit: string; stock: number; is_active: boolean; image_url: string | null;
};

function AdminProducts() {
  const qc = useQueryClient();
  const { data: products } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "products"] }); }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl">Products</h1>
        <ProductDialog onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "products"] })}>
          <Button><Plus className="mr-1 h-4 w-4" /> Add product</Button>
        </ProductDialog>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products?.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.unit}</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatINR(p.price_paise)}</td>
                <td className="px-4 py-3">{p.is_active ? "Yes" : "No"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <ProductDialog product={p} onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "products"] })}>
                      <Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>
                    </ProductDialog>
                    <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductDialog({ product, children, onSaved }: { product?: Product; children: React.ReactNode; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    price_rupees: product ? (product.price_paise / 100).toString() : "",
    unit: product?.unit ?? "pc",
    stock: product?.stock?.toString() ?? "0",
    is_active: product?.is_active ?? true,
    image_url: product?.image_url ?? "",
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      description: form.description || null,
      price_paise: Math.round(parseFloat(form.price_rupees || "0") * 100),
      unit: form.unit,
      stock: parseInt(form.stock || "0", 10),
      is_active: form.is_active,
      image_url: form.image_url || null,
    };
    const { error } = product
      ? await supabase.from("products").update(payload).eq("id", product.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(product ? "Updated" : "Created");
    onSaved();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><Label>Slug (URL)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from name" /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Price (₹)</Label><Input type="number" step="0.01" value={form.price_rupees} onChange={(e) => setForm({ ...form, price_rupees: e.target.value })} required /></div>
            <div><Label>Unit</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
            <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
          </div>
          <div><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="/products/butter.jpg" /></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active (visible to customers)
          </label>
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
