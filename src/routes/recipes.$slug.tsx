import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Users, ShoppingBasket, ArrowLeft } from "lucide-react";
import { formatINR } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/recipes/$slug")({
  component: RecipeDetail,
});

function RecipeDetail() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { addItems } = useCart();
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["recipe", slug],
    queryFn: async () => {
      const { data: recipe, error } = await supabase
        .from("recipes")
        .select("*, recipe_ingredients(id,quantity,unit,display_order,product:products(id,name,slug,price_paise,unit,image_url,stock))")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      if (!recipe) throw notFound();
      return recipe;
    },
  });

  useEffect(() => {
    if (data?.recipe_ingredients) {
      const init: Record<string, boolean> = {};
      for (const ri of data.recipe_ingredients) init[ri.id] = true;
      setSelected(init);
    }
  }, [data?.id]);

  const ingredients = useMemo(
    () => (data?.recipe_ingredients ?? []).slice().sort((a, b) => a.display_order - b.display_order),
    [data],
  );

  const total = ingredients.reduce(
    (sum, ri) => (selected[ri.id] ? sum + (ri.product?.price_paise ?? 0) : sum),
    0,
  );
  const selectedCount = Object.values(selected).filter(Boolean).length;

  function addToCart() {
    if (!data) return;
    const items = ingredients
      .filter((ri) => selected[ri.id] && ri.product)
      .map((ri) => ({
        productId: ri.product!.id,
        name: ri.product!.name,
        unit: ri.unit ?? ri.product!.unit,
        pricePaise: ri.product!.price_paise,
        quantity: 1,
        image: ri.product!.image_url,
        recipeId: data.id,
        recipeName: data.name,
      }));
    if (items.length === 0) {
      toast.error("Select at least one ingredient");
      return;
    }
    addItems(items);
    toast.success(`Added ${items.length} ingredients for ${data.name}`);
    navigate({ to: "/cart" });
  }

  if (isLoading) {
    return (
      <SiteShell>
        <div className="container-page py-20 text-muted-foreground">Loading recipe…</div>
      </SiteShell>
    );
  }

  if (!data) return null;

  return (
    <SiteShell>
      <article className="container-page py-10">
        <Link to="/recipes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> All recipes
        </Link>

        <header className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div className="overflow-hidden rounded-3xl bg-muted">
            {data.image_url && (
              <img src={data.image_url} alt={data.name} className="aspect-[4/3] w-full object-cover" width={1200} height={900} />
            )}
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap gap-2">
              {(data.tags ?? []).map((t: string) => (
                <span key={t} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">{t}</span>
              ))}
            </div>
            <h1 className="mt-3 font-display text-5xl leading-tight">{data.name}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{data.description}</p>
            <div className="mt-6 flex gap-6 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> {data.prep_time_minutes} minutes</span>
              <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" /> Serves {data.servings}</span>
            </div>
          </div>
        </header>

        <section className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          {/* Instructions */}
          <div>
            <h2 className="font-display text-3xl">How to cook it</h2>
            <ol className="mt-4 space-y-3 whitespace-pre-line text-foreground/90">
              {data.instructions}
            </ol>
          </div>

          {/* Ingredients selector */}
          <aside className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm lg:sticky lg:top-24 lg:self-start">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-3xl">Ingredient bundle</h2>
                <p className="mt-1 text-sm text-muted-foreground">Uncheck anything you already have at home.</p>
              </div>
              <ShoppingBasket className="h-7 w-7 text-primary" />
            </div>

            <ul className="mt-6 divide-y divide-border">
              {ingredients.map((ri) => {
                const checked = !!selected[ri.id];
                return (
                  <li key={ri.id} className={`flex items-center justify-between gap-3 py-3 transition ${checked ? "" : "opacity-50"}`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => setSelected((s) => ({ ...s, [ri.id]: !!v }))}
                        id={`ing-${ri.id}`}
                      />
                      <label htmlFor={`ing-${ri.id}`} className="min-w-0 cursor-pointer">
                        <p className="truncate font-medium">{ri.product?.name}</p>
                        <p className="text-xs text-muted-foreground">{ri.unit ?? ri.product?.unit}</p>
                      </label>
                    </div>
                    <span className={`shrink-0 font-semibold ${checked ? "text-foreground" : "text-muted-foreground line-through"}`}>
                      {formatINR(ri.product?.price_paise ?? 0)}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 rounded-2xl bg-secondary/60 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">{selectedCount} ingredients selected</span>
                <span className="font-display text-3xl text-primary">{formatINR(total)}</span>
              </div>
            </div>
            <Button onClick={addToCart} size="lg" className="mt-4 w-full" disabled={selectedCount === 0}>
              Add bundle to cart
            </Button>
          </aside>
        </section>
      </article>
    </SiteShell>
  );
}
