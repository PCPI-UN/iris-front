import { AcademicProfile } from "../types";

import { saveFile } from "@/features/reports/api/download-evaluation-report";
import { api } from "@/lib/api-client";

/** Fallback when the backend does not send Content-Disposition */
const diplomaFileName = (projectId: number) =>
  `diploma_proyecto_${projectId}.pdf`;

/**
 * Award diploma of one project of the scope (GET /academic/projects/:id/diploma),
 * the same PDF its students download; only for DIRECTOR and DEAN.
 */
export const downloadAcademicDiploma = async (
  profile: AcademicProfile,
  projectId: number,
) => {
  const { blob, fileName } = await api.download(
    `/academic/projects/${projectId}/diploma`,
    {
      params: { profile },
      // The button shows its own message
      suppressErrorNotification: true,
    },
  );

  saveFile(blob, fileName ?? diplomaFileName(projectId));
};
