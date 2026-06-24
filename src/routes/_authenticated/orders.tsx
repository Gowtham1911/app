import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "My Orders — Spice Route Kitchen" }] }),
  component: OrdersList,
});

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

function OrdersList() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,status,total_paise,created_at,courier,tracking_number")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <SiteShell>
      <div className="container-page py-12">
        <h1 className="font-display text-5xl">My Orders</h1>
        <p className="mt-2 text-muted-foreground">Track every delivery from kitchen to door.</p>

        {isLoading ? (
          <p className="mt-8 text-muted-foreground">Loading…</p>
        ) : !data || data.length === 0 ? (
          <p className="mt-8 text-muted-foreground">No orders yet.</p>
        ) : (
          <ul className="mt-8 space-y-3">
            {data.map((o) => (
              <li key={o.id}>
                <Link to="/orders/$id" params={{ id: o.id }} className="block rounded-2xl border border-border/60 bg-card p-5 transition hover:border-primary/40 hover:shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
                      <p className="mt-1 text-sm">{new Date(o.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                    </div>
                    <Badge className={statusColors[o.status] ?? ""}>{o.status}</Badge>
                    <span className="font-display text-xl">{formatINR(o.total_paise)}</span>
                  </div>
                  {o.tracking_number && (
                    <p className="mt-2 text-xs text-muted-foreground">Tracking: {o.courier} · {o.tracking_number}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SiteShell>
  );
}
