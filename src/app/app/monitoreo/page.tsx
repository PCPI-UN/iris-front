import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@/lib/authorization";

import { MonitoringDashboard } from "../_components/monitoring-dashboard";

export const metadata = {
  title: "Monitoreo",
  description: "Monitoreo del administrador",
};

const MonitoringPage = () => {
  return (
    // Rankings and evaluation progress: GET /events/:eventId/rankings requires read:grades
    <PermissionGuard permissions={[PERMISSIONS.readGrades]}>
      <MonitoringDashboard />
    </PermissionGuard>
  );
};

export default MonitoringPage;
