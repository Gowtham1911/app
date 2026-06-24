import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;

function AdminOrders() {
  const qc = useQueryClient();
  const { data: orders } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => (await supabase.from("orders").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  async function updateOrder(id: string, patch: { status?: string; courier?: string | null; tracking_number?: string | null }) {
    const { error } = await supabase.from("orders").update(patch as any).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin", "orders"] }); }
  }

  return (
    <div>
      <h1 className="font-display text-4xl">Orders</h1>
      <p className="text-muted-foreground">Update status, courier, and tracking.</p>

      <div className="mt-6 space-y-3">
        {orders?.map((o: any) => (
          <OrderRow key={o.id} order={o} onUpdate={updateOrder} />
        ))}
      </div>
    </div>
  );
}

function OrderRow({ order, onUpdate }: { order: any; onUpdate: (id: string, p: Record<string, any>) => Promise<void> }) {
  const [courier, setCourier] = useState(order.courier ?? "");
  const [tracking, setTracking] = useState(order.tracking_number ?? "");

  return (
    <details className="rounded-2xl border border-border/60 bg-card p-4">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString()}</p>
            <p className="font-medium">{order.shipping_address?.full_name} · {order.shipping_address?.city}</p>
          </div>
          <Select value={order.status} onValueChange={(v) => onUpdate(order.id, { status: v })}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <span className="font-display text-xl">{formatINR(order.total_paise)}</span>
        </div>
      </summary>
      <div className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold">Delivery</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.shipping_address?.line1}, {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.pincode}<br />
            {order.shipping_address?.phone}
          </p>
        </div>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <Input placeholder="Courier (e.g. Delhivery)" value={courier} onChange={(e) => setCourier(e.target.value)} />
          <Input placeholder="Tracking number" value={tracking} onChange={(e) => setTracking(e.target.value)} />
          <Button onClick={() => onUpdate(order.id, { courier, tracking_number: tracking })}>Save</Button>
        </div>
      </div>
      <Link to="/orders/$id" params={{ id: order.id }} className="mt-3 inline-block text-xs text-primary hover:underline">View full order →</Link>
    </details>
  );
}
