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
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Valores por defecto mientras se carga la información
  const defaultStats = {
    activeEvents: 0,
    totalProjects: 0,
    evaluations: 0,
  };

  const displayStats = stats ?? defaultStats;

  const statsCards = [
    {
      title: 'Active events',
      value: displayStats.activeEvents,
      description: 'Currently running',
      icon: Calendar,
      iconColor: 'text-blue-500',
    },
    {
      title: 'Total projects',
      value: displayStats.totalProjects,
      description: 'Across all events',
      icon: Folder,
      iconColor: 'text-green-500',
    },
    {
      title: 'Evaluations',
      value: displayStats.evaluations,
      description: 'Completed',
      icon: FileCheck,
      iconColor: 'text-orange-500',
    },
  ];

  return (
    <div className="dashboard-page space-y-4 md:space-y-6">
      <div className="space-y-1 md:space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">
          Welcome back, {`${user.data?.firstName} ${user.data?.lastName}`}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage events, projects, and evaluations
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="glass-card shadow-sm">
            <CardHeader className="pb-2 md:pb-3">
              <div className="flex items-center justify-between w-full">
                <div className="space-y-0.5 md:space-y-1 flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-default-500 truncate">
                    {stat.title}
                  </p>
                  <h3 className="text-xl md:text-2xl font-bold">{stat.value}</h3>
                </div>
                <stat.icon className={`h-6 w-6 md:h-8 md:w-8 flex-shrink-0 ml-2 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <p className="text-xs text-default-400">
                {stat.description}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};
