import { TeachingView } from "./_components/teaching-view";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@/lib/authorization";

export const metadata = {
  title: "Docencia",
  description: "Proyectos de los cursos y tutorías",
};

const TeachingPage = () => (
  // Every /academic endpoint requires read:academic_projects
  <PermissionGuard permissions={[PERMISSIONS.readAcademicProjects]}>
    <TeachingView />
  </PermissionGuard>
);

export default TeachingPage;
