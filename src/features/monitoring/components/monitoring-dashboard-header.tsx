'use client';

import { Button } from '@/components/ui/button';

type MonitoringDashboardHeaderProps = {
  onBack?: () => void;
  userName: string;
};

export const MonitoringDashboardHeader = ({ onBack, userName }: MonitoringDashboardHeaderProps) => {
  return (
    <div className="space-y-1 md:space-y-2">
      {onBack ? (
        <Button variant="light" onPress={onBack} className="w-fit font-medium">
          Volver a eventos pasados
        </Button>
      ) : null}

      <h1 className="text-3xl font-bold md:text-4xl">
        Monitoreo, {userName}
      </h1>
      <p className="max-w-3xl text-sm text-default-500 md:text-base">
        Monitorea el progreso de las evaluaciones, analiza métricas de desempeño y visualiza el estado general de los proyectos y jurados en tiempo real.
      </p>
    </div>
  );
};