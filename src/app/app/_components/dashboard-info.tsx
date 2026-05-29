'use client';

import { useUser } from '@/lib/auth';
import { AdminDashboard } from './admin-dashboard';
import { GetEventsUser } from '@/features/events/components/get-events-user';

export const DashboardInfo = () => {
  const user = useUser();
  const primaryRoleName =
    user.data?.platformRoles?.[0]?.name ??
    ((user.data as { role?: string } | undefined)?.role === 'ADMIN'
      ? 'Admin'
      : 'User');

  // If the user is an ADMIN, display the AdminDashboard
  if (primaryRoleName === 'Admin') {
    return <AdminDashboard />;
  }

  // For regular users, display the list of events
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
