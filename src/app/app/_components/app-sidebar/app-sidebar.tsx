"use client";

import * as React from "react";
import Image from "next/image";

import { NavUser } from "./nav-user";
import { getSidebarItems } from "./sidebar-items";
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
  const menuItems = React.useMemo(() => getSidebarItems(user.data), [user.data]);


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
    [user.data?.firstName, user.data?.lastName, user.data?.email]
  );

  return (
    <Sidebar collapsible="icon" className="app-sidebar" {...props}>
      <SidebarHeader suppressHydrationWarning>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href={data.enterprise.url}>
                <Image
                  src={data.enterprise.logo}
                  alt="Iris Logo"
                  width={20}
                  height={20}
                  className="!size-5"
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
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter suppressHydrationWarning>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
