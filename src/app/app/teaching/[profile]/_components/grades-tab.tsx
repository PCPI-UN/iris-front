"use client";

import type { GradeRow } from "@/features/academic/types";
import type { TeachingProfile } from "@/features/academic/utils/academic-profiles";

import { useMemo, useState } from "react";
import { BookOpenCheck, Download, Search } from "lucide-react";

import { DepartmentStatsList, NO_DEPARTMENT } from "./department-stats";

import {
  downloadAcademicGrades,
  useAcademicGrades,
} from "@/features/academic/api/get-academic-grades";
import { useAcademicStats } from "@/features/academic/api/get-academic-stats";
import {
  AcademicPanel,
  ComponentBreakdown,
  GradeCard,
  HiddenNotice,
  ScoreDistribution,
} from "@/features/academic/components";
import { breakdownFromStats } from "@/features/academic/utils/academic-grades";
import { TEACHING_PROFILES } from "@/features/academic/utils/academic-profiles";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { paths } from "@/config/paths";

/** Lower case without accents, to search "pena" and find "Peña" */
const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const departmentOf = (row: GradeRow) =>
  row.academicCourse?.departmentName ?? NO_DEPARTMENT;

const ALL_DEPARTMENTS = "all";

const matches = (row: GradeRow, query: string) =>
  [row.projectName, row.projectCode ?? "", ...row.participantNames].some(
    (text) => normalize(text).includes(query),
  );

const ErrorBox = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div className="rounded-3xl border border-white/10 bg-[#0e101a]/70 p-6 text-center backdrop-blur-xl">
    <p className="text-sm text-slate-300">{message}</p>
    <Button className="mt-3 min-h-[44px]" variant="flat" onPress={onRetry}>
      Reintentar
    </Button>
  </div>
);

/** Averages and spread of the grades of the scope, or why they are not shown */
const GradeStats = ({
  eventId,
  profile,
}: {
  eventId: number;
  profile: TeachingProfile;
}) => {
  const { byDepartment } = TEACHING_PROFILES[profile];
  const statsQuery = useAcademicStats({ profile, eventId, byDepartment });
  const stats = statsQuery.data;

  if (statsQuery.isLoading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!stats) {
    return (
      <ErrorBox
        message="No se pudieron cargar los promedios."
        onRetry={() => void statsQuery.refetch()}
      />
    );
  }

  if (stats.statsHidden || !stats.overall) {
    return (
      <HiddenNotice message="Los promedios y la distribución se muestran cuando se publiquen los resultados del evento." />
    );
  }

  const { overall } = stats;

  if (overall.evaluatedCount === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/15 p-4 text-center text-sm text-slate-400">
        Aún no hay proyectos evaluados.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <AcademicPanel
          aside={
            <span className="text-xs text-slate-400">
              {overall.evaluatedCount} de {overall.projectCount}{" "}
              {overall.projectCount === 1
                ? "proyecto evaluado"
                : "proyectos evaluados"}
            </span>
          }
          title="Promedio por componente"
        >
          <ComponentBreakdown
            items={breakdownFromStats(overall.components)}
            label="Promedio por componente"
            maxScore={stats.maxScore}
          />
        </AcademicPanel>
        <AcademicPanel title="Distribución de notas">
          {overall.distribution ? (
            <ScoreDistribution buckets={overall.distribution} />
          ) : (
            <p className="text-sm text-slate-400">
              El evento no tiene escala de calificación.
            </p>
          )}
        </AcademicPanel>
      </div>
      {byDepartment && stats.departments && stats.departments.length > 0 && (
        <DepartmentStatsList
          departments={stats.departments}
          maxScore={stats.maxScore}
        />
      )}
    </div>
  );
};

/** Excel of the grades of the scope, built by the backend */
const DownloadGradesButton = ({
  eventId,
  profile,
}: {
  eventId: number;
  profile: TeachingProfile;
}) => {
  const [downloading, setDownloading] = useState(false);
  const [failed, setFailed] = useState(false);

  const download = async () => {
    setDownloading(true);
    setFailed(false);
    try {
      await downloadAcademicGrades(profile, eventId);
    } catch {
      setFailed(true);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1 md:items-end">
      <Button
        className="min-h-[44px]"
        isLoading={downloading}
        startContent={
          downloading ? undefined : (
            <Download aria-hidden="true" className="size-4" />
          )
        }
        variant="flat"
        onPress={() => void download()}
      >
        Descargar Excel
      </Button>
      {failed && (
        <p className="text-xs text-red-400" role="alert">
          No se pudo descargar el Excel. Intenta de nuevo.
        </p>
      )}
    </div>
  );
};

/** Notas tab: averages and spread of the scope, then each approved project with its grade */
export const GradesTab = ({
  eventId,
  profile,
}: {
  eventId: number;
  profile: TeachingProfile;
}) => {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState(ALL_DEPARTMENTS);
  const { slug, byDepartment } = TEACHING_PROFILES[profile];
  const gradesQuery = useAcademicGrades({ profile, eventId });
  const statsQuery = useAcademicStats({ profile, eventId, byDepartment });
  const rows = useMemo(
    () => gradesQuery.data?.projects ?? [],
    [gradesQuery.data],
  );
  const departments = useMemo(
    () =>
      [...new Set(rows.map(departmentOf))].sort((a, b) =>
        a === NO_DEPARTMENT ? 1 : b === NO_DEPARTMENT ? -1 : a.localeCompare(b),
      ),
    [rows],
  );
  const showDepartments = byDepartment && departments.length > 1;
  const query = normalize(search.trim());
  const visible = useMemo(
    () =>
      rows.filter(
        (row) =>
          (!showDepartments ||
            department === ALL_DEPARTMENTS ||
            departmentOf(row) === department) &&
          (!query || matches(row, query)),
      ),
    [rows, query, department, showDepartments],
  );
  const filtered =
    Boolean(query) || (showDepartments && department !== ALL_DEPARTMENTS);

  return (
    <div className="space-y-5 pt-5">
      <GradeStats eventId={eventId} profile={profile} />

      {gradesQuery.isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : gradesQuery.isError ? (
        <ErrorBox
          message="No se pudieron cargar las notas."
          onRetry={() => void gradesQuery.refetch()}
        />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/15 p-8 text-center">
          <BookOpenCheck aria-hidden="true" className="size-8 text-slate-500" />
          <p className="text-sm text-slate-300">
            No hay proyectos aprobados en este evento.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start">
            <label className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#0e101a]/80 px-3 backdrop-blur-xl focus-within:border-cyan-400/60 md:max-w-md">
              <Search
                aria-hidden="true"
                className="size-4 shrink-0 text-slate-400"
              />
              <span className="sr-only">Buscar nota</span>
              <input
                className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                placeholder="Buscar por proyecto, código o estudiante"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            {showDepartments && (
              <Select
                aria-label="Departamento"
                className="w-full md:w-64"
                label="Departamento"
                selectedKeys={[department]}
                size="sm"
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0];

                  setDepartment(
                    selected === undefined ? ALL_DEPARTMENTS : String(selected),
                  );
                }}
              >
                {[
                  <SelectItem key={ALL_DEPARTMENTS}>Todos</SelectItem>,
                  ...departments.map((name) => (
                    <SelectItem key={name}>{name}</SelectItem>
                  )),
                ]}
              </Select>
            )}
            <div className="md:ml-auto">
              <DownloadGradesButton eventId={eventId} profile={profile} />
            </div>
          </div>
          <p aria-live="polite" className="text-xs text-slate-400">
            {filtered
              ? `${visible.length} de ${rows.length} proyectos`
              : `${rows.length} ${rows.length === 1 ? "proyecto" : "proyectos"}`}
          </p>
          {visible.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-300">
              Ningún proyecto coincide con los filtros.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((row) => (
                <li key={row.projectId} className="flex">
                  <GradeCard
                    href={paths.app.teachingProject.getHref(
                      slug,
                      row.projectId,
                      "grades",
                    )}
                    maxScore={statsQuery.data?.maxScore ?? null}
                    row={row}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
