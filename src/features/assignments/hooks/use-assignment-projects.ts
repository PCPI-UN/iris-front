import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useJurorProjectSearch } from "./use-juror-project-search";

import {
  ProjectWithJurors,
  useProjectsWithJurors,
} from "@/features/projects/api/get-projects-with-jurors";
import { readCategoryIdFromSearchParams } from "@/lib/compat/category-legacy";

/** Only approved projects get jurors */
const ASSIGNMENT_STATE = "APPROVED";

const useDebouncedValue = <T>(value: T, delay = 300) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

const toPositiveNumber = (value: string | null | undefined) => {
  const num = Number(value);

  return Number.isInteger(num) && num > 0 ? num : 0;
};

/**
 * Projects of the Asignaciones screen, shared by the table, the mobile cards
 * and the side panels. Event, category and page come from the URL; the name
 * search goes to the backend (`q`) inside the same React Query list, so an
 * assignment or a change of category refreshes it like the plain listing.
 * The juror search keeps reading the whole event (see useJurorProjectSearch).
 */
export const useAssignmentProjects = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = toPositiveNumber(searchParams?.get("page")) || 1;
  const eventId = toPositiveNumber(searchParams?.get("event"));
  const categoryId = toPositiveNumber(
    readCategoryIdFromSearchParams(searchParams),
  );

  const [nameTerm, setNameTerm] = useState("");
  const q = useDebouncedValue(nameTerm.trim());

  const projectsQuery = useProjectsWithJurors({
    currentPage: page,
    eventId,
    state: ASSIGNMENT_STATE,
    categoryId: categoryId || undefined,
    q: q || undefined,
    queryConfig: { enabled: eventId > 0 },
  });

  const jurorSearch = useJurorProjectSearch({
    eventId,
    state: ASSIGNMENT_STATE,
    categoryId: categoryId || undefined,
    projectNameFilter: nameTerm,
  });

  const projects: ProjectWithJurors[] = jurorSearch.isActive
    ? jurorSearch.projects
    : (projectsQuery.data?.data ?? []);

  /** Keeps event, category and the other params; only the page changes */
  const setPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");

    params.set("page", String(nextPage));
    router.push(`${pathname ?? ""}?${params.toString()}`);
  };

  const changeNameTerm = (value: string) => {
    setNameTerm(value);
    // A new search starts on its first page
    if (page !== 1) setPage(1);
  };

  return {
    eventId,
    categoryId,
    page,
    nameTerm,
    setNameTerm: changeNameTerm,
    jurorSearch,
    projects,
    meta: jurorSearch.isActive ? undefined : projectsQuery.data?.meta,
    isLoading:
      jurorSearch.isLoading || (eventId > 0 && projectsQuery.isLoading),
    setPage,
  };
};

export type AssignmentProjects = ReturnType<typeof useAssignmentProjects>;
