"use client";

import { CalendarDays } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "@/components/ui/link";
import { paths } from "@/config/paths";
import { useMeEvents } from "@/features/events/api/get-me-events";
import { ME_EVENTS_PAGE_SIZE } from "@/features/events/components/me-events-section";

/**
 * The events in progress where the session holds a role, the same first page
 * the panel shows (shared cache). Each one opens the event panel with the
 * person's first role; the history stays in the panel. Hidden while loading,
 * on error or with no events: the panel already explains those cases.
 */
export function NavMyEvents() {
  const eventsQuery = useMeEvents({
    status: "current",
    page: 1,
    limit: ME_EVENTS_PAGE_SIZE,
  });
  const events = eventsQuery.data?.data ?? [];
  const hasMore = (eventsQuery.data?.meta?.totalPages ?? 1) > 1;

  if (events.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Mis eventos</SidebarGroupLabel>
      <SidebarMenu>
        {events.map((event) => (
          <SidebarMenuItem key={event.id}>
            <SidebarMenuButton asChild tooltip={event.name}>
              <Link href={`/app/events/${event.id}/dashboard`}>
                <CalendarDays />
                <span>{event.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        {hasMore && (
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-sidebar-foreground/70">
              <Link href={paths.app.root.getHref()}>
                <span>Ver todos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
