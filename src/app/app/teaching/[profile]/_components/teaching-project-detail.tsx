"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, BookOpen } from "lucide-react";

import { useAcademicEvents } from "@/features/academic/api/get-academic-events";
import { useAcademicGrades } from "@/features/academic/api/get-academic-grades";
import { useAcademicProject } from "@/features/academic/api/get-academic-project";
import { useAcademicRegistrations } from "@/features/academic/api/get-academic-registrations";
import {
  AcademicPanel,
  JuryProgress,
  ProjectStateBadge,
  StudentList,
  TutorBlock,
} from "@/features/academic/components";
import { formatCourse } from "@/features/academic/utils/academic-labels";
import {
  TEACHING_PROFILES,
  teachingProfileFromSlug,
} from "@/features/academic/utils/academic-profiles";
import { Spinner } from "@/components/ui/spinner";
import { paths } from "@/config/paths";
import { ApiError } from "@/lib/api-client";

const BackLink = ({
  profileSlug,
  eventId,
}: {
  profileSlug: string;
  eventId?: number;
}) => (
  <Link
    className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
    href={paths.app.teaching.getHref(profileSlug, eventId)}
  >
    <ArrowLeft aria-hidden="true" className="size-4" />
    Proyectos
  </Link>
);

/** Detail of a project of the session's scope: data, students, tutor and evaluation progress */
export const TeachingProjectDetail = ({
  profileSlug,
  projectId,
}: {
  profileSlug: string;
  projectId: number;
}) => {
  // The gate only renders this view for a teaching profile of the session
  const profile = teachingProfileFromSlug(profileSlug) ?? "PROFESSOR";
  const slug = TEACHING_PROFILES[profile].slug;
  const projectQuery = useAcademicProject({ profile, projectId });
  const project = projectQuery.data;
  const eventId = project?.eventId;
  // The students' state comes with the registrations; the evaluation progress with the grades
  const registrationsQuery = useAcademicRegistrations({ profile, eventId });
  const gradesQuery = useAcademicGrades({ profile, eventId });
  const eventsQuery = useAcademicEvents({ profile });

  if (projectQuery.isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!project) {
    const notFound =
      projectQuery.error instanceof ApiError &&
      projectQuery.error.status === 404;

    return (
      <div className="dashboard-page max-w-6xl space-y-6 pb-12">
        <BackLink profileSlug={slug} />
        <div className="rounded-3xl border border-white/10 bg-[#0e101a]/70 p-6 text-center backdrop-blur-xl">
          <p className="text-sm text-slate-300">
            {notFound
              ? `El proyecto no existe o no está entre los ${TEACHING_PROFILES[profile].description.toLowerCase()}.`
              : "No se pudo cargar el proyecto."}
          </p>
        </div>
      </div>
    );
  }

  const registration = registrationsQuery.data?.projects.find(
    (row) => row.projectId === project.id,
  );
  const grade = gradesQuery.data?.projects.find(
    (row) => row.projectId === project.id,
  );
  const event = eventsQuery.data?.find((item) => item.id === project.eventId);
  const course = project.academicCourse ?? registration?.academicCourse;
  const tutors =
    registration?.tutors ??
    (project.tutors ?? []).map((tutor) =>
      [tutor.firstName, tutor.lastName].filter(Boolean).join(" "),
    );
  const reason = project.reason || registration?.reason;
  const showReason =
    Boolean(reason) &&
    (project.state === "REJECTED" || project.state === "REQUEST_CHANGES");
  const resultsPublished =
    gradesQuery.data?.resultsPublished ?? event?.resultsPublished;

  return (
    <div className="dashboard-page max-w-6xl space-y-5 pb-12">
      <BackLink eventId={project.eventId} profileSlug={slug} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-5">
          <header className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs text-slate-400">
                {project.projectCode || "Sin código"}
              </span>
              <ProjectStateBadge state={project.state} />
            </div>
            <h1 className="break-words text-2xl font-bold tracking-tight md:text-3xl">
              {project.name}
            </h1>
            {event && <p className="text-sm text-slate-400">{event.name}</p>}
          </header>

          {showReason && (
            <div className="flex gap-3 rounded-2xl border border-orange-400/30 bg-orange-500/10 p-4">
              <AlertCircle
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-orange-300"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">Motivo</p>
                <p className="break-words text-sm text-slate-300">{reason}</p>
              </div>
            </div>
          )}

          <AcademicPanel title="Curso">
            {course ? (
              <div className="flex items-start gap-2">
                <BookOpen
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-cyan-400"
                />
                <div className="min-w-0 text-sm">
                  <p className="text-slate-200">{formatCourse(course)}</p>
                  <p className="text-xs text-slate-500">
                    {[
                      course.term && `Periodo ${course.term}`,
                      course.departmentName,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Sin curso registrado.</p>
            )}
          </AcademicPanel>

          {project.description && (
            <AcademicPanel title="Descripción">
              <p className="whitespace-pre-line break-words text-sm leading-relaxed text-slate-300">
                {project.description}
              </p>
            </AcademicPanel>
          )}

          {registration ? (
            <StudentList students={registration.students} />
          ) : registrationsQuery.isLoading ? (
            <AcademicPanel title="Estudiantes">
              <Spinner size="sm" />
            </AcademicPanel>
          ) : null}

          <TutorBlock tutors={tutors} />
        </div>

        {/* Desktop: the evaluation stays in view while the left column scrolls */}
        <aside className="lg:sticky lg:top-24">
          <JuryProgress
            assignedJurors={
              grade?.assignedJurors ?? project.assignedJurorCount ?? 0
            }
            completedEvaluations={grade?.completedEvaluations ?? 0}
            emptyMessage={
              project.state === "APPROVED"
                ? "Aún no tiene jurados asignados."
                : "Los jurados se asignan cuando el proyecto queda aprobado."
            }
            note={
              resultsPublished
                ? "Los resultados del evento ya se publicaron."
                : "La nota se muestra cuando se publiquen los resultados del evento."
            }
          />
        </aside>
      </div>
    </div>
  );
};
