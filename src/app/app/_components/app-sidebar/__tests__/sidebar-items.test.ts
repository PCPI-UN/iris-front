import { getSidebarItems } from "../sidebar-items";

import { User } from "@/types/api";

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
    "Inicio",
    "Mis invitaciones",
    "Mi trayectoria",
    "Resumen",
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
    expect.arrayContaining([
      "Resumen",
      "Eventos",
      "Categorías",
      "Proyectos",
      "Criterios",
    ]),
  );
});

test("a student only sees the personal items, with no administration", () => {
  const student = getSidebarItems(
    withPermissions(["view:public_events"], ["User"]),
  );

  expect(student.map((item) => item.title)).toEqual([
    "Inicio",
    "Mis invitaciones",
    "Mi trayectoria",
  ]);
  expect(student.every((item) => item.group === "personal")).toBe(true);
});

test("every view other than the personal ones hangs from Administración", () => {
  const admin = getSidebarItems(withPermissions(ADMIN_PERMISSIONS, ["Admin"]));

  expect(
    admin.filter((item) => item.group === "personal").map((item) => item.title),
  ).toEqual(["Inicio", "Mis invitaciones", "Mi trayectoria"]);
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
