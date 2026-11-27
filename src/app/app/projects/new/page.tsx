"use client";

import { Suspense } from "react";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { ContentLayout } from "@/components/layouts/content-layout";
import { Spinner } from "@/components/ui/spinner";
import "@/features/landing/index.css";
import { AdminCreateProjectView } from "@/features/projects/components/admin-create/admin-create-project-view";
import { PERMISSIONS } from "@/lib/authorization";

export default function ProjectNewPage() {
  return (
    <PermissionGuard permissions={[PERMISSIONS.manageProjects]}>
      <ContentLayout title="">
        <Suspense
          fallback={
            <div className="flex h-48 w-full items-center justify-center">
              <Spinner size="lg" />
            </div>
          }
        >
          <AdminCreateProjectView />
        </Suspense>
      </ContentLayout>
    </PermissionGuard>
  );
}
