import { QueryClient } from "@tanstack/react-query";

import { Juries } from "./_components/Juries";
import { RoleGuard } from "@/components/auth/role-guard";

export const metadata = {
  title: "Jurados",
  description: "Gestión de invitaciones de jurados",
};

const JuriesPage = async () => {
  return (
    <RoleGuard roles={["Admin"]}>
      <Juries />
    </RoleGuard>
  );
};

export default JuriesPage;
