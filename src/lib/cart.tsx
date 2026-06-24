import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  name: string;
  unit: string;
  pricePaise: number;
  quantity: number;
  image?: string | null;
  recipeId?: string | null;
  recipeName?: string | null;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotalPaise: number;
  addItems: (items: CartItem[]) => void;
  updateQuantity: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "spice-route-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((s, it) => s + it.pricePaise * it.quantity, 0);
    const count = items.reduce((s, it) => s + it.quantity, 0);
    return {
      items,
      count,
      subtotalPaise: subtotal,
      addItems: (incoming) => {
        setItems((prev) => {
          const map = new Map(prev.map((i) => [i.productId, { ...i }]));
          for (const it of incoming) {
            const existing = map.get(it.productId);
            if (existing) {
              existing.quantity += it.quantity;
              existing.recipeId = it.recipeId ?? existing.recipeId;
              existing.recipeName = it.recipeName ?? existing.recipeName;
            } else {
              map.set(it.productId, { ...it });
            }
          }
          return [...map.values()];
        });
      },
      updateQuantity: (productId, qty) => {
        setItems((prev) =>
          qty <= 0
            ? prev.filter((i) => i.productId !== productId)
            : prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)),
        );
      },
      removeItem: (productId) => setItems((prev) => prev.filter((i) => i.productId !== productId)),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
