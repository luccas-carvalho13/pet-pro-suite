import { supabase } from "../integrations/supabase/client";

export interface RegisterTenantData {
  fullName: string;
  email: string;
  password: string;
  clinicName: string;
  slug: string;
  cnpj?: string;
  phone?: string;
  address?: string;
  planId: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Função auxiliar para hash de senha (mesma usada na Edge Function)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export const authService = {
  async registerTenant(data: RegisterTenantData) {
    try {
      const { data: result, error } = await supabase.functions.invoke("register-tenant", {
        body: data,
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);

      // Salvar usuário no localStorage
      if (result.user) {
        localStorage.setItem("user", JSON.stringify(result.user));
      }

      return result;
    } catch (error: any) {
      throw new Error(error.message || "Erro ao registrar tenant");
    }
  },

  async signIn(email: string, password: string) {
    try {
      // Buscar usuário pelo email
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("is_active", true)
        .single();

      if (userError || !user) {
        throw new Error("Email ou senha incorretos");
      }

      // Verificar senha
      const hashedPassword = await hashPassword(password);
      if (user.password !== hashedPassword) {
        throw new Error("Email ou senha incorretos");
      }

      // Buscar tenant
      const { data: tenant } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", user.tenant_id)
        .single();

      // Preparar dados do usuário para salvar
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
      };

      // Salvar no localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      if (tenant) {
        localStorage.setItem("tenant", JSON.stringify(tenant));
      }

      return { user: userData, tenant };
    } catch (error: any) {
      throw new Error(error.message || "Erro ao fazer login");
    }
  },

  async signOut() {
    // Limpar sessão local se necessário
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    localStorage.removeItem("tenant");
  },

  async getCurrentUser() {
    // Buscar usuário da sessão local ou token
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    return JSON.parse(userStr);
  },

  async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error) throw error;
    return data;
  },

  async getUserTenant(userId: string) {
    const { data, error } = await supabase
      .from("users")
      .select("tenant_id, tenants(*)")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  async getTenant(tenantId: string) {
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .single();

    if (error) throw error;
    return data;
  },
};
