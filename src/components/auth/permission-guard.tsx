"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

import { useUser } from "@/lib/auth";
import { hasAnyPermission, Permission } from "@/lib/authorization";

export type PermissionGuardProps = {
  /**
   * Platform permissions that open the view (any of them). Use the same
   * permission the gateway requires for the endpoints the view reads.
   * An empty list only requires a session.
   */
  permissions: Permission[];
  children: ReactNode;
  redirectTo?: string;
  loading?: ReactNode;
};

const Spinner = ({ label }: { label?: string }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
      {label && <p className="mt-4 text-sm text-muted-foreground">{label}</p>}
    </div>
  </div>
);

/**
 * Shows the view only to sessions with the permission. It decides by the
 * session's `platformPermissions`, never by role name, so a new role with the
 * right permissions sees the view without changing the front.
 */
export function PermissionGuard({
  permissions,
  children,
  redirectTo = "/app",
  loading,
}: PermissionGuardProps) {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

  const isAllowed =
    !!user && (permissions.length === 0 || hasAnyPermission(user, permissions));

  useEffect(() => {
    if (!isLoading && !isAllowed) {
      router.replace(redirectTo);
    }
  }, [isLoading, isAllowed, redirectTo, router]);

  if (isLoading) {
    return <>{loading || <Spinner label="Cargando..." />}</>;
  }

  if (!isAllowed) {
    // Redirecting
    return <>{loading || <Spinner />}</>;
  }

  return <>{children}</>;
}
