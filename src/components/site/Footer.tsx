import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export function Footer() {
  const { isAdmin } = useAuth();
  return (
    <footer className="mt-24 border-t border-border/60 bg-secondary/40">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <h3 className="font-display text-2xl text-primary">Spice Route Kitchen</h3>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Pick a recipe. Get every ingredient delivered, measured and ready. Cook
            restaurant-quality Indian food at home.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/recipes" className="hover:text-primary">All Recipes</Link></li>
            <li><Link to="/cart" className="hover:text-primary">Cart</Link></li>
            <li><Link to="/orders" className="hover:text-primary">My Orders</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider">Account</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth" className="hover:text-primary">Sign in</Link></li>
            <li><Link to="/account" className="hover:text-primary">Profile</Link></li>
            {isAdmin && (
              <li>
                <Link to="/admin" className="hover:text-primary text-accent">
                  Admin Panel
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Spice Route Kitchen. All rights reserved.</span>
          <span>Made with care in India.</span>
        </div>
      </div>
    </footer>
  );
}
