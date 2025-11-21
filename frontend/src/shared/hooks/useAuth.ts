import { useState, useEffect } from "react";
import { authService } from "@/api/services/auth.service";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant_id?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuth();
  }, []);

  const loadAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setTenantId(currentUser.tenant_id || null);
      }
    } catch (error) {
      console.error("Erro ao carregar autenticação:", error);
      // Limpar dados inválidos
      localStorage.removeItem("user");
      localStorage.removeItem("tenant");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const { authService } = await import("@/api/services/auth.service");
    await authService.signOut();
    setUser(null);
    setTenantId(null);
  };

  return { user, tenantId, loading, userId: user?.id, signOut };
};
