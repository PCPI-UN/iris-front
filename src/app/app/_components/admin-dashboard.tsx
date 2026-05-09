'use client';

import { useUser } from '@/lib/auth';
import { Calendar, Folder, FileCheck } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { useDashboardStats } from '@/features/dashboard/api/get-dashboard-stats';
import { Spinner } from '@/components/ui/spinner';
import '@/features/landing/index.css';

export const AdminDashboard = () => {
  const user = useUser();
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const defaultStats = {
    activeEvents: 0,
    totalProjects: 0,
    evaluations: 0,
  };

  const displayStats = stats ?? defaultStats;

  const statsCards = [
    {
      title: 'Eventos activos',
      value: displayStats.activeEvents,
      description: 'Eventos actualmente en curso',
      icon: Calendar,
      iconColor: 'text-blue-500',
    },
    {
      title: 'Proyectos totales',
      value: displayStats.totalProjects,
      description: 'Proyectos registrados en la plataforma',
      icon: Folder,
      iconColor: 'text-emerald-500',
    },
    {
      title: 'Evaluaciones',
      value: displayStats.evaluations,
      description: 'Evaluaciones completadas',
      icon: FileCheck,
      iconColor: 'text-amber-500',
    },
  ];

  return (
    <div className="dashboard-page space-y-4 md:space-y-6">
      <div className="space-y-1 md:space-y-2">
        <h1 className="text-2xl font-bold md:text-3xl">
          Welcome, {`${user.data?.firstName} ${user.data?.lastName}`}
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Manage events, projects, and evaluations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="glass-card shadow-sm">
            <CardHeader className="pb-2 md:pb-3">
              <div className="flex w-full items-center justify-between">
                <div className="min-w-0 flex-1 space-y-0.5 md:space-y-1">
                  <p className="truncate text-xs font-medium text-default-500 md:text-sm">
                    {stat.title}
                  </p>
                  <h3 className="text-xl font-bold md:text-2xl">{stat.value}</h3>
                </div>
                <stat.icon className={`ml-2 h-6 w-6 flex-shrink-0 md:h-8 md:w-8 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <p className="text-xs text-default-400">{stat.description}</p>
            </CardBody>
          </Card>
        ))}
      </div>

    </div>
  );
};
