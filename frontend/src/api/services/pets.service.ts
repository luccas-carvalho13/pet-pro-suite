import { supabase } from "../integrations/supabase/client";

export interface Pet {
  id: string;
  name: string;
  species: "dog" | "cat" | "bird" | "rabbit" | "reptile" | "other";
  breed?: string;
  gender: "male" | "female" | "unknown";
  birth_date?: string;
  weight?: number;
  color?: string;
  photo?: string;
  microchip?: string;
  medical_history?: Record<string, unknown>[];
  vaccines?: Record<string, unknown>[];
  allergies?: string[];
  medications?: Record<string, unknown>[];
  client_id: string;
  tenant_id: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePetData {
  name: string;
  species: "dog" | "cat" | "bird" | "rabbit" | "reptile" | "other";
  breed?: string;
  gender?: "male" | "female" | "unknown";
  birth_date?: string;
  weight?: number;
  color?: string;
  photo?: string;
  microchip?: string;
  medical_history?: Record<string, unknown>[];
  vaccines?: Record<string, unknown>[];
  allergies?: string[];
  medications?: Record<string, unknown>[];
  client_id: string;
}

export const petsService = {
  async getAll(tenantId: string) {
    const { data, error } = await supabase
      .from("pets")
      .select(`
        *,
        clients:client_id (
          id,
          name,
          email,
          phone
        )
      `)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Pet[];
  },

  async getById(id: string, tenantId: string) {
    const { data, error } = await supabase
      .from("pets")
      .select(`
        *,
        clients:client_id (
          id,
          name,
          email,
          phone
        )
      `)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (error) throw error;
    return data as Pet;
  },

  async create(tenantId: string, userId: string, data: CreatePetData) {
    const { data: pet, error } = await supabase
      .from("pets")
      .insert({
        ...data,
        tenant_id: tenantId,
        created_by: userId,
      })
      .select(`
        *,
        clients:client_id (
          id,
          name,
          email,
          phone
        )
      `)
      .single();

    if (error) throw error;
    return pet as Pet;
  },

  async update(id: string, tenantId: string, data: Partial<CreatePetData>) {
    const { data: pet, error } = await supabase
      .from("pets")
      .update(data)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select(`
        *,
        clients:client_id (
          id,
          name,
          email,
          phone
        )
      `)
      .single();

    if (error) throw error;
    return pet as Pet;
  },

  async delete(id: string, tenantId: string) {
    const { error } = await supabase
      .from("pets")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) throw error;
  },

  async search(tenantId: string, query: string) {
    const { data, error } = await supabase
      .from("pets")
      .select(`
        *,
        clients:client_id (
          id,
          name,
          email,
          phone
        )
      `)
      .eq("tenant_id", tenantId)
      .or(`name.ilike.%${query}%,breed.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Pet[];
  },

  async getByClient(clientId: string, tenantId: string) {
    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .eq("client_id", clientId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Pet[];
  },
};

