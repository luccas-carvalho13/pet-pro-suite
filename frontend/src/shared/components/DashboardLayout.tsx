import { Heart, LayoutDashboard, Users, Calendar, Package, DollarSign, Settings, LogOut, Stethoscope, FileText, PawPrint, Shield } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { subscriptionsService } from "@/api/services/subscriptions.service";
import { tenantsService } from "@/api/services/tenants.service";

interface DashboardLayoutProps {
  children: React.ReactNode;
  tenantId?: string;
  userRole?: string;
}

export const DashboardLayout = ({ children, tenantId, userRole }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isBlocked, setIsBlocked] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(userRole === "super_admin");

  useEffect(() => {
    if (tenantId) {
      checkSubscriptionStatus();
    }
  }, [tenantId]);

  const checkSubscriptionStatus = async () => {
    if (!tenantId) return;

    try {
      const blocked = await tenantsService.isBlocked(tenantId);
      setIsBlocked(blocked);

      if (!blocked) {
        const subscription = await subscriptionsService.getByTenant(tenantId);
        if (subscription?.trial_ends_at) {
          const daysLeft = Math.ceil(
            (new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          setTrialDaysLeft(daysLeft);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar status da assinatura:", error);
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Clientes", href: "/clients", icon: Users },
    { name: "Pets", href: "/pets", icon: PawPrint },
    { name: "Agendamentos", href: "/appointments", icon: Calendar },
    { name: "Serviços", href: "/services", icon: Stethoscope },
    { name: "Estoque", href: "/inventory", icon: Package },
    { name: "Financeiro", href: "/financial", icon: DollarSign },
    { name: "Relatórios", href: "/reports", icon: FileText },
  ];

  const handleLogout = async () => {
    try {
      const { authService } = await import("@/api/services/auth.service");
      await authService.signOut();
      toast.success("Logout realizado com sucesso!");
      // Limpar localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("tenant");
      navigate("/");
      // Recarregar página para limpar estado
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Limpar localStorage mesmo em caso de erro
      localStorage.removeItem("user");
      localStorage.removeItem("tenant");
      navigate("/");
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Fixo - Sem Scroll */}
        <aside className="w-64 border-r bg-card/50 backdrop-blur-sm flex flex-col h-full shrink-0">
          <div className="p-6 border-b shrink-0">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">PetCare ERP</span>
            </Link>
          </div>
          
          {/* Navegação - Sem Scroll, com overflow oculto */}
          <nav className="flex-1 p-4 space-y-1 overflow-hidden">
            <div className="h-full flex flex-col">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all shrink-0",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Rodapé do Sidebar - Fixo na parte inferior */}
          <div className="p-4 border-t space-y-1 shrink-0">
            <Link to="/settings">
              <Button variant="ghost" className="w-full justify-start gap-3">
                <Settings className="h-5 w-5" />
                <span>Configurações</span>
              </Button>
            </Link>
            {isSuperAdmin && (
              <Link to="/super-admin">
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <Shield className="h-5 w-5" />
                  <span>Super Admin</span>
                </Button>
              </Link>
            )}
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </Button>
          </div>
        </aside>

        {/* Main Content - Com Scroll Apenas Aqui */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Banner de Trial - Fixo no Topo */}
          {trialDaysLeft !== null && trialDaysLeft > 0 && trialDaysLeft <= 3 && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 shrink-0">
              <div className="container mx-auto max-w-7xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      ⚠️ Seu trial expira em {trialDaysLeft} {trialDaysLeft === 1 ? "dia" : "dias"}
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Contrate um plano para continuar usando o sistema sem interrupções
                    </p>
                  </div>
                  <Button size="sm" onClick={() => navigate("/settings?tab=plans")}>
                    Ver Planos
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Overlay de Bloqueio */}
          {isBlocked && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="max-w-md w-full">
                <CardHeader>
                  <CardTitle className="text-destructive">Sistema Bloqueado</CardTitle>
                  <CardDescription>
                    {trialDaysLeft !== null && trialDaysLeft <= 0
                      ? "Seu período de trial expirou. Contrate um plano para continuar usando o sistema."
                      : "Sua assinatura está suspensa ou vencida. Regularize o pagamento para continuar."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Você pode visualizar seus dados, mas não pode criar ou editar informações até regularizar sua assinatura.
                  </p>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => navigate("/settings?tab=billing")}>
                      Ver Planos e Contratar
                    </Button>
                    <Button variant="outline" onClick={handleLogout}>
                      Sair
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Conteúdo com Scroll - Bloqueio Visual */}
          <div className={cn("flex-1 overflow-y-auto", isBlocked && "pointer-events-none opacity-50")}>
            <div className="container mx-auto p-6 max-w-7xl min-h-full pb-20">
              {children}
            </div>
          </div>

          {/* Footer Fixo - Sempre na parte inferior */}
          <footer className="border-t bg-white shrink-0 h-12 flex items-center justify-center relative overflow-hidden">
            <div className="footer-border-animated"></div>
            <div className="px-6 text-center text-xs text-muted-foreground relative z-10">
              © 2025 EZ SOFT. Todos os direitos reservados. Desenvolvido por{" "}
              <a
                href="https://www.linkedin.com/in/luccas-carvalhodesenvolvedor"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 font-medium inline-block"
              >
                Luccas Carvalho
              </a>
            </div>
          </footer>
        </main>
      </div>

      <style>{`
        .footer-border-animated {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, hsl(var(--primary)), transparent);
          animation: border-slide 3s infinite;
        }
        
        @keyframes border-slide {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
};
