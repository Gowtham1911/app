import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteShell } from "@/components/site/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { claimFirstAdmin } from "@/lib/admin.functions";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My Account — Spice Route Kitchen" }] }),
  component: Account,
});

function Account() {
  const { user, signOut, isAdmin, refreshRole } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const claim = useServerFn(claimFirstAdmin);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name,phone").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
      }
    });
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  }

  async function becomeAdmin() {
    try {
      await claim({});
      await refreshRole();
      toast.success("You are now the admin");
    } catch (err: any) {
      toast.error(err.message ?? "Could not claim admin");
    }
  }

  return (
    <SiteShell>
      <div className="container-page max-w-2xl py-12">
        <h1 className="font-display text-5xl">My Account</h1>
        <p className="mt-2 text-muted-foreground">{user?.email}</p>

        <form onSubmit={save} className="mt-8 space-y-4 rounded-2xl border border-border/60 bg-card p-6">
          <div>
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} className="mt-1" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} className="mt-1" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
            <Button type="button" variant="outline" onClick={signOut}>Sign out</Button>
          </div>
        </form>

        {isAdmin ? (
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <h2 className="font-display text-xl flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Admin Panel
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage orders, recipes, products, shipping, and users.
            </p>
            <Button asChild className="mt-3">
              <Link to="/admin">Go to Admin Panel</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5">
            <h2 className="font-display text-xl">First-time admin</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              If no admin exists yet, claim ownership of this store. Only works for the first user.
            </p>
            <Button onClick={becomeAdmin} variant="outline" className="mt-3">Become admin</Button>
          </div>
        )}
      </div>
    </SiteShell>
  );
}
