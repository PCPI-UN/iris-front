"use client";

import * as React from "react";
import Image from "next/image";
import {
  Home,
  MessageSquare,
  Calendar,
  Users as UsersIcon,
  type LucideIcon,
  Presentation,
  ShieldCheck,
  ArrowDownAZ,
  SquareChartGantt,
} from "lucide-react";

import { NavUser } from "./nav-user";
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

  const getMenuItems = React.useMemo((): {
    title: string;
    url: string;
    icon: LucideIcon;
  }[] => {
    switch (user.data?.platformRoles[0].name) {
      case "Admin":
        return [
          { title: "Dashboard", url: paths.app.root.getHref(), icon: Home },
          { title: "Events", url: paths.app.events.getHref(), icon: Calendar },
          {
            title: "Courses",
            url: paths.app.courses.getHref(),
            icon: ArrowDownAZ,
          },
          {
            title: "Projects",
            url: paths.app.projects.getHref(),
            icon: SquareChartGantt,
          },
          {
            title: "Criteria",
            url: paths.app.criteria.getHref(),
            icon: Presentation,
          },
          { title: "Juries", url: paths.app.juries.getHref(), icon: UsersIcon },
          {
            title: "Administrators",
            url: paths.app.administrators.getHref(),
            icon: ShieldCheck,
          },
        ];
      case "USER":
        return [
          { title: "Dashboard", url: paths.app.root.getHref(), icon: Home },
        ];
      default:
        return [
          { title: "Dashboard", url: paths.app.root.getHref(), icon: Home },
        ];
    }
  }, [user.data?.platformRoles[0].name]);

  const menuItems = getMenuItems;

  const data = React.useMemo(
    () => ({
      user: {
        name: user.data?.firstName + " " + user.data?.lastName,
        email: user.data?.email ?? "",
      },
      enterprise: {
        name: "Iris",
        logo: "/iris.svg",
        url: "#",
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
