import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";
import { Minus, Plus, Trash2, ShoppingBasket } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — Spice Route Kitchen" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotalPaise, updateQuantity, removeItem, clear } = useCart();

  if (items.length === 0) {
    return (
      <SiteShell>
        <div className="container-page py-24 text-center">
          <ShoppingBasket className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 font-display text-4xl">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">Pick a recipe to start your ingredient bundle.</p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/recipes">Browse recipes</Link>
          </Button>
        </div>
      </SiteShell>
    );
  }

  // Group by recipe
  const groups = new Map<string, { recipeName: string; items: typeof items }>();
  for (const it of items) {
    const key = it.recipeId ?? "loose";
    if (!groups.has(key)) groups.set(key, { recipeName: it.recipeName ?? "Other items", items: [] });
    groups.get(key)!.items.push(it);
  }

  return (
    <SiteShell>
      <div className="container-page py-12">
        <h1 className="font-display text-5xl">Your cart</h1>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-8">
            {[...groups.entries()].map(([key, group]) => (
              <div key={key} className="rounded-2xl border border-border/60 bg-card p-5">
                <h2 className="font-display text-xl">{group.recipeName}</h2>
                <ul className="mt-4 divide-y divide-border">
                  {group.items.map((it) => (
                    <li key={it.productId} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{it.name}</p>
                        <p className="text-xs text-muted-foreground">{it.unit} · {formatINR(it.pricePaise)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(it.productId, it.quantity - 1)}>
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">{it.quantity}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(it.productId, it.quantity + 1)}>
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-20 text-right font-semibold">{formatINR(it.pricePaise * it.quantity)}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeItem(it.productId)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <button onClick={clear} className="text-sm text-muted-foreground hover:text-destructive">Clear cart</button>
          </div>

          <aside className="h-fit rounded-2xl border border-border/60 bg-card p-6 lg:sticky lg:top-24">
            <h3 className="font-display text-2xl">Order summary</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-semibold">{formatINR(subtotalPaise)}</dd></div>
              <div className="flex justify-between text-muted-foreground"><dt>Shipping</dt><dd>Calculated at checkout</dd></div>
            </dl>
            <div className="mt-6 flex items-baseline justify-between border-t border-border pt-4">
              <span className="text-sm font-semibold uppercase tracking-wider">Total</span>
              <span className="font-display text-3xl text-primary">{formatINR(subtotalPaise)}</span>
            </div>
            <Button asChild size="lg" className="mt-6 w-full">
              <Link to="/checkout">Proceed to checkout</Link>
            </Button>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
