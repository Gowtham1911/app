import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site/SiteShell";
import { Input } from "@/components/ui/input";
import { Clock, Users, Search } from "lucide-react";

export const Route = createFileRoute("/recipes/")({
  head: () => ({
    meta: [
      { title: "All Recipes — Spice Route Kitchen" },
      { name: "description", content: "Browse Indian recipes — biryani, butter chicken, paneer tikka and more. Every ingredient delivered." },
      { property: "og:title", content: "All Recipes — Spice Route Kitchen" },
      { property: "og:description", content: "Browse Indian recipes with ingredients delivered." },
    ],
  }),
  component: RecipesIndex,
});

function RecipesIndex() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id,slug,name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: recipes, isLoading } = useQuery({
    queryKey: ["recipes", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("id,slug,name,description,image_url,prep_time_minutes,servings,category_id,tags")
        .eq("is_published", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = (recipes ?? []).filter((r) => {
    if (cat && r.category_id !== cat) return false;
    if (q && !r.name.toLowerCase().includes(q.toLowerCase()) && !r.description?.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <SiteShell>
      <section className="border-b border-border/60 bg-secondary/30">
        <div className="container-page py-12">
          <h1 className="font-display text-5xl">All Recipes</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Pick a dish — we'll show you the ingredients and total cost in one click.
          </p>

          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search butter chicken, biryani…"
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCat(null)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${!cat ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}
              >
                All
              </button>
              {categories?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={`rounded-full border px-4 py-1.5 text-sm transition ${cat === c.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        {isLoading ? (
          <p className="text-muted-foreground">Loading recipes…</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground">No recipes match.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => (
              <Link
                key={r.id}
                to="/recipes/$slug"
                params={{ slug: r.slug }}
                className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  {r.image_url && (
                    <img src={r.image_url} alt={r.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-display text-2xl leading-tight">{r.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {r.prep_time_minutes} min</span>
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Serves {r.servings}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
