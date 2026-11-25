import {
  ArrowDownAZ,
  Calendar,
  ChartNoAxesCombined,
  GraduationCap,
  Home,
  LayoutDashboard,
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

/**
 * The same sections as the panel at /app: what is the person's own, and the
 * administration views
 */
export type SidebarGroupId = "personal" | "admin";

export type SidebarItem = {
  title: string;
  group: SidebarGroupId;
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
    title: "Inicio",
    group: "personal",
    url: paths.app.root.getHref(),
    icon: Home,
    permissions: [],
  },
  {
    title: "Mis invitaciones",
    group: "personal",
    url: paths.app.invitations.getHref(),
    icon: Mail,
    permissions: [],
  },
  {
    title: "Mi trayectoria",
    group: "personal",
    url: paths.app.academicHistory.getHref(),
    icon: GraduationCap,
    permissions: [],
  },
  {
    title: "Resumen",
    group: "admin",
    url: paths.app.admin.getHref(),
    icon: LayoutDashboard,
    permissions: [PERMISSIONS.readEvents],
  },
  {
    title: "Eventos",
    group: "admin",
    url: paths.app.events.getHref(),
    icon: Calendar,
    permissions: [PERMISSIONS.readEvents],
  },
  {
    title: "Eventos anteriores",
    group: "admin",
    url: paths.app.pastEvents.getHref(),
    icon: Calendar,
    permissions: [PERMISSIONS.readEvents],
  },
  {
    title: "Categorías",
    group: "admin",
    url: paths.app.categories.getHref(),
    icon: ArrowDownAZ,
    permissions: [PERMISSIONS.readEvents],
  },
  {
    title: "Proyectos",
    group: "admin",
    url: paths.app.projects.getHref(),
    icon: SquareChartGantt,
    permissions: [PERMISSIONS.readEvents],
  },
  {
    title: "Monitoreo",
    group: "admin",
    url: paths.app.monitoring.getHref(),
    icon: ChartNoAxesCombined,
    permissions: [PERMISSIONS.readGrades],
  },
  {
    title: "Criterios",
    group: "admin",
    url: paths.app.criteria.getHref(),
    icon: Presentation,
    permissions: [PERMISSIONS.readEvents],
  },
  {
    title: "Jurados",
    group: "admin",
    url: paths.app.juries.getHref(),
    icon: UsersIcon,
    permissions: [PERMISSIONS.readEventMembers],
  },
  {
    title: "Asignaciones",
    group: "admin",
    url: paths.app.assignments.getHref(),
    icon: PinIcon,
    permissions: [PERMISSIONS.manageEvents],
  },
  {
    title: "Administradores",
    group: "admin",
    url: paths.app.administrators.getHref(),
    icon: ShieldCheck,
    permissions: [PERMISSIONS.readUsers],
  },
  {
    title: "Usuarios y roles",
    group: "admin",
    url: paths.app.users.getHref(),
    icon: UserCog,
    permissions: [PERMISSIONS.readUsers],
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
