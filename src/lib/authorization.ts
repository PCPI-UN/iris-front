import { Comment, User } from "@/types/api";

const hasRole = (user: User | null | undefined, roleName: string): boolean => {
  return user?.platformRoles?.some(role => role.name === roleName) ?? false;
};

export const canCreateDiscussion = (user: User | null | undefined) => {
  return hasRole(user, "Admin");
};
export const canDeleteDiscussion = (user: User | null | undefined) => {
  return hasRole(user, "Admin");
};
export const canUpdateDiscussion = (user: User | null | undefined) => {
  return hasRole(user, "Admin");
};

export const canCreateEvent = (user: User | null | undefined) => {
  return hasRole(user, "Admin");
};

export const canDeleteEvent = (user: User | null | undefined) => {
  return hasRole(user, "Admin");
};

export const canUpdateEvent = (user: User | null | undefined) => {
  return hasRole(user, "Admin");
};

export const canCreateProject = (user: User | null | undefined) => {
  return hasRole(user, "Admin");
};

export const canInviteJury = (user: User | null | undefined) => {
  return hasRole(user, "Admin");
};

export const canInviteAdministrator = (user: User | null | undefined) => {
  return hasRole(user, "Admin");
};

export const canDeleteProject = (user: User | null | undefined) => {
  return hasRole(user, "Admin");
};

export const canUpdateProject = (user: User | null | undefined) => {
  return hasRole(user, "Admin");
};

// Courses
export const canCreateCourse = (user: User | null | undefined) => {
  return hasRole(user, "Admin");
};

export const canDeleteCourse = (user: User | null | undefined) => {
  return hasRole(user, "Admin");
};

export const canUpdateCourse = (user: User | null | undefined) => {
  return hasRole(user, "Admin");
};

export const canViewCourses = (user: User | null | undefined) => {
  // Todos los roles autenticados pueden ver cursos por ahora
  return Boolean(user);
};

export const canDeleteComment = (
  user: User | null | undefined,
  comment: Comment
) => {
  if (hasRole(user, "Admin")) {
    return true;
  }

  // Los USER pueden eliminar sus propios comentarios
  if (hasRole(user, "User") && comment.author?.id === user?.id) {
    return true;
  }

  return false;
};
