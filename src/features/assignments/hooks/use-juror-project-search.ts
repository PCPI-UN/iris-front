import { useMemo, useState } from "react";

import { useAllProjectsWithJurors } from "../api/get-all-projects-with-jurors";
import {
  filterProjectsByJuror,
  filterProjectsByName,
  normalizeSearchText,
} from "../utils/juror-search";

export const JUROR_SEARCH_EMPTY_MESSAGE =
  "Ningún proyecto asignado a ese jurado.";

type UseJurorProjectSearchParams = {
  eventId: number;
  state?: string;
  categoryId?: number;
  /** Current project-name search, applied on top of the juror filter. */
  projectNameFilter?: string;
};

export const useJurorProjectSearch = ({
  eventId,
  state,
  categoryId,
  projectNameFilter = "",
}: UseJurorProjectSearchParams) => {
  const [jurorTerm, setJurorTerm] = useState("");
  const isActive = normalizeSearchText(jurorTerm).length > 0;

  const allProjectsQuery = useAllProjectsWithJurors({
    eventId,
    state,
    categoryId,
    enabled: isActive,
  });

  const projects = useMemo(() => {
    if (!isActive) return [];

    return filterProjectsByName(
      filterProjectsByJuror(allProjectsQuery.data ?? [], jurorTerm),
      projectNameFilter,
    );
  }, [isActive, allProjectsQuery.data, jurorTerm, projectNameFilter]);

  return {
    jurorTerm,
    setJurorTerm,
    isActive,
    isLoading: isActive && allProjectsQuery.isLoading,
    projects,
  };
};
