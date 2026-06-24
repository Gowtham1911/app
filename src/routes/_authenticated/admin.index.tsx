import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { Users, BookOpen, ShoppingCart, IndianRupee } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [users, recipes, orders, revenue, recent] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("recipes").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total_paise").neq("status", "cancelled"),
        supabase.from("orders").select("id,total_paise,status,created_at,shipping_address").order("created_at", { ascending: false }).limit(8),
      ]);
      const total = (revenue.data ?? []).reduce((s, r: any) => s + (r.total_paise ?? 0), 0);
      return {
        users: users.count ?? 0,
        recipes: recipes.count ?? 0,
        orders: orders.count ?? 0,
        revenue: total,
        recent: recent.data ?? [],
      };
    },
  });

  const cards = [
    { label: "Total users", value: stats?.users ?? 0, icon: Users },
    { label: "Total recipes", value: stats?.recipes ?? 0, icon: BookOpen },
    { label: "Total orders", value: stats?.orders ?? 0, icon: ShoppingCart },
    { label: "Revenue", value: formatINR(stats?.revenue ?? 0), icon: IndianRupee },
  ];

  return (
    <div>
      <h1 className="font-display text-4xl">Dashboard</h1>
      <p className="text-muted-foreground">Overview of your kitchen at a glance.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{c.label}</span>
              <c.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 font-display text-3xl">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="font-display text-2xl">Recent orders</h2>
        <table className="mt-4 w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="pb-3">Order</th><th className="pb-3">Customer</th><th className="pb-3">Status</th><th className="pb-3 text-right">Total</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {stats?.recent.map((o: any) => (
              <tr key={o.id}>
                <td className="py-3 font-mono text-xs">#{o.id.slice(0, 8)}</td>
                <td className="py-3">{o.shipping_address?.full_name ?? "—"}</td>
                <td className="py-3 capitalize">{o.status}</td>
                <td className="py-3 text-right font-semibold">{formatINR(o.total_paise)}</td>
              </tr>
            ))}
            {stats?.recent.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
