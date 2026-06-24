import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { createOrder } from "@/lib/orders.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Spice Route Kitchen" }] }),
  component: Checkout,
});

function Checkout() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { items, subtotalPaise, clear } = useCart();
  const submitOrder = useServerFn(createOrder);

  const [address, setAddress] = useState({
    full_name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", notes: "",
  });
  const [shippingId, setShippingId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", search: { redirect: "/checkout" } });
  }, [user, authLoading, navigate]);

  const { data: shipping } = useQuery({
    queryKey: ["shipping_methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_methods")
        .select("id,name,description,price_paise,estimated_days")
        .eq("is_active", true)
        .order("price_paise");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (shipping && shipping.length > 0 && !shippingId) setShippingId(shipping[0].id);
  }, [shipping, shippingId]);

  const selectedShipping = shipping?.find((s) => s.id === shippingId);
  const total = subtotalPaise + (selectedShipping?.price_paise ?? 0);

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!shippingId) return;
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setPlacing(true);
    try {
      const result = await submitOrder({
        data: {
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            recipeId: i.recipeId ?? null,
            recipeName: i.recipeName ?? null,
          })),
          shippingMethodId: shippingId,
          address,
        },
      });
      clear();
      toast.success("Order placed! Redirecting to payment…");
      navigate({ to: "/orders/$id", params: { id: result.orderId } });
    } catch (err: any) {
      toast.error(err.message ?? "Could not place order");
    } finally {
      setPlacing(false);
    }
  }

  if (items.length === 0 && !placing) {
    return (
      <SiteShell>
        <div className="container-page py-24 text-center">
          <h1 className="font-display text-4xl">Nothing to check out</h1>
          <p className="mt-2 text-muted-foreground">Your cart is empty.</p>
          <Button asChild className="mt-6"><Link to="/recipes">Browse recipes</Link></Button>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="container-page py-12">
        <h1 className="font-display text-5xl">Checkout</h1>
        <form onSubmit={placeOrder} className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-8">
            <section className="rounded-2xl border border-border/60 bg-card p-6">
              <h2 className="font-display text-2xl">Delivery address</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Full name" value={address.full_name} onChange={(v) => setAddress({ ...address, full_name: v })} required maxLength={120} />
                <Field label="Phone" value={address.phone} onChange={(v) => setAddress({ ...address, phone: v })} required maxLength={20} />
                <div className="sm:col-span-2">
                  <Field label="Address line 1" value={address.line1} onChange={(v) => setAddress({ ...address, line1: v })} required maxLength={200} />
                </div>
                <div className="sm:col-span-2">
                  <Field label="Address line 2 (optional)" value={address.line2} onChange={(v) => setAddress({ ...address, line2: v })} maxLength={200} />
                </div>
                <Field label="City" value={address.city} onChange={(v) => setAddress({ ...address, city: v })} required maxLength={80} />
                <Field label="State" value={address.state} onChange={(v) => setAddress({ ...address, state: v })} required maxLength={80} />
                <Field label="Pincode" value={address.pincode} onChange={(v) => setAddress({ ...address, pincode: v })} required maxLength={10} />
              </div>
              <div className="mt-4">
                <Label>Delivery notes (optional)</Label>
                <Textarea value={address.notes} onChange={(e) => setAddress({ ...address, notes: e.target.value })} maxLength={500} className="mt-1" rows={2} />
              </div>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card p-6">
              <h2 className="font-display text-2xl">Shipping</h2>
              <div className="mt-4 space-y-2">
                {shipping?.map((s) => (
                  <label key={s.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${shippingId === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <input type="radio" name="ship" checked={shippingId === s.id} onChange={() => setShippingId(s.id)} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-semibold">{s.name}</span>
                        <span className="font-semibold">{formatINR(s.price_paise)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{s.description} · {s.estimated_days}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-border/60 bg-card p-6 lg:sticky lg:top-24">
            <h2 className="font-display text-2xl">Summary</h2>
            <ul className="mt-4 max-h-60 space-y-2 overflow-auto text-sm">
              {items.map((it) => (
                <li key={it.productId} className="flex justify-between">
                  <span className="truncate pr-2">{it.name} × {it.quantity}</span>
                  <span className="shrink-0 font-medium">{formatINR(it.pricePaise * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatINR(subtotalPaise)}</dd></div>
              <div className="flex justify-between"><dt>Shipping</dt><dd>{selectedShipping ? formatINR(selectedShipping.price_paise) : "—"}</dd></div>
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
              <span className="text-sm font-semibold uppercase tracking-wider">Total</span>
              <span className="font-display text-3xl text-primary">{formatINR(total)}</span>
            </div>
            <Button type="submit" size="lg" className="mt-6 w-full" disabled={placing || !shippingId}>
              {placing ? "Placing order…" : "Place order"}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">Payment is collected on the next step.</p>
          </aside>
        </form>
      </div>
    </SiteShell>
  );
}

function Field({ label, value, onChange, required, maxLength }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; maxLength?: number }) {
  return (
    <div>
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} required={required} maxLength={maxLength} className="mt-1" />
    </div>
  );
}
