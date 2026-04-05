import dayjs from "dayjs";
import {
  Calendar,
  Code2,
  FileText,
  GraduationCap,
  MapPin,
  Scale,
} from "lucide-react";

export type RoleName = "Participant" | "Juror";

export const formatDateShort = (date: string | number) => {
  return {
    day: dayjs(date).format("MMM D, YYYY"),
    time: dayjs(date).format("h:mm A"),
  };
};

export const getRoleIcon = (role?: RoleName) => {
  if (role === "Juror") return <Scale className="h-4 w-4" />;
  if (role === "Participant") return <GraduationCap className="h-4 w-4" />;
  return null;
};

export const getRoleColor = (role?: RoleName) => {
  if (role === "Juror") return "warning";
  if (role === "Participant") return "primary";
  return "default";
};

export const getRoleLabel = (role?: RoleName) => {
  if (role === "Juror") return "Jurado";
  if (role === "Participant") return "Participante";
  return "Sin rol";
};

export const getEventKindLabel = (eventType?: string) => {
  if (eventType === "Competition") return "Competencia";
  if (eventType === "Exposition") return "Presentacion";
  return "Evento";
};

export const getEventKindIcon = (eventType?: string) => {
  if (eventType === "Competition") {
    return <Code2 className="h-4 w-4" />;
  }

  return <FileText className="h-4 w-4" />;
};

export const getLocationLabel = (
  location?: string,
  locationDetails?: string,
) => {
  return locationDetails || location || "Sin ubicacion";
};

export const getMainButtonLabel = (role?: RoleName) => {
  if (role === "Juror") return "Ver proyectos";
  return "Ver mi proyecto";
};

export const getStatusTone = (active: boolean) => {
  return active ? "text-green-600" : "text-red-600";
};

export const getStatusLabel = (active: boolean) => {
  return active ? "Activo" : "Cerrado";
};

export const getCollapsedMetaItems = (event: {
  eventType?: string;
  startDate: string;
  location?: string;
  locationDetails?: string;
}) => {
  const start = formatDateShort(event.startDate);
  const locationLabel = getLocationLabel(event.location, event.locationDetails);

  return [
    {
      icon: getEventKindIcon(event.eventType),
      value: getEventKindLabel(event.eventType),
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      value: start.day,
    },
    {
      icon: <MapPin className="h-4 w-4" />,
      value: locationLabel,
    },
  ];
};
