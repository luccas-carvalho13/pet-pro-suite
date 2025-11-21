import { supabase } from "../integrations/supabase/client";

export interface StockMovement {
  id: string;
  product_id: string;
  type: "entry" | "exit" | "adjustment" | "loss";
  quantity: number;
  unit_cost?: number;
  reason?: string;
  supplier?: string;
  notes?: string;
  tenant_id: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateStockMovementData {
  product_id: string;
  type: "entry" | "exit" | "adjustment" | "loss";
  quantity: number;
  unit_cost?: number;
  reason?: string;
  supplier?: string;
  notes?: string;
}

export const stockMovementsService = {
  async getAll(tenantId: string, filters?: { productId?: string; startDate?: string; endDate?: string; type?: string }) {
    let query = supabase
      .from("stock_movements")
      .select("*")
      .eq("tenant_id", tenantId);

    if (filters?.productId) {
      query = query.eq("product_id", filters.productId);
    }
    if (filters?.type) {
      query = query.eq("type", filters.type);
    }
    if (filters?.startDate) {
      query = query.gte("created_at", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("created_at", filters.endDate);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return data as StockMovement[];
  },

  async getStats(tenantId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from("stock_movements")
      .select("type, quantity")
      .eq("tenant_id", tenantId);

    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const stats = {
      totalEntries: 0,
      totalExits: 0,
    };

    data?.forEach((movement) => {
      if (movement.type === "entry") {
        stats.totalEntries += Number(movement.quantity);
      } else if (movement.type === "exit" || movement.type === "loss") {
        stats.totalExits += Number(movement.quantity);
      }
    });

    return stats;
  },

  async create(tenantId: string, userId: string, data: CreateStockMovementData) {
    const { data: movement, error } = await supabase
      .from("stock_movements")
      .insert({
        ...data,
        tenant_id: tenantId,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    // Atualizar estoque do produto
    const product = await supabase
      .from("products")
      .select("stock")
      .eq("id", data.product_id)
      .single();

    if (product.data) {
      let newStock = product.data.stock;
      if (data.type === "entry" || data.type === "adjustment") {
        newStock += data.quantity;
      } else {
        newStock -= data.quantity;
      }

      await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", data.product_id);
    }

    return movement as StockMovement;
  },
};

