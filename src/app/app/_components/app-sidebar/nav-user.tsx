"use client"

import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
  Sparkles,
} from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
} from "@/components/ui/dropdown"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { paths } from "@/config/paths"
import { useRouter } from "next/navigation";
import { useLogout } from "@/lib/auth";

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
  }
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
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <button className="flex items-center gap-2 w-full cursor-pointer">
                <Avatar
                  size="sm"
                  name={user.name}
                  className="h-8 w-8"
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </button>
            </SidebarMenuButton>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="User menu"
            className="w-56 rounded-lg"
            disallowEmptySelection
          >
            <DropdownSection showDivider aria-label="User Info">
              <DropdownItem
                key="info"
                isReadOnly
                className="h-auto cursor-default py-2"
              >
                <div className="flex items-center gap-2">
                  <Avatar
                    size="sm"
                    name={user.name}
                    className="h-8 w-8"
                  />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownItem>
            </DropdownSection>
            <DropdownSection showDivider aria-label="Settings">
              <DropdownItem key="account" startContent={<BadgeCheck />} onClick={() => router.push(paths.app.profile.getHref())}>
                Account
              </DropdownItem>
            </DropdownSection>
            <DropdownSection aria-label="Actions">
              <DropdownItem
                key="logout"
                onClick={() => logout.mutate()}
                startContent={<LogOut />}
                color="danger"
              >
                Log out
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
