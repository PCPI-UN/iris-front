"use client";

import { BadgeCheck, ChevronsUpDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar } from "@/components/ui/avatar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
} from "@/components/ui/dropdown";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { paths } from "@/config/paths";
import { useLogout } from "@/lib/auth";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
  };
}) {
  const router = useRouter();
  const logout = useLogout({
    onSuccess: () => {
      window.location.href = paths.home.getHref();
    },
  });

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Dropdown>
          <DropdownTrigger asChild>
            <SidebarMenuButton
              asChild
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              size="lg"
            >
              <button className="flex items-center gap-2 w-full cursor-pointer">
                <Avatar className="h-8 w-8" name={user.name} size="sm" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </button>
            </SidebarMenuButton>
          </DropdownTrigger>
          <DropdownMenu
            disallowEmptySelection
            aria-label="Menú de usuario"
            className="w-56 rounded-lg"
          >
            <DropdownSection showDivider aria-label="Información de usuario">
              <DropdownItem
                key="info"
                isReadOnly
                className="h-auto cursor-default py-2"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8" name={user.name} size="sm" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownItem>
            </DropdownSection>
            <DropdownSection showDivider aria-label="Configuración">
              <DropdownItem
                key="account"
                startContent={<BadgeCheck />}
                onClick={() => router.push(paths.app.profile.getHref())}
              >
                Cuenta
              </DropdownItem>
            </DropdownSection>
            <DropdownSection aria-label="Acciones">
              <DropdownItem
                key="logout"
                color="danger"
                startContent={<LogOut />}
                onClick={() => logout.mutate()}
              >
                Cerrar sesión
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
