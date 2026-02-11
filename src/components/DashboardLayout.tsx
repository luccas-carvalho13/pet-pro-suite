import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { getMe } from "@/lib/api";

const ROUTE_BREADCRUMB: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/clients": "Clientes",
  "/pets": "Pets",
  "/medical-records": "Prontuário",
  "/appointments": "Agendamentos",
  "/reminders": "Lembretes",
  "/services": "Serviços",
  "/inventory": "Estoque",
  "/financial": "Financeiro",
  "/cash-register": "Caixa",
  "/reports": "Relatórios",
  "/settings": "Configurações",
  "/super-admin": "Super Admin",
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  user?: { name: string; email: string; avatar?: string };
}

export const DashboardLayout = ({
  children,
  breadcrumbs: breadcrumbsProp,
  user,
}: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const pathname = location.pathname;
  const { data: me, isLoading, error } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });

  React.useEffect(() => {
    if (!isLoading && !error && me === null) {
      navigate("/login", { replace: true, state: { from: pathname } });
    }
  }, [isLoading, error, me, navigate, pathname]);

  const breadcrumbs =
    breadcrumbsProp ??
    (() => {
      const currentLabel = ROUTE_BREADCRUMB[pathname] ?? (pathname.slice(1) || "Início");
      const hasParent = pathname !== "/dashboard" && pathname !== "/";
      return hasParent
        ? [{ label: "Início", href: "/dashboard" }, { label: currentLabel }]
        : [{ label: currentLabel }];
    })();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-3">
          <p className="text-destructive font-medium">Erro ao validar sua sessão.</p>
          <p className="text-muted-foreground text-sm">
            Verifique sua conexão e tente novamente.
          </p>
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["me"] })}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (me === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Redirecionando para o login...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} me={me} />
      <SidebarInset className="bg-gradient-to-b from-background via-background to-muted/30">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:md:h-12">
          <div className="flex flex-1 items-center gap-2 px-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((item, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                    <BreadcrumbItem className={i > 0 ? "hidden md:block" : ""}>
                      {item.href ? (
                        <BreadcrumbLink asChild>
                          <Link to={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 md:gap-6 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
