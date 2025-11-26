import { Criteria } from "./_components/criteria";
import { RoleGuard } from "@/components/auth/role-guard";

export const metadata = {
  title: "Criterios",
  description: "Gestión de Criterios de Evaluación",
};

const CriteriaPage = async () => {
  // No prefetch needed since we need event and course selection first
  // The component will handle loading states

  return (
    <RoleGuard roles={["Admin"]}>
      <Criteria />
    </RoleGuard>
  );
};

export default CriteriaPage;
