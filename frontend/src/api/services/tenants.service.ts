import { supabase } from "../integrations/supabase/client";

export interface CreateTenantData {
  name: string;
  slug: string;
  email: string;
  cnpj?: string;
  phone?: string;
  address?: Record<string, unknown>;
}

export const tenantsService = {
  async create(data: CreateTenantData) {
    const { data: tenant, error } = await supabase
      .from("tenants")
      .insert({
        ...data,
        subscription_status: "trial",
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return tenant;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateStatus(tenantId: string, status: string) {
    const { data, error } = await supabase
      .from("tenants")
      .update({ subscription_status: status })
      .eq("id", tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTrialEndsAt(tenantId: string, trialEndsAt: string) {
    const { data, error } = await supabase
      .from("tenants")
      .update({ trial_ends_at: trialEndsAt })
      .eq("id", tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async isBlocked(tenantId: string): Promise<boolean> {
    const tenant = await this.getById(tenantId);
    
    if (!tenant || !tenant.is_active) {
      return true;
    }

    const status = tenant.subscription_status;
    return status === "suspended" || status === "past_due" || status === "cancelled";
  },
};

