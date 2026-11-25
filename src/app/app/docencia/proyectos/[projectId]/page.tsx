import { TeachingProjectDetail } from "../../_components/teaching-project-detail";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@/lib/authorization";

export const metadata = {
  title: "Proyecto",
  description: "Detalle académico del proyecto",
};

const TeachingProjectPage = async ({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) => {
  const { projectId } = await params;

  return (
    <PermissionGuard permissions={[PERMISSIONS.readAcademicProjects]}>
      <TeachingProjectDetail projectId={Number(projectId)} />
    </PermissionGuard>
  );
};

export default TeachingProjectPage;
