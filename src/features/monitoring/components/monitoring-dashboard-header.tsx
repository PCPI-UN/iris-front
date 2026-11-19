"use client";

import type { Event } from "@/types/api";

import { Calendar } from "lucide-react";
import dayjs from "dayjs";

import { Button } from "@/components/ui/button";
import "dayjs/locale/es";

type MonitoringDashboardHeaderProps = {
  onBack?: () => void;
  userName: string;
  eventData?: Event;
};

export const MonitoringDashboardHeader = ({
  onBack,
  userName,
  eventData,
}: MonitoringDashboardHeaderProps) => {
  if (eventData) {
    return (
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          {onBack ? (
            <Button
              className="w-fit font-medium text-sm"
              variant="light"
              onPress={onBack}
            >
              <svg>
                <path d="M15 18l-6-6 6-6" />
              </svg>{" "}
              Volver a eventos pasados
            </Button>
          ) : null}

          <h1 className="text-xl font-semibold">{eventData.name}</h1>
          <p className="text-sm text-default-400 max-w-2xl truncate">
            {eventData.description}
          </p>
        </div>

        <div className="flex items-center gap-4 mt-2 md:mt-0">
          <div className="flex items-center gap-2 text-xs text-default-400">
            <Calendar className="h-4 w-4" />
            <div className="text-xs">
              <div className="font-medium text-default-300">Inicio</div>
              <div className="font-semibold">
                {dayjs(eventData.startDate)
                  .locale("es")
                  .format("D [de] MMM, YYYY")}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-default-400">
            <Calendar className="h-4 w-4" />
            <div className="text-xs">
              <div className="font-medium text-default-300">Fin</div>
              <div className="font-semibold">
                {dayjs(eventData.endDate)
                  .locale("es")
                  .format("D [de] MMM, YYYY")}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-default-400">
            <Calendar className="h-4 w-4" />
            <div className="text-xs">
              <div className="font-medium text-default-300">
                Cierre de inscripción
              </div>
              <div className="font-semibold">
                {dayjs(eventData.inscriptionDeadline)
                  .locale("es")
                  .format("D [de] MMM, YYYY")}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1 md:space-y-2">
      {onBack ? (
        <Button className="w-fit font-medium" variant="light" onPress={onBack}>
          <svg>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Volver a eventos pasados
        </Button>
      ) : null}

      <h1 className="text-2xl font-semibold">Monitoreo, {userName}</h1>
      <p className="max-w-3xl text-sm text-default-500 md:text-base">
        Monitorea el progreso de las evaluaciones, analiza métricas de desempeño
        y visualiza el estado general de los proyectos y jurados en tiempo real.
      </p>
    </div>
  );
};
