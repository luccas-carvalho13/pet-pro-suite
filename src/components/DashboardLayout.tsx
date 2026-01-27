import * as React from "react";
import { Link, useLocation } from "react-router-dom";
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

const ROUTE_BREADCRUMB: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/clients": "Clientes",
  "/pets": "Pets",
  "/appointments": "Agendamentos",
  "/services": "Serviços",
  "/inventory": "Estoque",
  "/financial": "Financeiro",
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
  const location = useLocation();
  const pathname = location.pathname;

  const breadcrumbs =
    breadcrumbsProp ??
    (() => {
      const currentLabel = ROUTE_BREADCRUMB[pathname] ?? (pathname.slice(1) || "Início");
      const hasParent = pathname !== "/dashboard" && pathname !== "/";
      return hasParent
        ? [{ label: "Início", href: "/dashboard" }, { label: currentLabel }]
        : [{ label: currentLabel }];
    })();

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:md:h-12">
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
