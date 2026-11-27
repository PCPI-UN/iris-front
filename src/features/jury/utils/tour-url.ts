import { paths } from "@/config/paths";

export const TOUR_360_BASE_URL =
  "https://tours-360-coral.vercel.app/tour/proyecto-pf/ar";

type IdInput = number | string | null | undefined;

const normalizeTextSegment = (value: IdInput): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = String(value).trim();

  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Formats the Tour 360 `equipo` code using the backend department name and assigned project number:
 * `<departmentName>-<projectCode>`. Returns `null` if either value is missing.
 */
export const formatTourTeamCode = ({
  departmentName,
  projectCode,
}: {
  departmentName: string | null | undefined;
  projectCode: IdInput;
}): string | null => {
  const cleanDepartment = normalizeTextSegment(departmentName);
  const cleanProjectCode = normalizeTextSegment(projectCode);

  if (!cleanDepartment || !cleanProjectCode) {
    return null;
  }

  return `${cleanDepartment}-${cleanProjectCode}`;
};

export const buildTourUrl = ({
  departmentName,
  projectCode,
  projectId,
  origin,
}: {
  departmentName: string | null | undefined;
  projectCode: IdInput;
  projectId: IdInput;
  origin: string;
}): string | null => {
  const teamCode = formatTourTeamCode({
    departmentName,
    projectCode,
  });
  const rawProjectId = normalizeTextSegment(projectId);

  if (!teamCode || !rawProjectId || !origin) {
    return null;
  }

  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return null;
  }

  if (parsedOrigin.protocol !== "http:" && parsedOrigin.protocol !== "https:") {
    return null;
  }

  const evaluationPath = paths.app.evaluations.getHref(rawProjectId);
  const dynamicUrl = new URL(evaluationPath, parsedOrigin.origin).toString();

  const tourUrl = new URL(TOUR_360_BASE_URL);
  tourUrl.searchParams.set("url-dinamica", dynamicUrl);
  tourUrl.searchParams.set("equipo", teamCode);

  return tourUrl.toString();
};

export const navigateToTour = (url: string) => {
  window.location.assign(url);
};
