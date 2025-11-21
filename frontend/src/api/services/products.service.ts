import { supabase } from "../integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  category: "food" | "medicine" | "accessory" | "toy" | "hygiene" | "other";
  unit: "unit" | "kg" | "g" | "l" | "ml" | "box" | "pack";
  cost_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  max_stock?: number;
  supplier?: Record<string, unknown>;
  image?: string;
  is_active: boolean;
  tenant_id: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  sku?: string;
  category: "food" | "medicine" | "accessory" | "toy" | "hygiene" | "other";
  unit?: "unit" | "kg" | "g" | "l" | "ml" | "box" | "pack";
  cost_price?: number;
  sale_price: number;
  stock?: number;
  min_stock?: number;
  max_stock?: number;
  supplier?: Record<string, unknown>;
  image?: string;
  is_active?: boolean;
}

export const productsService = {
  async getAll(tenantId: string) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw error;
    return data as Product[];
  },

  async getById(id: string, tenantId: string) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (error) throw error;
    return data as Product;
  },

  async create(tenantId: string, userId: string, data: CreateProductData) {
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        ...data,
        stock: data.stock ?? 0,
        min_stock: data.min_stock ?? 0,
        cost_price: data.cost_price ?? 0,
        unit: data.unit ?? "unit",
        is_active: data.is_active ?? true,
        tenant_id: tenantId,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return product as Product;
  },

  async update(id: string, tenantId: string, data: Partial<CreateProductData>) {
    const { data: product, error } = await supabase
      .from("products")
      .update(data)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select()
      .single();

    if (error) throw error;
    return product as Product;
  },

  async delete(id: string, tenantId: string) {
    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw error;
  },

  async search(tenantId: string, query: string) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,description.ilike.%${query}%`)
      .order("name", { ascending: true });

    if (error) throw error;
    return data as Product[];
  },

  async getLowStock(tenantId: string) {
    // Buscar produtos com estoque menor ou igual ao mínimo
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("stock", { ascending: true });

    if (error) throw error;
    
    // Filtrar produtos com estoque baixo
    return (data as Product[]).filter(product => product.stock <= product.min_stock);
  },
};

