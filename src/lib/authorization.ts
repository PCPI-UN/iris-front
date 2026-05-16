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

// Categories
export const canCreateCategory = (user: User | null | undefined) => {
  return hasRole(user, "Admin");
};

export const canDeleteCategory = (user: User | null | undefined) => {
  return hasRole(user, "Admin");
};

export const canUpdateCategory = (user: User | null | undefined) => {
  return hasRole(user, "Admin");
};

export const canViewCategories = (user: User | null | undefined) => {
  // Todos los roles autenticados pueden ver categorías por ahora
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
