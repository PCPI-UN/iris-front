import { useEffect, useState } from "react";

import { AssignmentProjects } from "./use-assignment-projects";

import { ProjectWithJurors } from "@/features/projects/api/get-projects-with-jurors";

export type ProjectPanelType = "assign" | "view";

/**
 * Side panel of Asignaciones. Only the project id is kept: the project is read
 * from the current list, so after assigning or removing a juror the panel
 * shows the refreshed jurors. When the project leaves the list (another event,
 * category, page or search) the panel closes.
 */
export const useProjectPanel = ({
  projects,
  isLoading,
}: AssignmentProjects) => {
  const [panel, setPanel] = useState<{
    type: ProjectPanelType;
    projectId: ProjectWithJurors["id"];
  } | null>(null);

  const project = panel
    ? projects.find((item) => String(item.id) === String(panel.projectId))
    : undefined;

  const isMissing = Boolean(panel) && !isLoading && !project;

  useEffect(() => {
    if (isMissing) setPanel(null);
  }, [isMissing]);

  return {
    type: project ? panel?.type : undefined,
    project,
    open: (type: ProjectPanelType, item: ProjectWithJurors) =>
      setPanel({ type, projectId: item.id }),
    close: () => setPanel(null),
  };
};
