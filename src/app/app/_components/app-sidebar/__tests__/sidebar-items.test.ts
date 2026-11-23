import { User } from "@/types/api";

import { getSidebarItems } from "../sidebar-items";

const withPermissions = (permissions: string[], roleNames: string[] = []) =>
  ({
    id: 1,
    platformRoles: roleNames.map((name) => ({ name })),
    platformPermissions: permissions,
  }) as unknown as User;

const titles = (user: User | null) =>
  getSidebarItems(user).map((item) => item.title);

const ADMIN_PERMISSIONS = [
  "read:events",
  "manage:events",
  "read:grades",
  "read:event-members",
  "read:users",
  "manage:user_roles",
];

test("the admin sees every view", () => {
  expect(titles(withPermissions(ADMIN_PERMISSIONS, ["Admin"]))).toEqual([
    "Dashboard",
    "Administración",
    "Eventos",
    "Eventos anteriores",
    "Categorías",
    "Proyectos",
    "Monitoreo",
    "Criterios",
    "Jurados",
    "Asignaciones",
    "Administradores",
    "Usuarios y roles",
    "Mis invitaciones",
  ]);
});

test("a read-only role (dean) sees the read views but not the write-only ones", () => {
  const dean = withPermissions(
    ["read:events", "read:grades", "read:users", "read:invitations"],
    ["Dean"],
  );
  const menu = titles(dean);
  expect(menu).toEqual(
    expect.arrayContaining([
      "Eventos",
      "Eventos anteriores",
      "Proyectos",
      "Monitoreo",
      "Usuarios y roles",
    ]),
  );
  // Assignments is a write view (manage:events); juries need read:event-members
  expect(menu).not.toContain("Asignaciones");
  expect(menu).not.toContain("Jurados");
});

test("a new role works by its permissions, not by its name", () => {
  const newRole = withPermissions(["read:events"], ["SomeNewRole"]);
  expect(titles(newRole)).toEqual(
    expect.arrayContaining(["Administración", "Eventos", "Categorías", "Proyectos", "Criterios"]),
  );
});

test("a student only sees the dashboard and their invitations", () => {
  expect(titles(withPermissions(["view:public_events"], ["User"]))).toEqual([
    "Dashboard",
    "Mis invitaciones",
  ]);
});

test("the menu is the union of every role, not only the first one", () => {
  // Before, a user with ["User", "Admin"] got the User menu
  const twoRoles = withPermissions(
    ["view:public_events", ...ADMIN_PERMISSIONS],
    ["User", "Admin"],
  );
  expect(titles(twoRoles)).toContain("Eventos");
});

test("no session, no menu", () => {
  expect(getSidebarItems(null)).toEqual([]);
});
