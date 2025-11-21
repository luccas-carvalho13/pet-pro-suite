import { supabase } from "../integrations/supabase/client";

export interface FinancialTransaction {
  id: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  payment_method: "cash" | "credit_card" | "debit_card" | "pix" | "bank_transfer" | "other";
  date: string;
  appointment_id?: string;
  supplier?: string;
  invoice?: string;
  notes?: string;
  tenant_id: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTransactionData {
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  payment_method?: "cash" | "credit_card" | "debit_card" | "pix" | "bank_transfer" | "other";
  date: string;
  appointment_id?: string;
  supplier?: string;
  invoice?: string;
  notes?: string;
}

export const financialTransactionsService = {
  async getAll(tenantId: string, filters?: { type?: "income" | "expense"; startDate?: string; endDate?: string }) {
    let query = supabase
      .from("financial_transactions")
      .select("*")
      .eq("tenant_id", tenantId);

    if (filters?.type) {
      query = query.eq("type", filters.type);
    }
    if (filters?.startDate) {
      query = query.gte("date", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("date", filters.endDate);
    }

    const { data, error } = await query.order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as FinancialTransaction[];
  },

  async getById(id: string, tenantId: string) {
    const { data, error } = await supabase
      .from("financial_transactions")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (error) throw error;
    return data as FinancialTransaction;
  },

  async create(tenantId: string, userId: string, data: CreateTransactionData) {
    const { data: transaction, error } = await supabase
      .from("financial_transactions")
      .insert({
        ...data,
        payment_method: data.payment_method ?? "cash",
        tenant_id: tenantId,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return transaction as FinancialTransaction;
  },

  async update(id: string, tenantId: string, data: Partial<CreateTransactionData>) {
    const { data: transaction, error } = await supabase
      .from("financial_transactions")
      .update(data)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select()
      .single();

    if (error) throw error;
    return transaction as FinancialTransaction;
  },

  async delete(id: string, tenantId: string) {
    const { error } = await supabase
      .from("financial_transactions")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) throw error;
  },

  async getStats(tenantId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from("financial_transactions")
      .select("type, amount")
      .eq("tenant_id", tenantId);

    if (startDate) {
      query = query.gte("date", startDate);
    }
    if (endDate) {
      query = query.lte("date", endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const stats = {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
    };

    data?.forEach((transaction) => {
      if (transaction.type === "income") {
        stats.totalIncome += Number(transaction.amount);
      } else {
        stats.totalExpenses += Number(transaction.amount);
      }
    });

    stats.balance = stats.totalIncome - stats.totalExpenses;

    return stats;
  },
};

