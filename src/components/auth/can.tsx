"use client";

import { ReactNode } from "react";

import { useUser } from "@/lib/auth";
import { hasAnyPermission, Permission } from "@/lib/authorization";

type CanProps = {
  /** Any of these shows the children */
  permission: Permission | Permission[];
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * Shows an action (create, edit, delete...) only to sessions with the
 * permission its endpoint requires, so read-only roles do not see buttons
 * that would answer 403.
 */
export const Can = ({ permission, children, fallback = null }: CanProps) => {
  const { data: user } = useUser();
  const permissions = Array.isArray(permission) ? permission : [permission];
  return <>{hasAnyPermission(user, permissions) ? children : fallback}</>;
};
