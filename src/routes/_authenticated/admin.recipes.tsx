import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/recipes")({
  component: AdminRecipes,
});

type Recipe = {
  id: string; name: string; slug: string; description: string | null; instructions: string | null;
  image_url: string | null; category_id: string | null; prep_time_minutes: number | null;
  servings: number | null; is_published: boolean; tags: string[] | null;
};

function AdminRecipes() {
  const qc = useQueryClient();
  const { data: recipes } = useQuery({
    queryKey: ["admin", "recipes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("recipes").select("*").order("name");
      if (error) throw error;
      return data as Recipe[];
    },
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("id,name").order("name")).data ?? [],
  });

  async function remove(id: string) {
    if (!confirm("Delete this recipe? Its ingredient links will also be removed.")) return;
    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "recipes"] }); }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl">Recipes</h1>
        <RecipeDialog categories={categories ?? []} onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "recipes"] })}>
          <Button><Plus className="mr-1 h-4 w-4" /> Add recipe</Button>
        </RecipeDialog>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recipes?.map((r) => (
          <div key={r.id} className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            {r.image_url && <img src={r.image_url} alt={r.name} className="aspect-[4/3] w-full object-cover" />}
            <div className="p-4">
              <h3 className="font-display text-xl">{r.name}</h3>
              <p className="line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className={r.is_published ? "text-emerald-600" : "text-muted-foreground"}>{r.is_published ? "Published" : "Draft"}</span>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <RecipeDialog recipe={r} categories={categories ?? []} onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "recipes"] })}>
                  <Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>
                </RecipeDialog>
                <RecipeIngredientsDialog recipe={r}>
                  <Button size="sm" variant="outline">Ingredients</Button>
                </RecipeIngredientsDialog>
                <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecipeDialog({ recipe, categories, children, onSaved }: { recipe?: Recipe; categories: { id: string; name: string }[]; children: React.ReactNode; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: recipe?.name ?? "",
    slug: recipe?.slug ?? "",
    description: recipe?.description ?? "",
    instructions: recipe?.instructions ?? "",
    image_url: recipe?.image_url ?? "",
    category_id: recipe?.category_id ?? "",
    prep_time_minutes: recipe?.prep_time_minutes?.toString() ?? "",
    servings: recipe?.servings?.toString() ?? "2",
    is_published: recipe?.is_published ?? true,
    tags: (recipe?.tags ?? []).join(", "),
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      description: form.description || null,
      instructions: form.instructions || null,
      image_url: form.image_url || null,
      category_id: form.category_id || null,
      prep_time_minutes: form.prep_time_minutes ? parseInt(form.prep_time_minutes, 10) : null,
      servings: parseInt(form.servings || "2", 10),
      is_published: form.is_published,
      tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
    };
    const { error } = recipe
      ? await supabase.from("recipes").update(payload).eq("id", recipe.id)
      : await supabase.from("recipes").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    onSaved();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-auto">
        <DialogHeader><DialogTitle>{recipe ? "Edit recipe" : "Add recipe"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto" /></div>
          </div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
          <div><Label>Instructions</Label><Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={6} /></div>
          <div><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="/recipes/recipe-...jpg" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Prep (min)</Label><Input type="number" value={form.prep_time_minutes} onChange={(e) => setForm({ ...form, prep_time_minutes: e.target.value })} /></div>
            <div><Label>Servings</Label><Input type="number" value={form.servings} onChange={(e) => setForm({ ...form, servings: e.target.value })} /></div>
          </div>
          <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Vegan, Comfort" /></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
            Published
          </label>
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RecipeIngredientsDialog({ recipe, children }: { recipe: Recipe; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { data: ingredients, refetch } = useQuery({
    queryKey: ["recipe-ings", recipe.id],
    enabled: open,
    queryFn: async () => (await supabase.from("recipe_ingredients").select("id,quantity,unit,display_order,product:products(id,name)").eq("recipe_id", recipe.id).order("display_order")).data ?? [],
  });
  const { data: products } = useQuery({
    queryKey: ["all-products"],
    enabled: open,
    queryFn: async () => (await supabase.from("products").select("id,name").order("name")).data ?? [],
  });
  const [adding, setAdding] = useState({ product_id: "", unit: "", quantity: "1" });

  async function add() {
    if (!adding.product_id) return;
    const { error } = await supabase.from("recipe_ingredients").insert({
      recipe_id: recipe.id,
      product_id: adding.product_id,
      unit: adding.unit || null,
      quantity: parseFloat(adding.quantity || "1"),
      display_order: (ingredients?.length ?? 0) + 1,
    });
    if (error) return toast.error(error.message);
    setAdding({ product_id: "", unit: "", quantity: "1" });
    refetch();
    qc.invalidateQueries({ queryKey: ["recipe"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("recipe_ingredients").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refetch();
    qc.invalidateQueries({ queryKey: ["recipe"] });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-auto">
        <DialogHeader><DialogTitle>{recipe.name} · Ingredients</DialogTitle></DialogHeader>
        <ul className="divide-y divide-border">
          {ingredients?.map((i: any) => (
            <li key={i.id} className="flex items-center justify-between py-2">
              <span><span className="font-medium">{i.product?.name}</span> <span className="text-xs text-muted-foreground">· {i.unit ?? "—"}</span></span>
              <Button size="icon" variant="ghost" onClick={() => remove(i.id)}><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
        <div className="mt-3 grid grid-cols-[1fr_100px_80px_auto] gap-2 border-t border-border pt-3">
          <Select value={adding.product_id} onValueChange={(v) => setAdding({ ...adding, product_id: v })}>
            <SelectTrigger><SelectValue placeholder="Pick product" /></SelectTrigger>
            <SelectContent>{products?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="unit" value={adding.unit} onChange={(e) => setAdding({ ...adding, unit: e.target.value })} />
          <Input type="number" step="0.1" value={adding.quantity} onChange={(e) => setAdding({ ...adding, quantity: e.target.value })} />
          <Button onClick={add}>Add</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
