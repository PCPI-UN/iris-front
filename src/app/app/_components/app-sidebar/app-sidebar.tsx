"use client";

import * as React from "react";
import Image from "next/image";
import {
  Home,
  Calendar,
  Users as UsersIcon,
  type LucideIcon,
  Presentation,
  ShieldCheck,
  ArrowDownAZ,
  SquareChartGantt,
  Mail,
  ChartNoAxesCombined,
  PinIcon,
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
  const primaryRoleName =
    user.data?.platformRoles?.[0]?.name ??
    ((user.data as { role?: string } | undefined)?.role === "ADMIN"
      ? "Admin"
      : "User");

  const getMenuItems = React.useMemo((): {
    title: string;
    url: string;
    icon: LucideIcon;
  }[] => {
    switch (primaryRoleName) {
      case "Admin":
        return [
          { title: "Dashboard", url: paths.app.root.getHref(), icon: Home },
          { title: "Eventos", url: paths.app.events.getHref(), icon: Calendar },
          {
            title: "Eventos anteriores",
            url: paths.app.pastEvents.getHref(),
            icon: Calendar,
          },
          {
            title: "Categorías",
            url: paths.app.categories.getHref(),
            icon: ArrowDownAZ,
          },
          {
            title: "Proyectos",
            url: paths.app.projects.getHref(),
            icon: SquareChartGantt,
          },
          {
            title: "Monitoreo",
            url: paths.app.monitoring.getHref(),
            icon: ChartNoAxesCombined,
          },
          {
            title: "Criterios",
            url: paths.app.criteria.getHref(),
            icon: Presentation,
          },
          {
            title: "Jurados",
            url: paths.app.juries.getHref(),
            icon: UsersIcon,
          },
          {
            title: "Asignaciones",
            url: paths.app.assignments.getHref(),
            icon: PinIcon,
          },
          {
            title: "Administradores",
            url: paths.app.administrators.getHref(),
            icon: ShieldCheck,
          },
        ];
      case "User":
        return [
          { title: "Dashboard", url: paths.app.root.getHref(), icon: Home },
          {
            title: "Mis invitaciones",
            url: paths.app.invitations.getHref(),
            icon: Mail,
          },
        ];
      default:
        return [
          { title: "Dashboard", url: paths.app.root.getHref(), icon: Home },
        ];
    }
  }, [primaryRoleName]);

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
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
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
