import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Truck, Package, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/orders/$id")({
  component: OrderDetail,
});

const steps = [
  { key: "pending", label: "Order placed", icon: Circle },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
] as const;

function OrderDetail() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  if (isLoading) {
    return <SiteShell><div className="container-page py-20 text-muted-foreground">Loading order…</div></SiteShell>;
  }
  if (!data) return null;

  const currentStep = data.status === "cancelled" ? -1 : steps.findIndex((s) => s.key === data.status);
  const addr = (data.shipping_address ?? {}) as any;

  return (
    <SiteShell>
      <div className="container-page py-12">
        <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> All orders
        </Link>

        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl">Order #{data.id.slice(0, 8)}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{new Date(data.created_at).toLocaleString("en-IN")}</p>
          </div>
          <Badge className="text-sm capitalize">{data.status}</Badge>
        </div>

        {/* Tracker */}
        {data.status !== "cancelled" && (
          <div className="mt-10 rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex justify-between">
              {steps.map((s, i) => {
                const reached = i <= currentStep;
                const Icon = s.icon;
                return (
                  <div key={s.key} className="flex flex-1 flex-col items-center">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${reached ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`mt-2 text-xs font-medium ${reached ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                  </div>
                );
              })}
            </div>
            {data.tracking_number && (
              <p className="mt-6 text-center text-sm">
                Tracking: <span className="font-semibold">{data.courier}</span> · <span className="font-mono">{data.tracking_number}</span>
              </p>
            )}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="font-display text-2xl">Items</h2>
            <ul className="mt-4 divide-y divide-border">
              {data.order_items?.map((it: any) => (
                <li key={it.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{it.product_name}</p>
                    <p className="text-xs text-muted-foreground">{it.unit} × {it.quantity} {it.recipe_name && `· for ${it.recipe_name}`}</p>
                  </div>
                  <span className="font-semibold">{formatINR(it.line_total_paise)}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h3 className="font-display text-xl">Totals</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatINR(data.subtotal_paise)}</dd></div>
                <div className="flex justify-between"><dt>Shipping</dt><dd>{formatINR(data.shipping_paise)}</dd></div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-semibold"><dt>Total</dt><dd className="text-primary">{formatINR(data.total_paise)}</dd></div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">Payment: <span className="font-semibold capitalize">{data.payment_status}</span></p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h3 className="font-display text-xl">Delivery</h3>
              <address className="mt-3 not-italic text-sm leading-relaxed text-muted-foreground">
                {addr.full_name}<br />
                {addr.line1}{addr.line2 && <>, {addr.line2}</>}<br />
                {addr.city}, {addr.state} {addr.pincode}<br />
                {addr.phone}
                {addr.notes && <><br /><span className="italic">Notes: {addr.notes}</span></>}
              </address>
            </div>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
