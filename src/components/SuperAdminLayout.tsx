import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getMe } from "@/lib/api";
import { Shield } from "lucide-react";

type SuperAdminLayoutProps = { children: React.ReactNode };

export const SuperAdminLayout = ({ children }: SuperAdminLayoutProps) => {
  const navigate = useNavigate();
  const { data: me, isLoading, error } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (error || !me) {
    navigate("/login", { replace: true });
    return null;
  }

  if (!me.is_superadmin) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-widest text-muted-foreground">Super Admin</p>
              <p className="text-lg font-semibold">FourPet Pro</p>
              <p className="text-xs text-muted-foreground">Gestão inteligente para negócios de quatro patas.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/dashboard">Voltar ao App</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
};
