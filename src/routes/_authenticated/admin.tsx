import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { LayoutDashboard, BookOpen, Package, ShoppingCart, Users, Truck, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Spice Route Kitchen" }] }),
  component: AdminLayout,
});

const items: { to: string; label: string; icon: any; exact?: boolean }[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/recipes", label: "Recipes", icon: BookOpen },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/shipping", label: "Shipping", icon: Truck },
];

function AdminLayout() {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && user && !isAdmin) navigate({ to: "/" });
  }, [loading, isAdmin, user, navigate]);

  if (loading) return <div className="p-10 text-muted-foreground">Loading…</div>;
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-10 text-center">
        <div>
          <h1 className="font-display text-3xl">Admin access only</h1>
          <p className="mt-2 text-muted-foreground">Your account is not an admin.</p>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">← Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30 md:flex-row">
      <aside className="w-full border-b border-border bg-card md:w-64 md:border-b-0 md:border-r">
        <div className="p-6">
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to site
          </Link>
          <h2 className="mt-3 font-display text-2xl text-primary">Admin</h2>
          <p className="text-xs text-muted-foreground">Spice Route Kitchen</p>
        </div>
        <nav className="px-3 pb-4">
          {items.map((it) => {
            const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted"}`}
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}
