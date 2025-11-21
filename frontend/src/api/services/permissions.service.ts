import { supabase } from "../integrations/supabase/client";

export interface RolePermission {
  id: string;
  tenant_id: string;
  role: "admin" | "supervisor" | "attendant" | "user";
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export const permissionsService = {
  async getByTenantAndRole(tenantId: string, role: string) {
    const { data, error } = await supabase
      .from("role_permissions")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("role", role)
      .order("module");

    if (error) throw error;
    return data as RolePermission[];
  },

  async updatePermission(permissionId: string, updates: Partial<RolePermission>) {
    const { data, error } = await supabase
      .from("role_permissions")
      .update(updates)
      .eq("id", permissionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async bulkUpdate(tenantId: string, role: string, permissions: Omit<RolePermission, "id" | "tenant_id" | "role" | "created_at" | "updated_at">[]) {
    // Deletar permissões existentes
    await supabase
      .from("role_permissions")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("role", role);

    // Inserir novas permissões
    const permissionsToInsert = permissions.map(p => ({
      tenant_id: tenantId,
      role,
      ...p,
    }));

    const { data, error } = await supabase
      .from("role_permissions")
      .insert(permissionsToInsert)
      .select();

    if (error) throw error;
    return data;
  },

  async checkPermission(
    userId: string,
    module: string,
    action: "view" | "create" | "edit" | "delete"
  ): Promise<boolean> {
    // Buscar usuário e role
    const { data: user } = await supabase
      .from("users")
      .select("role, tenant_id")
      .eq("id", userId)
      .single();

    if (!user) return false;

    // Super admin tem acesso total
    if (user.role === "super_admin") return true;

    // Buscar permissão
    const { data: permission } = await supabase
      .from("role_permissions")
      .select("*")
      .eq("tenant_id", user.tenant_id)
      .eq("role", user.role)
      .eq("module", module)
      .single();

    if (!permission) return false;

    switch (action) {
      case "view":
        return permission.can_view;
      case "create":
        return permission.can_create;
      case "edit":
        return permission.can_edit;
      case "delete":
        return permission.can_delete;
      default:
        return false;
    }
  },
};

