import { ProjectParticipant } from "@/types/api";

export const getProjectStateLabel = (state?: string) => {
  if (state === "UNDER_REVIEW") return "En revision";
  if (state === "APPROVED") return "Aprobado";
  if (state === "REJECTED") return "Rechazado";
  if (state === "REQUEST_CHANGES") return "Requiere cambios";
  return state || "Sin estado";
};

export const getStateColor = (state?: string) => {
  if (state === "UNDER_REVIEW")
    return "bg-blue-500/20 text-blue-600 dark:text-blue-400";
  if (state === "APPROVED")
    return "bg-green-500/20 text-green-600 dark:text-green-400";
  if (state === "REJECTED")
    return "bg-red-500/20 text-red-600 dark:text-red-400";
  if (state === "REQUEST_CHANGES") return "bg-sky-200/20 text-sky-300 ";
  return "bg-gray-500/20 text-gray-600 dark:text-gray-400";
};

export const getInitials = (firstName?: string, lastName?: string) => {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return `${first}${last}`.toUpperCase() || "?";
};

export const SEMESTER_OPTIONS = [
  { label: "1°", value: "1" },
  { label: "2°", value: "2" },
  { label: "3°", value: "3" },
  { label: "4°", value: "4" },
  { label: "5°", value: "5" },
  { label: "6°", value: "6" },
  { label: "7°", value: "7" },
  { label: "8°", value: "8" },
  { label: "9°", value: "9" },
  { label: "10°", value: "10" },
  { label: "11°", value: "11" },
  { label: "12°", value: "12" },
];

export const CAREER_OPTIONS = [
  { label: "Ing Civil", value: "Ingeniería Civil" },
  { label: "Ing de Sistemas", value: "Ingeniería de Sistemas y Computación" },
  { label: "Ing Electrónica", value: "Ingeniería Electrónica" },
  { label: "Ing Eléctrica", value: "Ingeniería Eléctrica" },
  { label: "Ing Industrial", value: "Ingeniería Industrial" },
  { label: "Ing Mecánica", value: "Ingeniería Mecánica" },
  { label: "Ing Biomédica", value: "Ingeniería Biomédica" },
  { label: "Ciencia de Datos", value: "Ciencia de Datos" },
];

export const statusParticipantOptions = [
  { label: 1, value: "PENDING" },
  { label: 2, value: "INVITED" },
  { label: 3, value: "JOINED" },
];

type ParticipantApiStatus = 1 | 2 | 3;

const normalizeStatusKey = (status?: string | number) => {
  if (typeof status === "number") return String(status);
  return status?.trim().toUpperCase();
};

export const normalizeParticipantStatus = (
  status?: string | number,
): ParticipantApiStatus => {
  const normalizedStatus = normalizeStatusKey(status);
  console.log("normalizeParticipantStatus", { status, normalizedStatus });
  if (normalizedStatus === "1" || normalizedStatus === "PENDING") return 1;
  if (normalizedStatus === "2" || normalizedStatus === "INVITED") return 2;
  if (normalizedStatus === "3" || normalizedStatus === "JOINED") return 3;
  return 1;
};

export const getParticipantStatusLabel = (status?: string | number) => {
  const normalizedStatus = normalizeParticipantStatus(status);

  if (normalizedStatus === 1) return "Pendiente";
  if (normalizedStatus === 2) return "Invitado";
  if (normalizedStatus === 3) return "joined";

  return "Pendiente";
};

export const getParticipantStatusColor = (status?: string | number) => {
  const normalizedStatus = normalizeParticipantStatus(status);

  if (normalizedStatus === 1) {
    return "bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30";
  }

  if (normalizedStatus === 2) {
    return "bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30";
  }

  if (normalizedStatus === 3) {
    return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30";
  }

  return "bg-gray-500/15 text-gray-600 dark:text-gray-300 border border-gray-500/30";
};

export const getCurrentUserStatus = (
  participants: ProjectParticipant[],
  userEmail?: string,
) => {
  const userParticipant = participants.find((p) => p.email === userEmail);

  if (!userParticipant) return undefined;

  return normalizeParticipantStatus(userParticipant.status);
};
