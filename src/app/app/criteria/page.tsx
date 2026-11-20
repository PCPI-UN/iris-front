import { Criteria } from "./_components/criteria";
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS } from '@/lib/authorization';

export const metadata = {
  title: "Criterios",
  description: "Gestión de Criterios de Evaluación",
};

const CriteriaPage = async () => {
  // No prefetch needed since we need event and category selection first
  // The component will handle loading states

  return (
    <PermissionGuard permissions={[PERMISSIONS.readEvents]}>
      <Criteria />
    </PermissionGuard>
  );
};

export default CriteriaPage;
