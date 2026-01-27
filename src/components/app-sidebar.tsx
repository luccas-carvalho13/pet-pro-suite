import * as React from "react"
import { Link } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Calendar,
  Package,
  DollarSign,
  Stethoscope,
  FileText,
  PawPrint,
  LifeBuoy,
  Send,
  Settings,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    items: [],
  },
  {
    title: "Clientes",
    url: "/clients",
    icon: Users,
    items: [],
  },
  {
    title: "Pets",
    url: "/pets",
    icon: PawPrint,
    items: [],
  },
  {
    title: "Agendamentos",
    url: "/appointments",
    icon: Calendar,
    items: [],
  },
  {
    title: "Serviços",
    url: "/services",
    icon: Stethoscope,
    items: [],
  },
  {
    title: "Estoque",
    url: "/inventory",
    icon: Package,
    items: [],
  },
  {
    title: "Financeiro",
    url: "/financial",
    icon: DollarSign,
    items: [],
  },
  {
    title: "Relatórios",
    url: "/reports",
    icon: FileText,
    items: [],
  },
]

const navSecondary = [
  { title: "Configurações", url: "/settings", icon: Settings },
  { title: "Support", url: "#", icon: LifeBuoy },
  { title: "Feedback", url: "#", icon: Send },
]

const defaultUser = {
  name: "Usuário",
  email: "email@exemplo.com",
  avatar: "",
}

export type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: { name: string; email: string; avatar?: string }
}

export function AppSidebar({
  user,
  ...props
}: AppSidebarProps) {
  const userData = user ?? defaultUser

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <PawPrint className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Pet Pro Suite</span>
                  <span className="truncate text-xs text-muted-foreground">Clínica Veterinária</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        <NavMain items={navMain} />
        <NavProjects projects={[]} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
