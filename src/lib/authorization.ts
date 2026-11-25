import { User } from "@/types/api";

/**
 * Platform permissions of the backend (auth-service catalogue). Views decide by
 * permission, never by role name: a new role with read permissions sees its
 * views without changing the front. The gateway requires the same permission
 * for the endpoints each view uses (`apps/gateway/src/common/authorization/route-policy.ts`).
 */
export const PERMISSIONS = {
  readEvents: "read:events",
  manageEvents: "manage:events",
  readGrades: "read:grades",
  readEventMembers: "read:event-members",
  createEventMembers: "create:event-members",
  deleteEventMembers: "delete:event-members",
  manageCourses: "manage:courses",
  readInvitations: "read:invitations",
  readUsers: "read:users",
  createUsers: "create:users",
  manageUserRoles: "manage:user_roles",
  /** Admin and FacultyAdmin: administrative corrections of a project (state, data) and its change log */
  manageProjects: "manage:projects",
  /** Read-only academic views (/academic/*): the back limits the projects to the session's scope */
  readAcademicProjects: "read:academic_projects",
  /** Only the principal Admin: grants or removes Admin and FacultyAdmin */
  manageAdmins: "manage:admins",
} as const;

export type Permission =
  | (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
  | string;

type MaybeUser = User | null | undefined;

export const hasPermission = (user: MaybeUser, permission: Permission) =>
  user?.platformPermissions?.includes(permission) ?? false;

export const hasAnyPermission = (user: MaybeUser, permissions: Permission[]) =>
  permissions.some((permission) => hasPermission(user, permission));

export const hasAllPermissions = (user: MaybeUser, permissions: Permission[]) =>
  permissions.length > 0 &&
  permissions.every((permission) => hasPermission(user, permission));

/** Staff that reads events (admin, faculty admin, dean, event manager...) */
export const canViewAdministration = (user: MaybeUser) =>
  hasPermission(user, PERMISSIONS.readEvents);

/** Professor, tutor, director, dean...: the projects of their academic scope */
export const canViewTeaching = (user: MaybeUser) =>
  hasPermission(user, PERMISSIONS.readAcademicProjects);

// Events
export const canCreateEvent = (user: MaybeUser) =>
  hasPermission(user, PERMISSIONS.manageEvents);

export const canDeleteEvent = (user: MaybeUser) =>
  hasPermission(user, PERMISSIONS.manageEvents);

export const canUpdateEvent = (user: MaybeUser) =>
  hasPermission(user, PERMISSIONS.manageEvents);

// Projects (review, approve, assign jurors)
export const canCreateProject = (user: MaybeUser) =>
  hasPermission(user, PERMISSIONS.manageEvents);

export const canUpdateProject = (user: MaybeUser) =>
  hasPermission(user, PERMISSIONS.manageEvents);

// Administrative corrections: PATCH /projects/:id/admin(/state), participants, documents and GET /projects/:id/change-log
export const canManageProjects = (user: MaybeUser) =>
  hasPermission(user, PERMISSIONS.manageProjects);

// Juries: POST /invitations/events/:eventId/jurors requires manage:events
export const canInviteJury = (user: MaybeUser) =>
  hasPermission(user, PERMISSIONS.manageEvents);

// Administrators are created with POST /users (create:users)
export const canInviteAdministrator = (user: MaybeUser) =>
  hasPermission(user, PERMISSIONS.createUsers);

// Categories: POST/DELETE /events/courses require the event-members permissions
export const canCreateCategory = (user: MaybeUser) =>
  hasPermission(user, PERMISSIONS.createEventMembers);

export const canDeleteCategory = (user: MaybeUser) =>
  hasPermission(user, PERMISSIONS.deleteEventMembers);

export const canUpdateCategory = (user: MaybeUser) =>
  hasPermission(user, PERMISSIONS.manageCourses);

export const canViewCategories = (user: MaybeUser) => Boolean(user);

// Users and roles
export const canViewUsers = (user: MaybeUser) =>
  hasPermission(user, PERMISSIONS.readUsers);

export const canManageUserRoles = (user: MaybeUser) =>
  hasPermission(user, PERMISSIONS.manageUserRoles);
