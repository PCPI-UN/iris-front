"use client";

import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS } from '@/lib/authorization';
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import Assignments from "./_components/assignments";

export const AssignJudgesPage = () => {
  const queryClient = new QueryClient();
  const dehydratedState = dehydrate(queryClient);

  return (
    <PermissionGuard permissions={[PERMISSIONS.manageEvents]}>
      <HydrationBoundary state={dehydratedState}>
        <Assignments />
      </HydrationBoundary>
    </PermissionGuard>
  );
};

export default AssignJudgesPage