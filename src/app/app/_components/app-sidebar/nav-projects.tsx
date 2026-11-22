"use client";

import {
  Folder,
  Forward,
  MoreHorizontal,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@/components/ui/dropdown";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "@/components/ui/link";

export function NavProjects({
  projects,
}: {
  projects: {
    name: string;
    url: string;
    icon: LucideIcon;
  }[];
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Proyectos</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <Link href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
            <Dropdown>
              <DropdownTrigger asChild>
                <SidebarMenuAction asChild showOnHover>
                  <span className="flex items-center gap-2">
                    <MoreHorizontal />
                    <span className="sr-only">Más</span>
                  </span>
                </SidebarMenuAction>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Acciones del proyecto"
                className="w-48 rounded-lg"
              >
                <DropdownItem
                  key="view"
                  startContent={<Folder className="text-muted-foreground" />}
                >
                  Ver proyecto
                </DropdownItem>
                <DropdownItem
                  key="share"
                  startContent={<Forward className="text-muted-foreground" />}
                >
                  Compartir proyecto
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  color="danger"
                  startContent={<Trash2 className="text-muted-foreground" />}
                >
                  Eliminar proyecto
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <MoreHorizontal className="text-sidebar-foreground/70" />
            <span>Más</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
