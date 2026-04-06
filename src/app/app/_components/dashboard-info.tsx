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
    <div className="dashboard-page space-y-4 md:space-y-6">
      <div className="space-y-1 md:space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">
          Welcome back, {`${user.data?.firstName} ${user.data?.lastName}`}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Select an event
        </p>
      </div>
      <div className="w-full overflow-x-auto">
        <GetEventsUser />
      </div>
    </div>
  );
};
