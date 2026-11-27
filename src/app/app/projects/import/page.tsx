"use client";

import { Suspense } from "react";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { ContentLayout } from "@/components/layouts/content-layout";
import { Spinner } from "@/components/ui/spinner";
import "@/features/landing/index.css";
import { ProjectImportView } from "@/features/projects/components/project-import/project-import-view";
import { PERMISSIONS } from "@/lib/authorization";

export default function ProjectImportPage() {
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
          <ProjectImportView />
        </Suspense>
      </ContentLayout>
    </PermissionGuard>
  );
}
