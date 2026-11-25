"use client";

import type { ProjectFilterValues } from "./project-filters";
import type {
  AcademicCourse,
  RegistrationProject,
} from "@/features/academic/types";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { FolderSearch, Search, SlidersHorizontal, X } from "lucide-react";

import { ProjectFilters } from "./project-filters";

import { useAcademicProjects } from "@/features/academic/api/get-academic-projects";
import { useAcademicRegistrations } from "@/features/academic/api/get-academic-registrations";
import {
  AcademicProjectCard,
  RegistrationCounters,
} from "@/features/academic/components";
import {
  describeStudents,
  formatCourse,
  PROJECT_STATE_LABELS,
} from "@/features/academic/utils/academic-labels";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@/components/ui/drawer";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { paths } from "@/config/paths";

/** Cards per page: fills rows of 2 and 3 columns */
export const TEACHING_PROJECTS_PAGE_SIZE = 12;

/** Course sections of the projects, each once, by name and NRC */
const coursesOf = (projects: RegistrationProject[]) => {
  const byId = new Map<number, AcademicCourse>();

  projects.forEach(({ academicCourse }) => {
    if (academicCourse) byId.set(academicCourse.id, academicCourse);
  });

  return [...byId.values()].sort((a, b) =>
    formatCourse(a).localeCompare(formatCourse(b), "es"),
  );
};

const useDebounced = <T,>(value: T, delay = 300) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

/** Proyectos tab: registration totals, then the projects with search and filters */
export const ProjectsTab = ({ eventId }: { eventId: number }) => {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ProjectFilterValues>({});
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const q = useDebounced(search);

  const registrationsQuery = useAcademicRegistrations({ eventId });
  const projectsQuery = useAcademicProjects({
    filters: {
      eventId,
      ...filters,
      q,
      page,
      itemsPerPage: TEACHING_PROJECTS_PAGE_SIZE,
    },
    // Changing a filter keeps the current cards until the next ones arrive
    queryConfig: { placeholderData: keepPreviousData },
  });

  const registrations = registrationsQuery.data;
  const courses = useMemo(
    () => coursesOf(registrations?.projects ?? []),
    [registrations],
  );
  // The registrations bring the students with their state; the list only the project
  const registrationById = useMemo(
    () =>
      new Map(
        (registrations?.projects ?? []).map((row) => [row.projectId, row]),
      ),
    [registrations],
  );

  const projects = projectsQuery.data?.items ?? [];
  const total = projectsQuery.data?.total ?? 0;
  const totalPages = projectsQuery.data?.totalPages ?? 1;
  const activeCourse = courses.find(
    (course) => course.id === filters.academicCourseId,
  );
  const activeFilters =
    Number(Boolean(filters.state)) + Number(Boolean(activeCourse));

  const changeFilters = (values: ProjectFilterValues) => {
    setFilters(values);
    setPage(1);
  };

  return (
    <div className="space-y-5 pt-5">
      {registrations && <RegistrationCounters totals={registrations.totals} />}

      <div className="space-y-3">
        <div className="flex gap-2">
          <label className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#0e101a]/80 px-3 backdrop-blur-xl focus-within:border-cyan-400/60 md:max-w-md">
            <Search
              aria-hidden="true"
              className="size-4 shrink-0 text-slate-400"
            />
            <span className="sr-only">Buscar proyecto</span>
            <input
              className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              placeholder="Buscar por nombre"
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <button
            aria-label={
              activeFilters
                ? `Filtrar, ${activeFilters} ${activeFilters === 1 ? "filtro activo" : "filtros activos"}`
                : "Filtrar"
            }
            className="relative inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-[#0e101a]/80 px-4 text-sm font-medium text-slate-200 backdrop-blur-xl transition-colors hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 md:hidden"
            type="button"
            onClick={() => setSheetOpen(true)}
          >
            <SlidersHorizontal
              aria-hidden="true"
              className="size-4 text-cyan-400"
            />
            Filtrar
            {activeFilters > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-cyan-400 text-[11px] font-bold text-slate-950">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* Desktop: the filters in line; mobile: in a bottom sheet */}
        <div className="hidden md:block">
          <ProjectFilters
            courses={courses}
            layout="inline"
            values={filters}
            onChange={changeFilters}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span aria-live="polite">
            {registrations && (activeFilters > 0 || q)
              ? `${total} de ${registrations.totals.projects} proyectos`
              : `${total} ${total === 1 ? "proyecto" : "proyectos"}`}
          </span>
          {filters.state && (
            <button
              aria-label={`Quitar filtro ${PROJECT_STATE_LABELS[filters.state]}`}
              className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-white/5 px-2 text-slate-300 hover:bg-white/10 md:hidden"
              type="button"
              onClick={() => changeFilters({ ...filters, state: undefined })}
            >
              {PROJECT_STATE_LABELS[filters.state]}
              <X aria-hidden="true" className="size-3" />
            </button>
          )}
          {activeCourse && (
            <button
              aria-label={`Quitar filtro ${formatCourse(activeCourse)}`}
              className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-white/5 px-2 text-slate-300 hover:bg-white/10 md:hidden"
              type="button"
              onClick={() =>
                changeFilters({ ...filters, academicCourseId: undefined })
              }
            >
              NRC {activeCourse.nrc}
              <X aria-hidden="true" className="size-3" />
            </button>
          )}
        </div>
      </div>

      {projectsQuery.isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : projectsQuery.isError ? (
        <div className="rounded-3xl border border-white/10 bg-[#0e101a]/70 p-6 text-center backdrop-blur-xl">
          <p className="text-sm text-slate-300">
            No se pudieron cargar los proyectos.
          </p>
          <Button
            className="mt-3 min-h-[44px]"
            variant="flat"
            onPress={() => void projectsQuery.refetch()}
          >
            Reintentar
          </Button>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/15 p-8 text-center">
          <FolderSearch aria-hidden="true" className="size-8 text-slate-500" />
          <p className="text-sm text-slate-300">
            {activeFilters > 0 || q
              ? "Ningún proyecto coincide con la búsqueda o los filtros."
              : "No hay proyectos en este evento."}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const row = registrationById.get(project.id);

            return (
              <li key={project.id} className="flex">
                <AcademicProjectCard
                  code={project.projectCode}
                  course={project.academicCourse ?? row?.academicCourse}
                  href={paths.app.teachingProject.getHref(project.id)}
                  name={project.name}
                  state={project.state}
                  studentsLabel={
                    row ? describeStudents(row.students) : undefined
                  }
                  tutors={row?.tutors}
                />
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center pt-1">
          <Pagination
            showControls
            page={page}
            size="lg"
            total={totalPages}
            onChange={setPage}
          />
        </div>
      )}

      <Drawer
        backdrop="blur"
        isOpen={sheetOpen}
        placement="bottom"
        onOpenChange={setSheetOpen}
      >
        <DrawerContent className="rounded-t-3xl border-t border-white/10 bg-[#0e101a]">
          {(onClose) => (
            <>
              <DrawerHeader className="flex items-center justify-between gap-3">
                <span className="text-xl font-bold">Filtrar</span>
                {activeFilters > 0 && (
                  <Button
                    className="min-h-[44px] me-8"
                    size="sm"
                    variant="light"
                    onPress={() => changeFilters({})}
                  >
                    Limpiar
                  </Button>
                )}
              </DrawerHeader>
              <DrawerBody>
                <ProjectFilters
                  courses={courses}
                  layout="stacked"
                  values={filters}
                  onChange={changeFilters}
                />
              </DrawerBody>
              <DrawerFooter>
                <Button
                  className="min-h-[48px] w-full font-semibold"
                  color="primary"
                  isLoading={projectsQuery.isFetching}
                  onPress={onClose}
                >
                  {`Ver ${total} ${total === 1 ? "proyecto" : "proyectos"}`}
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};
