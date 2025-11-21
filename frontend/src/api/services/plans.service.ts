import { supabase } from "../integrations/supabase/client";

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  trial_days: number;
  is_trial: boolean;
  features: Record<string, unknown>;
  is_active: boolean;
}

export const plansService = {
  async getAll() {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("price", { ascending: true });

    if (error) throw error;
    return data as Plan[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Plan;
  },

  async getTrialPlan() {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("is_trial", true)
      .eq("is_active", true)
      .single();

    if (error) throw error;
    return data as Plan;
  },
};

