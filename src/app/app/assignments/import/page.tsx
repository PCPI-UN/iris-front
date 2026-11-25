"use client";

import { Suspense } from "react";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { ContentLayout } from "@/components/layouts/content-layout";
import { Spinner } from "@/components/ui/spinner";
import { JurorImportView } from "@/features/assignments/components/juror-import/juror-import-view";
import "@/features/landing/index.css";
import { PERMISSIONS } from "@/lib/authorization";

export default function AssignmentsImportPage() {
  return (
    <PermissionGuard permissions={[PERMISSIONS.manageEvents]}>
      <ContentLayout title="">
        <Suspense
          fallback={
            <div className="flex h-48 w-full items-center justify-center">
              <Spinner size="lg" />
            </div>
          }
        >
          <JurorImportView />
        </Suspense>
      </ContentLayout>
    </PermissionGuard>
  );
}

