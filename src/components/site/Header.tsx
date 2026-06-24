import { Link } from "@tanstack/react-router";
import { ShoppingBag, User as UserIcon, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function Header() {
  const { count } = useCart();
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="container-page flex h-20 items-center justify-between">
        <Link to="/" className="flex items-baseline gap-3">
          <span className="font-display text-3xl text-primary leading-none">Spice Route</span>
          <span className="hidden text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:inline">
            Kitchen
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" className="text-sm font-medium text-foreground/80 hover:text-primary" activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }}>
            Home
          </Link>
          <Link to="/recipes" className="text-sm font-medium text-foreground/80 hover:text-primary" activeProps={{ className: "text-primary" }}>
            Recipes
          </Link>
          {user && (
            <Link to="/orders" className="text-sm font-medium text-foreground/80 hover:text-primary" activeProps={{ className: "text-primary" }}>
              My Orders
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="text-sm font-medium text-accent hover:text-accent/80" activeProps={{ className: "underline" }}>
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" className="relative">
            <Link to="/cart" aria-label="Cart">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
            <Link to={user ? "/account" : "/auth"} aria-label="Account">
              <UserIcon className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav className="container-page flex flex-col py-3">
            <Link to="/" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">Home</Link>
            <Link to="/recipes" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">Recipes</Link>
            {user && <Link to="/orders" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">My Orders</Link>}
            <Link to={user ? "/account" : "/auth"} onClick={() => setOpen(false)} className="py-2 text-sm font-medium">{user ? "Account" : "Sign in"}</Link>
            {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="py-2 text-sm font-medium text-accent">Admin Panel</Link>}
          </nav>
        </div>
      )}
    </header>
  );
}
