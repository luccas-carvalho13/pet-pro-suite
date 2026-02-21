import * as React from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  LayoutDashboard,
  Users,
  Calendar,
  BellRing,
  Package,
  DollarSign,
  Wallet,
  Stethoscope,
  FileText,
  PawPrint,
  LifeBuoy,
  Send,
  Settings,
  ClipboardList,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary, type NavSecondaryItem } from "@/components/nav-secondary"
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
import { getMe, type MeResponse } from "@/lib/api"

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
    title: "Prontuário",
    url: "/medical-records",
    icon: ClipboardList,
    items: [],
  },
  {
    title: "Agendamentos",
    url: "/appointments",
    icon: Calendar,
    items: [],
  },
  {
    title: "Lembretes",
    url: "/reminders",
    icon: BellRing,
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
    title: "Caixa",
    url: "/cash-register",
    icon: Wallet,
    items: [],
  },
  {
    title: "Relatórios",
    url: "/reports",
    icon: FileText,
    items: [],
  },
]

const navSecondaryBase: NavSecondaryItem[] = [
  { title: "Configurações", url: "/settings", icon: Settings },
  { title: "Suporte", url: "/support", icon: LifeBuoy },
  { title: "Feedback", url: "/feedback", icon: Send },
]

const defaultUser = {
  name: "Usuário",
  email: "",
  avatar: "",
}

export type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: { name: string; email: string; avatar?: string }
  me?: MeResponse | null
}

export function AppSidebar({
  user: userProp,
  me: meProp,
  ...props
}: AppSidebarProps) {
  const { data: meQuery } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: !meProp,
    retry: false,
  })
  const me = meProp ?? meQuery
  const userData = userProp ?? (me?.user
    ? { name: me.user.full_name || "Usuário", email: me.user.email, avatar: me.user.avatar_url ?? "" }
    : defaultUser)
  const companyName = me?.company?.name ?? "Clínica Veterinária"
  const navSecondary: NavSecondaryItem[] = navSecondaryBase

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
                  <span className="truncate font-semibold">FourPet Pro</span>
                  <span className="truncate text-xs text-muted-foreground">{companyName}</span>
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
