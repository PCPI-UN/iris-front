import { QueryClient } from "@tanstack/react-query";

import { Juries } from "./_components/Juries";
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS } from '@/lib/authorization';

export const metadata = {
  title: "Jurados",
  description: "Gestión de invitaciones de jurados",
};

const JuriesPage = async () => {
  return (
    <PermissionGuard permissions={[PERMISSIONS.readEventMembers]}>
      <Juries />
    </PermissionGuard>
  );
};

export default JuriesPage;
