import { supabase } from "../integrations/supabase/client";

export interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: "trial" | "active" | "suspended" | "past_due" | "cancelled";
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export const subscriptionsService = {
  async getByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*, plans(*)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  },

  async create(tenantId: string, planId: string, isTrial: boolean = false) {
    const trialEndsAt = isTrial
      ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from("subscriptions")
      .insert({
        tenant_id: tenantId,
        plan_id: planId,
        status: isTrial ? "trial" : "active",
        trial_ends_at: trialEndsAt,
        current_period_start: new Date().toISOString(),
        current_period_end: isTrial ? trialEndsAt : null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStatus(subscriptionId: string, status: Subscription["status"]) {
    const { data, error } = await supabase
      .from("subscriptions")
      .update({ status })
      .eq("id", subscriptionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async checkTrialExpired(tenantId: string): Promise<boolean> {
    const subscription = await this.getByTenant(tenantId);
    
    if (!subscription || subscription.status !== "trial") {
      return false;
    }

    if (subscription.trial_ends_at) {
      return new Date(subscription.trial_ends_at) < new Date();
    }

    return false;
  },
};

