"use client";

import { ProjectsTable } from "@/features/assignments/components/project-table";
import { AssignJudgesPanel } from "@/features/assignments/components/assign-judges-panel";
import { RoleGuard } from "@/components/auth/role-guard";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import Assignments from "./_components/assignments";

export const AssignJudgesPage = () => {
  const queryClient = new QueryClient();
  const dehydratedState = dehydrate(queryClient);

  return (
    <RoleGuard roles={["Admin"]}>
      <HydrationBoundary state={dehydratedState}>
        <Assignments />
      </HydrationBoundary>
    </RoleGuard>
  );
};

export default AssignJudgesPage