export const getProjectStateLabel = (state?: string) => {
  if (state === "UNDER_REVIEW") return "En revision";
  if (state === "APPROVED") return "Aprobado";
  if (state === "REJECTED") return "Rechazado";
  if (state === "CHANGES_REQUIRED") return "Requiere cambios";
  return state || "Sin estado";
};

export const getStateColor = (state?: string) => {
  if (state === "UNDER_REVIEW")
    return "bg-blue-500/20 text-blue-600 dark:text-blue-400";
  if (state === "APPROVED")
    return "bg-green-500/20 text-green-600 dark:text-green-400";
  if (state === "REJECTED")
    return "bg-red-500/20 text-red-600 dark:text-red-400";
  if (state === "CHANGES_REQUIRED")
    return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
  return "bg-gray-500/20 text-gray-600 dark:text-gray-400";
};

export const getInitials = (firstName?: string, lastName?: string) => {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return `${first}${last}`.toUpperCase() || "?";
};
