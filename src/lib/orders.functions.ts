import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(50),
  recipeId: z.string().uuid().nullable().optional(),
  recipeName: z.string().max(120).nullable().optional(),
});

const addressSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(7).max(20),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional().default(""),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  pincode: z.string().trim().min(4).max(10),
  notes: z.string().trim().max(500).optional().default(""),
});

const inputSchema = z.object({
  items: z.array(itemSchema).min(1).max(100),
  shippingMethodId: z.string().uuid(),
  address: addressSchema,
});

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Re-fetch product prices server-side
    const productIds = [...new Set(data.items.map((i) => i.productId))];
    const { data: products, error: pErr } = await supabase
      .from("products")
      .select("id,name,price_paise,unit,stock,is_active")
      .in("id", productIds);
    if (pErr) throw new Error(pErr.message);
    const pmap = new Map((products ?? []).map((p) => [p.id, p]));

    let subtotal = 0;
    const orderItems = data.items.map((it) => {
      const p = pmap.get(it.productId);
      if (!p || !p.is_active) throw new Error(`Product unavailable: ${it.productId}`);
      const line = p.price_paise * it.quantity;
      subtotal += line;
      return {
        product_id: p.id,
        product_name: p.name,
        quantity: it.quantity,
        unit: p.unit,
        unit_price_paise: p.price_paise,
        line_total_paise: line,
        recipe_id: it.recipeId ?? null,
        recipe_name: it.recipeName ?? null,
      };
    });

    const { data: shipping, error: sErr } = await supabase
      .from("shipping_methods")
      .select("id,name,price_paise,is_active")
      .eq("id", data.shippingMethodId)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!shipping || !shipping.is_active) throw new Error("Shipping method unavailable");

    const total = subtotal + shipping.price_paise;

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        status: "pending",
        subtotal_paise: subtotal,
        shipping_paise: shipping.price_paise,
        total_paise: total,
        shipping_address: { ...data.address, shipping_method: shipping.name },
        payment_status: "pending",
      })
      .select("id")
      .single();
    if (oErr) throw new Error(oErr.message);

    const { error: iErr } = await supabase
      .from("order_items")
      .insert(orderItems.map((oi) => ({ ...oi, order_id: order.id })));
    if (iErr) throw new Error(iErr.message);

    return { orderId: order.id };
  });
