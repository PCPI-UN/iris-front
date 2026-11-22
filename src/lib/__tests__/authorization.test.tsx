import { User } from "@/types/api";

import {
  canCreateEvent,
  canInviteJury,
  canManageUserRoles,
  canUpdateProject,
  canViewAdministration,
  canViewCategories,
  canViewUsers,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from "../authorization";

const withPermissions = (permissions: string[], roleNames: string[] = []) =>
  ({
    id: 1,
    platformRoles: roleNames.map((name) => ({ name })),
    platformPermissions: permissions,
  }) as unknown as User;

// Same permissions as the backend catalogue (auth-service migration)
const admin = withPermissions(
  [
    "read:events",
    "manage:events",
    "read:grades",
    "read:users",
    "manage:user_roles",
    "manage:admins",
  ],
  ["Admin"],
);
const dean = withPermissions(
  ["read:events", "read:grades", "read:users", "read:invitations"],
  ["Dean"],
);
const student = withPermissions(
  ["view:public_events", "manage:own_profile"],
  ["User"],
);

describe("hasPermission", () => {
  test("decides by the session permissions", () => {
    expect(hasPermission(dean, "read:events")).toBe(true);
    expect(hasPermission(dean, "manage:events")).toBe(false);
    expect(hasPermission(null, "read:events")).toBe(false);
    expect(hasPermission(undefined, "read:events")).toBe(false);
  });

  test("ignores the role name", () => {
    // A user called "Admin" without permissions does not get access
    const nameOnly = withPermissions([], ["Admin"]);
    expect(canCreateEvent(nameOnly)).toBe(false);
    expect(canViewAdministration(nameOnly)).toBe(false);
  });

  test("any / all", () => {
    expect(hasAnyPermission(dean, ["manage:events", "read:grades"])).toBe(true);
    expect(hasAllPermissions(dean, ["manage:events", "read:grades"])).toBe(
      false,
    );
    expect(hasAllPermissions(dean, [])).toBe(false);
  });
});

describe("Authorization helpers", () => {
  test("writing events, juries and projects requires manage:events", () => {
    for (const can of [canCreateEvent, canInviteJury, canUpdateProject]) {
      expect(can(admin)).toBe(true);
      expect(can(dean)).toBe(false);
      expect(can(student)).toBe(false);
      expect(can(null)).toBe(false);
    }
  });

  test("a read-only role sees the administration but cannot write", () => {
    expect(canViewAdministration(dean)).toBe(true);
    expect(canViewUsers(dean)).toBe(true);
    expect(canManageUserRoles(dean)).toBe(false);
  });

  test("students do not see the administration", () => {
    expect(canViewAdministration(student)).toBe(false);
    expect(canViewUsers(student)).toBe(false);
  });

  test("any signed-in user can view categories", () => {
    expect(canViewCategories(admin)).toBe(true);
    expect(canViewCategories(student)).toBe(true);
    expect(canViewCategories(null)).toBe(false);
  });
});
