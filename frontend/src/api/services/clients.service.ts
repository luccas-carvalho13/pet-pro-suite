import { supabase } from "../integrations/supabase/client";

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone: string;
  cpf?: string;
  address?: Record<string, unknown>;
  notes?: string;
  tenant_id: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateClientData {
  name: string;
  email?: string;
  phone: string;
  cpf?: string;
  address?: Record<string, unknown>;
  notes?: string;
}

export const clientsService = {
  async getAll(tenantId: string) {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Client[];
  },

  async getById(id: string, tenantId: string) {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (error) throw error;
    return data as Client;
  },

  async create(tenantId: string, userId: string, data: CreateClientData) {
    const { data: client, error } = await supabase
      .from("clients")
      .insert({
        ...data,
        tenant_id: tenantId,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return client as Client;
  },

  async update(id: string, tenantId: string, data: Partial<CreateClientData>) {
    const { data: client, error } = await supabase
      .from("clients")
      .update(data)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select()
      .single();

    if (error) throw error;
    return client as Client;
  },

  async delete(id: string, tenantId: string) {
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) throw error;
  },

  async search(tenantId: string, query: string) {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("tenant_id", tenantId)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Client[];
  },
};

