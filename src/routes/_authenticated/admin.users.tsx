import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const qc = useQueryClient();
  const { data: users } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }, { data: orders }] = await Promise.all([
        supabase.from("profiles").select("id,full_name,phone,is_active,created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id,role"),
        supabase.from("orders").select("user_id"),
      ]);
      const adminSet = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
      const orderCount = new Map<string, number>();
      for (const o of orders ?? []) orderCount.set(o.user_id, (orderCount.get(o.user_id) ?? 0) + 1);
      return (profiles ?? []).map((p) => ({ ...p, isAdmin: adminSet.has(p.id), orderCount: orderCount.get(p.id) ?? 0 }));
    },
  });

  async function toggleActive(id: string, val: boolean) {
    const { error } = await supabase.from("profiles").update({ is_active: val }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin", "users"] }); }
  }

  async function toggleAdmin(id: string, makeAdmin: boolean) {
    if (makeAdmin) {
      const { error } = await supabase.from("user_roles").insert({ user_id: id, role: "admin" });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "admin");
      if (error) return toast.error(error.message);
    }
    toast.success("Role updated");
    qc.invalidateQueries({ queryKey: ["admin", "users"] });
  }

  return (
    <div>
      <h1 className="font-display text-4xl">Users</h1>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Admin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users?.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium">{u.full_name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.phone ?? "—"}</td>
                <td className="px-4 py-3">{u.orderCount}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3"><Switch checked={u.is_active} onCheckedChange={(v) => toggleActive(u.id, v)} /></td>
                <td className="px-4 py-3"><Switch checked={u.isAdmin} onCheckedChange={(v) => toggleAdmin(u.id, v)} /></td>
              </tr>
            ))}
            {users?.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No users yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Note: only signed-in users you've previously promoted to admin can see this panel. To make yourself admin the first time, use the "Make me admin" button on the dashboard.</p>
    </div>
  );
}
