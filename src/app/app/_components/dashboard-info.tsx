'use client';

import { useUser } from '@/lib/auth';
import { AdminDashboard } from './admin-dashboard';
import { GetEventsUser } from '@/features/events/components/get-events-user';
import { StudentGeneralDashboardView } from '@/features/student-dashboard';

export const DashboardInfo = () => {
  const user = useUser();
  // Un usuario puede tener varios roles de plataforma: se revisan todos, no solo el primero
  const roleNames = (user.data?.platformRoles ?? []).map((role) => role.name);
  const legacyRole = (user.data as { role?: string } | undefined)?.role;

  const isAdmin = roleNames.includes('Admin') || legacyRole === 'ADMIN';
  // Sin roles de plataforma (usuarios del mock) se asume un usuario regular
  const isRegularUser = roleNames.length === 0 || roleNames.includes('User');

  // Si es ADMIN, despliega el Dashboard de Administración
  if (isAdmin) {
    return <AdminDashboard />;
  }

  // Para estudiantes y participantes, despliega el Dashboard General del Estudiante
  if (isRegularUser) {
    return <StudentGeneralDashboardView />;
  }

  // Otros roles de plataforma (gestores, profesores, tutores...) no son estudiantes:
  // conservan la lista de sus eventos
  return (
    <div className="dashboard-page ">
      <div className="pt-5 flex flex-col gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">
          Bienvenido a tus Eventos especiales, {`${user.data?.firstName} ${user.data?.lastName}`}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Selecciona un evento para ver tus proyectos relacionados.
        </p>
      </div>
      <div className="w-full mt-12 overflow-x-auto">
        <GetEventsUser />
      </div>
    </div>
  );
};
