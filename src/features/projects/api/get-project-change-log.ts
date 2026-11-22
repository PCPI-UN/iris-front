import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";

export type ProjectChangeAction =
  | "STATE"
  | "INFO"
  | "CATEGORY"
  | "PARTICIPANTS"
  | "TUTORS"
  | "DOCUMENTS";

export type ProjectChangeLogEntry = {
  id: number;
  action: ProjectChangeAction;
  /** name is null when the account was deleted or could not be resolved */
  actor: { id: number; name: string | null };
  /** ISO 8601 */
  createdAt: string;
  /** Changed fields only, with their values before the change */
  before: Record<string, unknown>;
  /** Changed fields only, with their values after the change */
  after: Record<string, unknown>;
  reason: string | null;
};

export type ProjectChangeLogResponse = {
  /** Most recent first */
  entries: ProjectChangeLogEntry[];
};

export const getProjectChangeLog = (
  projectId: number,
): Promise<ProjectChangeLogResponse> =>
  api.get(`/projects/${projectId}/change-log`);

export const getProjectChangeLogQueryOptions = (projectId: number) =>
  queryOptions({
    queryKey: ["project-change-log", projectId],
    queryFn: () => getProjectChangeLog(projectId),
  });

export const useProjectChangeLog = ({
  projectId,
  queryConfig,
}: {
  projectId: number;
  queryConfig?: QueryConfig<typeof getProjectChangeLogQueryOptions>;
}) =>
  useQuery({
    ...getProjectChangeLogQueryOptions(projectId),
    ...queryConfig,
  });
