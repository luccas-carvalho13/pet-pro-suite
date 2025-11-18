import { supabase } from "@/integrations/supabase/client";

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  companyName: string;
  cnpj?: string;
  phone?: string;
  address?: string;
  planId: string;
}

export const registerCompany = async (data: RegisterData) => {
  const { data: result, error } = await supabase.functions.invoke("register-company", {
    body: data,
  });

  if (error) throw error;
  return result;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getUserRole = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role, company_id")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*, companies(*)")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
};

export const getCompanyStatus = async (companyId: string) => {
  const { data, error } = await supabase
    .from("companies")
    .select("status, trial_ends_at, subscription_ends_at")
    .eq("id", companyId)
    .single();

  if (error) throw error;
  return data;
};