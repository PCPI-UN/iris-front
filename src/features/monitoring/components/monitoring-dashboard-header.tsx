'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import type { Event } from '@/types/api';
import dayjs from 'dayjs';

type MonitoringDashboardHeaderProps = {
  onBack?: () => void;
  userName: string;
  eventData?: Event;
};

export const MonitoringDashboardHeader = ({ onBack, userName, eventData }: MonitoringDashboardHeaderProps) => {
  if (eventData) {
    return (
      <div className="space-y-4">
        {onBack ? (
          <Button variant="light" onPress={onBack} className="w-fit font-medium">
            Volver a eventos pasados
          </Button>
        ) : null}

        <div className="space-y-3">
          <h1 className="text-3xl font-bold md:text-4xl">{eventData.name}</h1>
          <p className="max-w-3xl text-sm text-default-500 md:text-base">
            {eventData.description}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="glass-card rounded-lg border border-default-200/70 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-default-400">
              <Calendar className="h-4 w-4" />
              <span>Inicio</span>
            </div>
            <p className="text-base font-semibold">{dayjs(eventData.startDate).format('MMM D, YYYY')}</p>
          </div>

          <div className="glass-card rounded-lg border border-default-200/70 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-default-400">
              <Calendar className="h-4 w-4" />
              <span>Fin</span>
            </div>
            <p className="text-base font-semibold">{dayjs(eventData.endDate).format('MMM D, YYYY')}</p>
          </div>

          <div className="glass-card rounded-lg border border-default-200/70 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-default-400">
              <Calendar className="h-4 w-4" />
              <span>Deadline Inscripción</span>
            </div>
            <p className="text-base font-semibold">{dayjs(eventData.inscriptionDeadline).format('MMM D, YYYY')}</p>
          </div>
        </div>
      </div>
    );
  }

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