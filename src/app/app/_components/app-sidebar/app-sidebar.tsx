"use client";

import * as React from "react";
import Image from "next/image";

import { NavMyEvents } from "./nav-my-events";
import { NavUser } from "./nav-user";
import { getSidebarItems, type SidebarItem } from "./sidebar-items";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useUser } from "@/lib/auth";
import { paths } from "@/config/paths";
import { Link } from "@/components/ui/link";
import "@/features/landing/index.css";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useUser();
  // Union of what every role of the session allows (not only the first role)
  const menuItems = React.useMemo(
    () => getSidebarItems(user.data),
    [user.data],
  );
  const personalItems = menuItems.filter((item) => item.group === "personal");
  const adminItems = menuItems.filter((item) => item.group === "admin");

  const data = React.useMemo(
    () => ({
      user: {
        name: user.data?.firstName + " " + user.data?.lastName,
        email: user.data?.email ?? "",
      },
      enterprise: {
        name: "Iris",
        logo: "/iris.svg",
        url: paths.home.getHref(),
      },
    }),
    [user.data?.firstName, user.data?.lastName, user.data?.email],
  );

  return (
    <Sidebar className="app-sidebar" collapsible="icon" {...props}>
      <SidebarHeader suppressHydrationWarning>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href={data.enterprise.url}>
                <Image
                  alt="Iris Logo"
                  className="!size-5"
                  height={20}
                  src={data.enterprise.logo}
                  width={20}
                />
                <span className="text-base font-semibold">
                  {data.enterprise.name}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent suppressHydrationWarning>
        <NavGroup items={personalItems} />
        <NavMyEvents />
        {adminItems.length > 0 && (
          <NavGroup items={adminItems} label="Administración" />
        )}
      </SidebarContent>
      <SidebarFooter suppressHydrationWarning>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function NavGroup({ items, label }: { items: SidebarItem[]; label?: string }) {
  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={item.title}>
              <Link href={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
