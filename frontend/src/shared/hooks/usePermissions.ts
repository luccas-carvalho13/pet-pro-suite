import { useState, useEffect } from "react";
import { permissionsService } from "@/api/services/permissions.service";

export const usePermissions = (tenantId: string | undefined, userRole: string | undefined) => {
  const [permissions, setPermissions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenantId && userRole && userRole !== "super_admin") {
      loadPermissions();
    } else {
      setLoading(false);
    }
  }, [tenantId, userRole]);

  const loadPermissions = async () => {
    if (!tenantId || !userRole) return;

    try {
      const perms = await permissionsService.getByTenantAndRole(tenantId, userRole);
      const permissionsMap: Record<string, any> = {};
      
      perms.forEach(perm => {
        permissionsMap[perm.module] = {
          view: perm.can_view,
          create: perm.can_create,
          edit: perm.can_edit,
          delete: perm.can_delete,
        };
      });

      setPermissions(permissionsMap);
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
    } finally {
      setLoading(false);
    }
  };

  const can = (module: string, action: "view" | "create" | "edit" | "delete"): boolean => {
    if (userRole === "super_admin" || userRole === "admin") return true;
    
    const modulePerms = permissions[module];
    if (!modulePerms) return false;

    return modulePerms[action] === true;
  };

  return { permissions, loading, can };
};

