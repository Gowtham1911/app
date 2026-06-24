import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUpRight, Clock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spice Route Kitchen — Cook Indian classics, ingredients included" },
      {
        name: "description",
        content:
          "Choose a recipe. We deliver every ingredient, pre-portioned. Cook butter chicken, biryani, paneer tikka and more at home.",
      },
      { property: "og:title", content: "Spice Route Kitchen" },
      { property: "og:description", content: "Recipes with ingredients delivered." },
    ],
  }),
  component: Index,
});

type RecipeCard = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  prep_time_minutes: number | null;
  servings: number | null;
  tags: string[] | null;
};

function Index() {
  const { data: recipes } = useQuery({
    queryKey: ["recipes", "home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("id,slug,name,description,image_url,prep_time_minutes,servings,tags")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(7);
      if (error) throw error;
      return data as RecipeCard[];
    },
  });

  const featured = recipes?.[0];
  const sideA = recipes?.[1];
  const sideB = recipes?.[2];

  return (
    <SiteShell>
      {/* HERO — asymmetric 7/5 split with offset floating card */}
      <section className="relative">
        <div className="container-page grid grid-cols-1 items-center gap-12 py-16 md:grid-cols-12 md:gap-10 md:py-28">
          <div className="md:col-span-7">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-primary" aria-hidden />
              <span className="eyebrow text-primary">Recipe-First Grocery</span>
            </div>
            <h1 className="mt-7 font-display text-6xl leading-[0.9] text-foreground sm:text-7xl lg:text-[7.5rem]">
              Cook the <span className="italic text-primary">dish</span>.
              <br />
              We bring the <span className="italic">spice</span>.
            </h1>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-foreground/75">
              Choose a recipe. Every ingredient — chicken, paneer, saffron — shows up
              at your door, pre-portioned and priced together.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-none px-10 py-6 text-sm font-medium tracking-wide">
                <Link to="/recipes">
                  Browse recipes <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-none border-foreground/25 bg-transparent px-10 py-6 text-sm font-medium tracking-wide hover:bg-card"
              >
                <a href="#how-it-works">How it works</a>
              </Button>
            </div>
          </div>

          <div className="relative md:col-span-5">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-sage/30">
              {featured?.image_url ? (
                <img
                  src={featured.image_url}
                  alt={featured.name}
                  width={800}
                  height={1000}
                  className="h-full w-full object-cover mix-blend-multiply opacity-95"
                />
              ) : null}
            </div>
            {featured && (
              <Link
                to="/recipes/$slug"
                params={{ slug: featured.slug }}
                className="absolute -bottom-8 left-4 max-w-[280px] bg-card p-7 shadow-[0_20px_60px_-20px_rgba(43,29,23,0.35)] ring-1 ring-border md:-left-12"
              >
                <p className="eyebrow text-sage">Today's Pick</p>
                <h3 className="mt-3 font-display text-3xl leading-tight">
                  {featured.name}
                </h3>
                <p className="mt-2 text-sm text-foreground/55">
                  {featured.prep_time_minutes} min · ingredients included
                </p>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* THIS WEEK'S RECIPES — featured + staggered */}
      <section className="container-page py-24 md:py-32">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-5xl md:text-6xl">This week's recipes</h2>
            <p className="mt-4 text-foreground/60">
              Hand-picked classics. Tap one to see ingredients and pricing.
            </p>
          </div>
          <Link
            to="/recipes"
            className="inline-flex w-fit items-center gap-2 border-b border-primary pb-1 text-sm font-semibold text-primary"
          >
            View current menu <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Large featured */}
          {sideA && (
            <Link
              to="/recipes/$slug"
              params={{ slug: sideA.slug }}
              className="group md:col-span-7"
            >
              <div className="aspect-[16/10] overflow-hidden bg-clay-soft/30">
                {sideA.image_url && (
                  <img
                    src={sideA.image_url}
                    alt={sideA.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                )}
              </div>
              <div className="mt-6 flex items-start justify-between gap-6">
                <div>
                  <h3 className="font-display text-4xl leading-tight">{sideA.name}</h3>
                  <p className="mt-2 max-w-md text-sm text-foreground/60">
                    {sideA.description}
                  </p>
                </div>
                <span className="shrink-0 font-display text-xl italic text-primary">
                  Open →
                </span>
              </div>
            </Link>
          )}

          {/* Staggered side cards */}
          <div className="flex flex-col gap-16 md:col-span-5 md:pt-24">
            {[sideB, recipes?.[3]].map((r, i) =>
              r ? (
                <Link
                  key={r.id}
                  to="/recipes/$slug"
                  params={{ slug: r.slug }}
                  className={`group ${i === 1 ? "md:pl-12" : ""}`}
                >
                  <div
                    className={`overflow-hidden bg-sage/20 ${
                      i === 0 ? "aspect-square" : "aspect-[4/3]"
                    }`}
                  >
                    {r.image_url && (
                      <img
                        src={r.image_url}
                        alt={r.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    )}
                  </div>
                  <h3 className="mt-5 font-display text-3xl leading-tight">{r.name}</h3>
                  <p className="mt-2 text-sm text-foreground/60 line-clamp-2">
                    {r.description}
                  </p>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs text-foreground/50">
                    <Clock className="h-3.5 w-3.5" /> {r.prep_time_minutes} min
                  </p>
                </Link>
              ) : null,
            )}
          </div>
        </div>

        {/* Secondary row — remaining recipes in equal columns */}
        {recipes && recipes.length > 4 && (
          <div className="mt-24 grid grid-cols-1 gap-10 border-t border-border pt-16 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.slice(4, 7).map((r) => (
              <Link
                key={r.id}
                to="/recipes/$slug"
                params={{ slug: r.slug }}
                className="group"
              >
                <div className="aspect-[4/5] overflow-hidden bg-muted">
                  {r.image_url && (
                    <img
                      src={r.image_url}
                      alt={r.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  )}
                </div>
                <h3 className="mt-5 font-display text-2xl leading-tight">{r.name}</h3>
                <p className="mt-2 text-xs uppercase tracking-widest text-foreground/50">
                  {r.prep_time_minutes} min · serves {r.servings}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* HOW IT WORKS — editorial numbered list */}
      <section id="how-it-works" className="container-page py-24 md:py-32">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5">
            <span className="eyebrow text-sage">How it works</span>
            <h2 className="mt-4 font-display text-5xl leading-[1.05] md:text-6xl">
              Fresh from the source,
              <br />
              <span className="italic">ready in your pan.</span>
            </h2>
            <p className="mt-6 max-w-sm text-foreground/65">
              No half-used jars. No guesswork. Just the recipe and exactly what it
              asks for, on your countertop.
            </p>
          </div>
          <ol className="space-y-10 md:col-span-7 md:pl-12">
            {[
              {
                title: "Choose your recipe",
                body: "Browse weekly classics from across India — curated for home kitchens, no special equipment.",
              },
              {
                title: "Customize the box",
                body: "Already have rice or ghee? Tap to remove. The total updates instantly.",
              },
              {
                title: "Cook with confidence",
                body: "Pre-portioned ingredients arrive labelled by step. Restaurant flavours in under 45 minutes.",
              },
            ].map((s, i) => (
              <li key={s.title} className="flex items-start gap-8 border-t border-border pt-8">
                <span className="font-display text-5xl italic text-primary leading-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h4 className="font-display text-2xl">{s.title}</h4>
                  <p className="mt-2 text-foreground/65">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PANTRY VAULT — forest editorial sash */}
      <section className="bg-forest text-cream">
        <div className="container-page grid grid-cols-1 gap-16 py-24 md:grid-cols-12 md:py-32">
          <div className="md:col-span-4">
            <span className="eyebrow text-clay-soft">Quality Assurance</span>
            <h2 className="mt-5 font-display text-5xl leading-tight md:text-6xl">
              The Pantry <span className="italic text-clay-soft">Vault</span>
            </h2>
            <p className="mt-6 text-cream/75 leading-relaxed">
              Every kit includes our signature spice blends — ground weekly in small
              batches to keep every volatile oil intact.
            </p>
            <Button
              asChild
              variant="outline"
              className="mt-8 rounded-none border-clay-soft bg-transparent px-8 py-5 text-xs font-semibold tracking-[0.22em] text-clay-soft hover:bg-clay-soft hover:text-forest"
            >
              <Link to="/recipes">Explore the menu</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-12 md:col-span-8 md:grid-cols-3">
            {[
              {
                name: "Kashmiri Saffron",
                body: "Grade A threads selected for intense aroma and deep amber colour.",
                offset: "",
              },
              {
                name: "Green Cardamom",
                body: "Whole pods from Kerala, cracked just before your box ships.",
                offset: "md:mt-16",
              },
              {
                name: "Ceylon Cinnamon",
                body: "Thin-bark cinnamon — subtle, sweet heat that never bullies a dish.",
                offset: "md:mt-8",
              },
            ].map((p) => (
              <article
                key={p.name}
                className={`flex flex-col gap-5 border-t border-cream/20 pt-8 ${p.offset}`}
              >
                <span className="grid h-14 w-14 place-items-center rounded-full border border-cream/30 font-display text-2xl italic text-clay-soft">
                  ✦
                </span>
                <div>
                  <h4 className="font-display text-2xl">{p.name}</h4>
                  <p className="mt-3 text-sm text-cream/70 leading-relaxed">{p.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
