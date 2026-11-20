import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@/lib/authorization";

import { Users } from "./_components/users";

export const metadata = {
  title: "Usuarios y roles",
  description: "Roles de plataforma y roles de cada usuario",
};

const UsersPage = () => {
  return (
    // GET /users and GET /users/roles require read:users
    <PermissionGuard permissions={[PERMISSIONS.readUsers]}>
      <Users />
    </PermissionGuard>
  );
};

export default UsersPage;
