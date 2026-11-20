import {
  ArrowDownAZ,
  Calendar,
  ChartNoAxesCombined,
  Home,
  type LucideIcon,
  Mail,
  PinIcon,
  Presentation,
  ShieldCheck,
  SquareChartGantt,
  UserCog,
  Users as UsersIcon,
} from "lucide-react";

import { paths } from "@/config/paths";
import { hasAnyPermission, Permission, PERMISSIONS } from "@/lib/authorization";
import { User } from "@/types/api";

export type SidebarItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  /** Any of these opens the item; the same permission its page requires. Empty: any session */
  permissions: Permission[];
};

/**
 * Every menu item with the permission of its page. The menu is the union of
 * what all the session's roles allow, so a new role with read permissions
 * sees its views without changing the front.
 */
const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    title: "Dashboard",
    url: paths.app.root.getHref(),
    icon: Home,
    permissions: [],
  },
  {
    title: "Eventos",
    url: paths.app.events.getHref(),
    icon: Calendar,
    permissions: [PERMISSIONS.readEvents],
  },
  {
    title: "Eventos anteriores",
    url: paths.app.pastEvents.getHref(),
    icon: Calendar,
    permissions: [PERMISSIONS.readEvents],
  },
  {
    title: "Categorías",
    url: paths.app.categories.getHref(),
    icon: ArrowDownAZ,
    permissions: [PERMISSIONS.readEvents],
  },
  {
    title: "Proyectos",
    url: paths.app.projects.getHref(),
    icon: SquareChartGantt,
    permissions: [PERMISSIONS.readEvents],
  },
  {
    title: "Monitoreo",
    url: paths.app.monitoring.getHref(),
    icon: ChartNoAxesCombined,
    permissions: [PERMISSIONS.readGrades],
  },
  {
    title: "Criterios",
    url: paths.app.criteria.getHref(),
    icon: Presentation,
    permissions: [PERMISSIONS.readEvents],
  },
  {
    title: "Jurados",
    url: paths.app.juries.getHref(),
    icon: UsersIcon,
    permissions: [PERMISSIONS.readEventMembers],
  },
  {
    title: "Asignaciones",
    url: paths.app.assignments.getHref(),
    icon: PinIcon,
    permissions: [PERMISSIONS.manageEvents],
  },
  {
    title: "Administradores",
    url: paths.app.administrators.getHref(),
    icon: ShieldCheck,
    permissions: [PERMISSIONS.readUsers],
  },
  {
    title: "Usuarios y roles",
    url: paths.app.users.getHref(),
    icon: UserCog,
    permissions: [PERMISSIONS.readUsers],
  },
  {
    title: "Mis invitaciones",
    url: paths.app.invitations.getHref(),
    icon: Mail,
    permissions: [],
  },
];

export const getSidebarItems = (
  user: User | null | undefined,
): SidebarItem[] =>
  user
    ? SIDEBAR_ITEMS.filter(
        (item) =>
          item.permissions.length === 0 ||
          hasAnyPermission(user, item.permissions),
      )
    : [];
