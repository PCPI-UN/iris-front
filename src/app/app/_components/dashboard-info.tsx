'use client';

import { useUser } from '@/lib/auth';
import { AdminDashboard } from './admin-dashboard';
import { StudentGeneralDashboardView } from '@/features/student-dashboard';

export const DashboardInfo = () => {
  const user = useUser();
  const primaryRoleName =
    user.data?.platformRoles?.[0]?.name ??
    ((user.data as { role?: string } | undefined)?.role === 'ADMIN'
      ? 'Admin'
      : 'User');

  // Si es ADMIN, despliega el Dashboard de Administración
  if (primaryRoleName === 'Admin') {
    return <AdminDashboard />;
  }

  // Para estudiantes y participantes, despliega el Dashboard General del Estudiante
  return <StudentGeneralDashboardView />;
};
