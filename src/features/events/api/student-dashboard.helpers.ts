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
  if (state === "REQUEST_CHANGES")
    return "bg-sky-200/20 text-sky-300 ";
  return "bg-gray-500/20 text-gray-600 dark:text-gray-400";
};

export const getInitials = (firstName?: string, lastName?: string) => {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return `${first}${last}`.toUpperCase() || "?";
};

export function getSemesterFromParticipant(semestre: number | string) {
  if (typeof semestre === "string") {
    const parsedSemestre = parseInt(semestre);
    if (!isNaN(parsedSemestre)) {
      semestre = parsedSemestre;
    }
  }

  switch (semestre) {
    case 1:
      return "1er semestre";
    case 2:
      return "2do semestre";
    case 3:
      return "3er semestre";
    case 4:
      return "4to semestre";
    case 5:
      return "5to semestre";
    case 6:
      return "6to semestre";
    case 7:
      return "7mo semestre";
    case 8:
      return "8vo semestre";
    case 9:
      return "9no semestre";
    case 10:
      return "10mo semestre";
    default:
      return "Semestre desconocido";
  }
}
