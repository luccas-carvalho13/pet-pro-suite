import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { type LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export type NavSecondaryItem = {
  title: string
  url?: string
  icon: LucideIcon
  onClick?: () => void
}

export function NavSecondary({
  items,
  ...props
}: {
  items: NavSecondaryItem[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { pathname } = useLocation()

  const isItemActive = (url?: string) => {
    if (!url || !url.startsWith("/")) return false
    return pathname === url || pathname.startsWith(`${url}/`)
  }

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            if (item.onClick) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    size="sm"
                    tooltip={item.title}
                    isActive={isItemActive(item.url)}
                    onClick={item.onClick}
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }

            const itemUrl = item.url ?? "#"
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild size="sm" tooltip={item.title} isActive={isItemActive(itemUrl)}>
                  {itemUrl.startsWith("/") ? (
                    <Link to={itemUrl}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  ) : (
                    <a href={itemUrl}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </a>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
