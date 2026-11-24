import { AdminDashboard } from "../_components/admin-dashboard";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@/lib/authorization";

export const metadata = {
  title: "Administración",
  description: "Panel de administración",
};

const AdminPage = () => {
  return (
    // GET /dashboard/stats requires read:events
    <PermissionGuard permissions={[PERMISSIONS.readEvents]}>
      <AdminDashboard />
    </PermissionGuard>
  );
};

export default AdminPage;
