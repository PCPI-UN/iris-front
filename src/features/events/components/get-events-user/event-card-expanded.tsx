import {
  Award,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Link,
  MapPin,
} from "lucide-react";
import { Button } from "@heroui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Event, EventType } from "@/types/api";

import {
  RoleName,
  formatDateShort,
  getEventKindIcon,
  getEventKindLabel,
  getLocationLabel,
  getMainButtonLabel,
  getStatusLabel,
  getStatusTone,
} from "./helpers";
import { getStatusBadge } from "./event-card-collapsed";
import { is } from "zod/v4/locales";

type EventCardExpandedProps = {
  event: Event;
  isExpanded?: boolean;
  onGoDashboard: (eventId: string) => void;
};

export const EventCardExpanded = ({
  event,
  isExpanded = false,
  onGoDashboard,
}: EventCardExpandedProps) => {
  const roleName = event.role?.name as RoleName | undefined;
  const start = formatDateShort(event.startDate);
  const end = formatDateShort(event.endDate);
  const locationLabel = getLocationLabel(event.location, event.locationDetails);
  const kindLabel = getEventKindLabel(event.eventType);

  return (
    <div className="border-t border-default-200 p-6 bg-black/10 grid grid-cols-1 gap-6">
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden"
        >
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Informacion del evento</h4>

            <div className="space-y-2 text-sm text-default-400">
              <div className="flex items-center gap-2">
                {getEventKindIcon(event.eventType)}
                <span>{kindLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{start.day}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{end.day}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {start.time} - {end.time}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{locationLabel}</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-default-400 block mb-1">
                Descripcion
              </span>
              <p className="text-sm text-default-500 leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg border border-default-200 p-4 bg-content1/30">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                {event.eventType === EventType.Competition ? (
                  <>
                    {getEventKindIcon(event.eventType)}
                    Mi equipo
                  </>
                ) : (
                  <>
                    <Award className="h-4 w-4 text-default-400" />
                    Mi proyecto
                  </>
                )}
              </h4>

              <p className="text-sm text-default-500">
                Aqui puedes mostrar la informacion del equipo/proyecto cuando
                conectes ese detalle por evento.
              </p>

              <div className="mt-4 inline-flex items-center gap-2">
                {/* <FileText className="h-4 w-4" /> */}

                <Button
                  onPress={() => onGoDashboard(String(event.id))}
                  color={event.active ? "primary" : "default"}
                  className={`w-full md:w-fit ${
                    event.active
                      ? "hover:scale-[1.01]"
                      : "opacity-70 cursor-not-allowed"
                  }`}
                  isDisabled={!event.active}
                >
                  {event.active
                    ? getMainButtonLabel(roleName)
                    : "Evento Inactivo "}
                </Button>

                {/* <ExternalLink className="h-3 w-3" /> */}
              </div>
            </div>

            <div className="flex items-center justify-between p-1">
              <span className="text-sm text-default-400">
                Estado del evento:
              </span>
              <span className={`text-sm font-medium ${event.active}`}>
                {getStatusBadge(event.active)}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
