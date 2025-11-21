import { supabase } from "../integrations/supabase/client";

export interface Service {
  id: string;
  name: string;
  description?: string;
  category: "veterinary" | "grooming" | "hotel" | "retail" | "other";
  duration: number;
  price: number;
  commission?: number;
  is_active: boolean;
  tenant_id: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateServiceData {
  name: string;
  description?: string;
  category: "veterinary" | "grooming" | "hotel" | "retail" | "other";
  duration: number;
  price: number;
  commission?: number;
  is_active?: boolean;
}

export const servicesService = {
  async getAll(tenantId: string) {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw error;
    return data as Service[];
  },

  async getById(id: string, tenantId: string) {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (error) throw error;
    return data as Service;
  },

  async create(tenantId: string, userId: string, data: CreateServiceData) {
    const { data: service, error } = await supabase
      .from("services")
      .insert({
        ...data,
        is_active: data.is_active ?? true,
        tenant_id: tenantId,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return service as Service;
  },

  async update(id: string, tenantId: string, data: Partial<CreateServiceData>) {
    const { data: service, error } = await supabase
      .from("services")
      .update(data)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select()
      .single();

    if (error) throw error;
    return service as Service;
  },

  async delete(id: string, tenantId: string) {
    const { error } = await supabase
      .from("services")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw error;
  },

  async search(tenantId: string, query: string) {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order("name", { ascending: true });

    if (error) throw error;
    return data as Service[];
  },
};

