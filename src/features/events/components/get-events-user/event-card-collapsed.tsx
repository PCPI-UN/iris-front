import { ChevronDown, ChevronUp } from "lucide-react";

import { Card, CardBody } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Event } from "@/types/api";

import {
  RoleName,
  getCollapsedMetaItems,
  getRoleColor,
  getRoleIcon,
  getRoleLabel,
} from "./helpers";

type EventCardCollapsedProps = {
  event: Event;
  isExpanded: boolean;
  onToggle: (eventId: string) => void;
};

export const getStatusBadge = (active: boolean) => {
  if (active) {
    return (
      <Chip color="success" variant="flat" size="md">
        Activo
      </Chip>
    );
  }

  return (
    <Chip color="default" variant="faded" size="md">
      Cerrado
    </Chip>
  );
};

export const EventCardCollapsed = ({
  event,
  isExpanded,
  onToggle,
}: EventCardCollapsedProps) => {
  const roleName = event.role?.name as RoleName | undefined;
  const metaItems = getCollapsedMetaItems({
    eventType: event.eventType,
    startDate: event.startDate,
    location: event.location,
    locationDetails: event.locationDetails,
  });

  return (
    <Card
      shadow="sm"
      className={`glass-card border border-default-200/40 overflow-hidden transition-all ${
        isExpanded ? "md:col-span-2 lg:col-span-3 row-span-1" : "col-span-1"
      }`}
    >
      <CardBody className="p-0">
        <button
          type="button"
          onClick={() => onToggle(String(event.id))}
          className="text-left p-5 hover:bg-black/10 transition-colors "
        >
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1 ">
              <div className="flex items-end-safe w-full gap-2 pb-3">
                <h3 className="text-lg md:text-xl font-semibold line-clamp-2 text-ellipsis">
                  {event.name}
                </h3>
              </div>

              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {!isExpanded && getStatusBadge(event.active)}
                {!isExpanded && roleName && (
                  <Chip
                    color={getRoleColor(roleName)}
                    variant="flat"
                    size="sm"
                    startContent={getRoleIcon(roleName)}
                    className="gap-1 p-1 pl-2"
                  >
                    {getRoleLabel(roleName)}
                  </Chip>
                )}
              </div>
            </div>

            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-default-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-default-400 flex-shrink-0" />
            )}
          </div>
          {!isExpanded && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-default-500 line-clamp-2">
                {event.description}
              </p>
            </div>
          )}
        </button>
      </CardBody>
    </Card>
  );
};
