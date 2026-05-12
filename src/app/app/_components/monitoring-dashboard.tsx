'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BarChart3,
  ChevronDown,
  Circle,
  FileCheck,
  Folder,
  Search,
  ShieldCheck,
  Award,
  Trophy,
  Users,
} from 'lucide-react';

import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectItem } from '@/components/ui/select/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { StatusBadge } from '@/components/ui/status-badge/status-badge';
import { useUser } from '@/lib/auth';
import { getProjectEvaluationStats, type ProjectEvaluationStats } from '@/features/evaluations/api/get-project-evaluation-stats';
import { useEvents } from '@/features/events/api/get-events';
import { useCoursesDropdown } from '@/features/courses/api/get-courses-dropdown';
import {
  ProjectJuror,
  ProjectWithJurors,
  useProjectsWithJurors,
} from '@/features/projects/api/get-projects-with-jurors';
import { useCriterions } from '@/features/criterions/api/get-criterions';
import { useQueries } from '@tanstack/react-query';
import '@/features/landing/index.css';

type MonitoringTab = 'statistics' | 'projects' | 'ranking';
type ProjectFilterState = ProjectWithJurors['state'] | 'ALL';

const projectStateOptions: Array<{
  key: ProjectFilterState;
  label: string;
  tone: string;
}> = [
  { key: 'ALL', label: 'Todos', tone: 'border-default-300 text-default-600' },
  { key: 'UNDER_REVIEW', label: 'En revisión', tone: 'border-amber-400/50 text-amber-600' },
  { key: 'REQUEST_CHANGES', label: 'Cambios', tone: 'border-sky-400/50 text-sky-600' },
  { key: 'APPROVED', label: 'Aprobados', tone: 'border-emerald-400/50 text-emerald-600' },
  { key: 'REJECTED', label: 'Rechazados', tone: 'border-rose-400/50 text-rose-600' },
];

const stateLabels: Record<ProjectWithJurors['state'], string> = {
  UNDER_REVIEW: 'En revisión',
  REQUEST_CHANGES: 'Cambios requeridos',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
};

const stateColors: Record<ProjectWithJurors['state'], string> = {
  UNDER_REVIEW: 'bg-amber-500',
  REQUEST_CHANGES: 'bg-sky-500',
  APPROVED: 'bg-emerald-500',
  REJECTED: 'bg-rose-500',
};

const formatDate = (value?: string) => {
  if (!value) return '—';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

const parsePage = (value: string | null) => {
  const parsed = Number(value ?? '1');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const parseOptionalId = (value: string | null) => {
  if (!value) return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const isProjectState = (value: string | null): value is ProjectWithJurors['state'] =>
  value === 'UNDER_REVIEW' ||
  value === 'REQUEST_CHANGES' ||
  value === 'APPROVED' ||
  value === 'REJECTED';

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: typeof ShieldCheck;
  iconClassName: string;
}) => (
  <Card className="glass-card shadow-sm">
    <CardHeader className="pb-2 md:pb-3">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-xs font-medium text-default-500 md:text-sm">
            {title}
          </p>
          <h3 className="text-xl font-bold md:text-2xl">{value}</h3>
        </div>
        <Icon className={`h-6 w-6 flex-shrink-0 md:h-8 md:w-8 ${iconClassName}`} />
      </div>
    </CardHeader>
    <CardBody className="pt-0">
      <p className="text-xs text-default-400">{description}</p>
    </CardBody>
  </Card>
);

const CircleBullet = () => (
  <Circle className="mt-1.5 h-2.5 w-2.5 fill-primary text-primary" />
);

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const getJurorKey = (juror: ProjectJuror) => {
  if (juror.id !== undefined && juror.id !== null) {
    return `id:${juror.id}`;
  }

  if (juror.email?.trim()) {
    return `email:${juror.email.trim().toLowerCase()}`;
  }

  return `name:${juror.firstName ?? ''}:${juror.lastName ?? ''}`;
};

const getUniqueJurors = (jurors: ProjectJuror[] = []) => {
  const seen = new Set<string>();

  return jurors.filter((juror) => {
    const key = getJurorKey(juror);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

type JurorEvaluationState = ProjectJuror & {
  evaluated: boolean;
};

type ProjectEvaluationProgress = {
  evaluated: number;
  total: number;
  jurors: JurorEvaluationState[];
};

type ProjectEvaluationSummary = ProjectEvaluationStats | undefined;

type CategoryEvaluationStats = {
  courseId: number;
  label: string;
  totalProjects: number;
  evaluatedProjects: number;
  pendingProjects: number;
};

const getCourseLabel = (course: { id: number; code: string; description?: string }, fallbackId: number) => {
  if (course.code?.trim()) {
    return course.code.trim();
  }

  if (course.description?.trim()) {
    return course.description.trim();
  }

  return `Categoría ${fallbackId}`;
};

const buildCategoryEvaluationStats = (
  projects: ProjectWithJurors[],
  courses: { id: number; code: string; description?: string }[],
  statsByProjectId: Map<string, ProjectEvaluationStats | undefined>,
) => {
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const statsMap = new Map<number, CategoryEvaluationStats>();

  projects.forEach((project) => {
    const courseId = project.courseId;
    const course = courseMap.get(courseId);
    const current = statsMap.get(courseId) ?? {
      courseId,
      label: course ? getCourseLabel(course, courseId) : `Categoría ${courseId}`,
      totalProjects: 0,
      evaluatedProjects: 0,
      pendingProjects: 0,
    };

    const projectStats = statsByProjectId.get(String(project.id));
    const hasEvaluations = (projectStats?.evaluationCount ?? 0) > 0 || project.evaluated;

    current.totalProjects += 1;
    if (hasEvaluations) {
      current.evaluatedProjects += 1;
    } else {
      current.pendingProjects += 1;
    }

    statsMap.set(courseId, current);
  });

  return Array.from(statsMap.values()).sort((left, right) => right.totalProjects - left.totalProjects);
};

export const MonitoringDashboard = () => {
  const user = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: eventsData, isLoading: isEventsLoading } = useEvents({ page: 1 });
  const [projectSearch, setProjectSearch] = useState('');

  const events = eventsData?.data ?? [];
  const selectedEventIdFromUrl = Number(searchParams?.get('event'));
  const selectedEvent =
    events.find((event) => event.id === selectedEventIdFromUrl) ?? events[0];
  const selectedEventId = selectedEvent?.id;

  const viewParam = searchParams?.get('view');
  const activeTab = (viewParam === 'projects' ? 'projects' : viewParam === 'ranking' ? 'ranking' : 'statistics') as MonitoringTab;
  const currentPage = parsePage(searchParams?.get('page'));
  const stateParam = searchParams?.get('state');
  const selectedCourseId = parseOptionalId(searchParams?.get('courseId'));
  const selectedState: ProjectFilterState = isProjectState(stateParam)
    ? stateParam
    : 'ALL';

  useEffect(() => {
    if (!events.length) {
      return;
    }

    const isValidSelection =
      Number.isFinite(selectedEventIdFromUrl) &&
      events.some((event) => event.id === selectedEventIdFromUrl);

    if (isValidSelection) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams?.toString() ?? '');
    nextParams.set('event', String(events[0].id));
    nextParams.set('page', '1');
    router.replace(`?${nextParams.toString()}`, { scroll: false });
  }, [events, router, searchParams, selectedEventIdFromUrl]);

  const updateParams = (
    changes: Record<string, string | number | null | undefined>,
    { resetPage = false }: { resetPage?: boolean } = {},
  ) => {
    const nextParams = new URLSearchParams(searchParams?.toString() ?? '');

    if (resetPage) {
      nextParams.set('page', '1');
    }

    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        nextParams.delete(key);
        return;
      }

      nextParams.set(key, String(value));
    });

    router.replace(`?${nextParams.toString()}`, { scroll: false });
  };

  const projectQueryEnabled = Boolean(selectedEventId);
  const coursesDropdownQuery = useCoursesDropdown({
    eventId: selectedEventId,
    queryConfig: { enabled: projectQueryEnabled },
  });
  const criterionsQuery = useCriterions({
    eventId: selectedEventId,
    queryConfig: { enabled: projectQueryEnabled && activeTab === 'statistics' },
  });
  const allProjectsQuery = useProjectsWithJurors({
    currentPage: 1,
    itemsPerPage: 10000,
    eventId: selectedEventId,
    queryConfig: { enabled: projectQueryEnabled },
  });
  const visibleProjectsQuery = useProjectsWithJurors({
    currentPage,
    itemsPerPage: 10,
    eventId: selectedEventId,
    courseId: selectedCourseId,
    state: selectedState === 'ALL' ? undefined : selectedState,
    q: projectSearch.trim() || undefined,
    queryConfig: { enabled: projectQueryEnabled && activeTab === 'projects' },
  });
  const visibleProjects = visibleProjectsQuery.data?.data ?? [];
  const allProjects = allProjectsQuery.data?.data ?? [];
  const hasSearchTerm = projectSearch.trim().length > 0;
  const projectListingSource = hasSearchTerm ? allProjects : visibleProjects;
  const filteredProjects = useMemo(() => {
    const term = normalizeText(projectSearch);

    if (!term) {
      return projectListingSource;
    }

    return projectListingSource.filter((project) => {
      const pendingLabels = (project.pendingParticipants ?? [])
        .map((participant) => `${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim())
        .filter((label) => label.length > 0);

      const participantLabels = pendingLabels.length > 0
        ? pendingLabels.join(' ')
        : (project.participants ?? [])
            .map((participant) => {
              const fullName = `${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim();

              if (fullName) {
                return fullName;
              }

              if (participant.studentCode) {
                return `Código ${participant.studentCode}`;
              }

              return 'Participante';
            })
            .join(' ');

      const jurorLabels = (project.jurors ?? [])
        .map((juror) => `${juror.firstName} ${juror.lastName} ${juror.email}`)
        .join(' ');

      return normalizeText(
        [project.name, project.projectCode ?? '', project.eventNumber ?? '', participantLabels, jurorLabels].join(' '),
      ).includes(term);
    });
  }, [projectSearch, projectListingSource]);

  const pagedProjects = useMemo(() => {
    if (!hasSearchTerm) {
      return filteredProjects;
    }

    const pageSize = 10;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProjects.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredProjects, hasSearchTerm]);

  const totalProjectPages = hasSearchTerm
    ? Math.max(1, Math.ceil(filteredProjects.length / 10))
    : visibleProjectsQuery.data?.meta.totalPages ?? 1;

  // Queries para obtener stats de los proyectos en la página actual
  const projectEvaluationsQueries = useQueries({
    queries: pagedProjects.map((project) => ({
      queryKey: ['project-evaluation-stats', project.id],
      queryFn: () => getProjectEvaluationStats(String(project.id)),
      enabled: projectQueryEnabled && activeTab === 'projects' && Boolean(project.id),
    })),
  });

  // Queries para obtener stats de TODOS los proyectos (para estadísticas globales)
  const allProjectEvaluationStatsQueries = useQueries({
    queries: (allProjects ?? []).map((project) => ({
      queryKey: ['project-evaluation-stats-all', project.id],
      queryFn: () => getProjectEvaluationStats(String(project.id)),
      enabled: projectQueryEnabled && (activeTab === 'statistics' || activeTab === 'ranking') && Boolean(project.id),
    })),
  });

  const allProjectStatsById = useMemo(() => {
    return new Map<string, ProjectEvaluationStats | undefined>(
      allProjects.map((project, index) => [
        String(project.id),
        allProjectEvaluationStatsQueries[index]?.data?.data,
      ]),
    );
  }, [allProjectEvaluationStatsQueries, allProjects]);

  const statisticsProjects = useMemo(
    () => (selectedCourseId ? allProjects.filter((project) => project.courseId === selectedCourseId) : allProjects),
    [allProjects, selectedCourseId],
  );

  const projectTotals = useMemo(
    () => {
      const uniqueJurorKeys = new Set<string>();

      statisticsProjects.forEach((project) => {
        getUniqueJurors(project.jurors ?? []).forEach((juror) => {
          uniqueJurorKeys.add(getJurorKey(juror));
        });
      });

      return {
        total: statisticsProjects.length,
        underReview: statisticsProjects.filter((project) => project.state === 'UNDER_REVIEW').length,
        requestChanges: statisticsProjects.filter((project) => project.state === 'REQUEST_CHANGES').length,
        approved: statisticsProjects.filter((project) => project.state === 'APPROVED').length,
        rejected: statisticsProjects.filter((project) => project.state === 'REJECTED').length,
        uniqueJurorsCount: uniqueJurorKeys.size,
        jurorAssignments: statisticsProjects.reduce(
          (sum, project) => sum + getUniqueJurors(project.jurors ?? []).length,
          0,
        ),
      };
    },
    [statisticsProjects],
  );

  const categoryEvaluationStats = useMemo(() => {
    return buildCategoryEvaluationStats(
      statisticsProjects,
      coursesDropdownQuery.data?.data ?? [],
      allProjectStatsById,
    );
  }, [allProjectStatsById, coursesDropdownQuery.data?.data, statisticsProjects]);

  // Calcular métricas de evaluación
  const evaluationMetrics = useMemo(() => {
    if (activeTab !== 'statistics') {
      return {
        totalEvaluationsSent: 0,
        completionPercentage: 0,
        averageGrade: 0,
        projectsWithEvaluations: 0,
      };
    }

    const allStats = statisticsProjects
      .map((project) => allProjectStatsById.get(String(project.id)))
      .filter((data): data is NonNullable<ProjectEvaluationSummary> => data !== undefined);

    const totalEvaluations = allStats.reduce((sum, stats) => sum + (stats?.evaluationCount ?? 0), 0);
    const totalJurorAssignments = projectTotals.jurorAssignments;
    const completionPercentage = totalJurorAssignments > 0 ? Math.round((totalEvaluations / totalJurorAssignments) * 100) : 0;
    const averageGrade = allStats.length > 0
      ? allStats.reduce((sum, stats) => sum + (stats?.averageGrade ?? 0), 0) / allStats.filter((s) => (s?.averageGrade ?? 0) > 0).length
      : 0;
    const projectsWithEvaluations = allStats.filter((stats) => (stats?.evaluationCount ?? 0) > 0).length;

    return {
      totalEvaluationsSent: totalEvaluations,
      completionPercentage,
      averageGrade: averageGrade > 0 ? parseFloat(averageGrade.toFixed(2)) : 0,
      projectsWithEvaluations,
    };
  }, [activeTab, allProjectStatsById, projectTotals.jurorAssignments, statisticsProjects]);

  const projectStateSeries = [
    { key: 'UNDER_REVIEW' as const, label: stateLabels.UNDER_REVIEW, count: projectTotals.underReview, color: stateColors.UNDER_REVIEW },
    { key: 'REQUEST_CHANGES' as const, label: stateLabels.REQUEST_CHANGES, count: projectTotals.requestChanges, color: stateColors.REQUEST_CHANGES },
    { key: 'APPROVED' as const, label: stateLabels.APPROVED, count: projectTotals.approved, color: stateColors.APPROVED },
    { key: 'REJECTED' as const, label: stateLabels.REJECTED, count: projectTotals.rejected, color: stateColors.REJECTED },
  ];

  const maxStateCount = Math.max(...projectStateSeries.map((item) => item.count), 1);

  const projectEvaluationProgress = useMemo(() => {
    const progressByProjectId = new Map<string, ProjectEvaluationProgress>();

    pagedProjects.forEach((project, index) => {
      const stats = projectEvaluationsQueries[index]?.data?.data;
      const evaluatedJurorIds = new Set(
        (stats?.evaluatorIds ?? []).map((jurorId) => String(jurorId)),
      );

      const jurors = getUniqueJurors(project.jurors ?? []).map((juror) => ({
        ...juror,
        evaluated: evaluatedJurorIds.has(String(juror.id)),
      }));

      progressByProjectId.set(String(project.id), {
        evaluated: stats?.evaluationCount ?? jurors.filter((juror) => juror.evaluated).length,
        total: jurors.length,
        jurors,
      });
    });

    return progressByProjectId;
  }, [pagedProjects, projectEvaluationsQueries]);

  const isProjectEvaluationsLoading =
    projectQueryEnabled &&
    activeTab === 'projects' &&
    ((hasSearchTerm ? allProjectsQuery.isLoading : visibleProjectsQuery.isLoading) ||
      projectEvaluationsQueries.some((query) => query.isLoading));

  const selectedEventOpenLabel = selectedEvent?.evaluationsOpened
    ? 'Evaluaciones abiertas'
    : 'Evaluaciones cerradas';
  const selectedEventLabel = selectedEvent
    ? `${formatDate(selectedEvent.startDate)} - ${formatDate(selectedEvent.endDate)}`
    : 'Sin evento seleccionado';

  const handleEventChange = (value: string) => {
    setProjectSearch('');
    updateParams({ event: value, courseId: null }, { resetPage: true });
  };

  const handleTabChange = (tab: MonitoringTab) => {
    updateParams({ view: tab }, { resetPage: false });
  };

  const handleStateChange = (state: ProjectFilterState) => {
    updateParams({ state: state === 'ALL' ? null : state }, { resetPage: true });
  };

  const handleCourseChange = (keys: Set<string>) => {
    const selected = Array.from(keys)[0];
    updateParams({ courseId: selected ? Number(selected) : null }, { resetPage: true });
  };

  const handlePageChange = (page: number) => {
    updateParams({ page }, { resetPage: false });
  };

  const handleProjectSearchChange = (value: string) => {
    setProjectSearch(value);

    if (currentPage !== 1) {
      updateParams({ page: 1 }, { resetPage: false });
    }
  };

  const getEvaluationProgress = (project: ProjectWithJurors) => {
    return projectEvaluationProgress.get(String(project.id)) ?? {
      evaluated: 0,
      total: getUniqueJurors(project.jurors ?? []).length,
      jurors: getUniqueJurors(project.jurors ?? []).map((juror) => ({
        ...juror,
        evaluated: false,
      })),
    };
  };

  type SortOrder = 'asc' | 'desc';
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const sortedProjects = useMemo(() => {
    const sorted = [...pagedProjects].sort((a, b) => {
      const progressA = projectEvaluationProgress.get(String(a.id)) ?? getEvaluationProgress(a);
      const progressB = projectEvaluationProgress.get(String(b.id)) ?? getEvaluationProgress(b);
      const ratioA = progressA.total > 0 ? progressA.evaluated / progressA.total : 0;
      const ratioB = progressB.total > 0 ? progressB.evaluated / progressB.total : 0;

      return sortOrder === 'desc' ? ratioB - ratioA : ratioA - ratioB;
    });
    return sorted;
  }, [getEvaluationProgress, pagedProjects, projectEvaluationProgress, sortOrder]);

  const statsCards = [
    {
      title: 'Estado de evaluación',
      value: selectedEventOpenLabel,
      description: 'Si el evento acepta nuevas calificaciones',
      icon: ShieldCheck,
      iconClassName: 'text-emerald-500',
    },
    {
      title: 'Evaluaciones enviadas',
      value: evaluationMetrics.totalEvaluationsSent,
      description: 'Calificaciones completadas por jurados',
      icon: FileCheck,
      iconClassName: 'text-amber-500',
    },
    {
      title: 'Tasa de completitud',
      value: `${evaluationMetrics.completionPercentage}%`,
      description: 'Porcentaje de evaluaciones completadas',
      icon: BarChart3,
      iconClassName: 'text-sky-500',
    },
    {
      title: 'Promedio de calificación',
      value: evaluationMetrics.averageGrade > 0 ? evaluationMetrics.averageGrade.toFixed(2) : '—',
      description: 'Calificación promedio de todos los proyectos',
      icon: Users,
      iconClassName: 'text-violet-500',
    },
  ];

  return (
    <div className="dashboard-page space-y-6 pb-8">
      <div className="space-y-1 md:space-y-2">
        <h1 className="text-3xl font-bold md:text-4xl">
          Monitoreo, {`${user.data?.firstName ?? ''} ${user.data?.lastName ?? ''}`.trim()}
        </h1>
        <p className="max-w-3xl text-sm text-default-500 md:text-base">
          Monitorea el progreso de las evaluaciones, analiza métricas de desempeño y visualiza el estado general de los proyectos y jurados en tiempo real.
        </p>
      </div>

      

      <Card className="glass-card border border-default-200/70 shadow-sm">
        <CardBody className="space-y-5 p-5 md:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:gap-4">
              <div className="flex w-full flex-col gap-3 lg:max-w-[420px]">
                <Select
                  label="Evento"
                  placeholder="Selecciona un evento"
                  selectedKeys={selectedEventId ? [String(selectedEventId)] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0];
                    if (selected !== undefined) {
                      handleEventChange(String(selected));
                    }
                  }}
                  isLoading={isEventsLoading}
                >
                  {events.map((event) => (
                    <SelectItem key={String(event.id)}>
                      {event.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="flex w-full flex-col gap-3 lg:max-w-[420px]">
                <Select
                  label="Categoría"
                  placeholder={
                    selectedEventId
                      ? 'Todas las categorías'
                      : 'Selecciona un evento primero'
                  }
                  selectedKeys={selectedCourseId ? [String(selectedCourseId)] : []}
                  onSelectionChange={(keys) => handleCourseChange(keys as Set<string>)}
                  isDisabled={!selectedEventId}
                  isLoading={coursesDropdownQuery.isLoading}
                >
                  {coursesDropdownQuery.data?.data?.length ? (
                    coursesDropdownQuery.data.data.map((course) => (
                      <SelectItem key={String(course.id)}>
                        {course.code}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem key="no-categories" isDisabled>
                      {selectedEventId
                        ? 'No hay categorías'
                        : 'Selecciona un evento primero'}
                    </SelectItem>
                  )}
                </Select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              className={activeTab === 'statistics' ? 'border-2 border-foreground bg-foreground text-background' : ''}
              variant={activeTab === 'statistics' ? 'flat' : 'bordered'}
              onPress={() => handleTabChange('statistics')}
            >
              <BarChart3 className="mr-2 h-4 w-4 text-sky-500" />
              Estadísticas
            </Button>
            <Button
              className={activeTab === 'projects' ? 'border-2 border-foreground bg-foreground text-background' : ''}
              variant={activeTab === 'projects' ? 'flat' : 'bordered'}
              onPress={() => handleTabChange('projects')}
            >
              <Folder className="mr-2 h-4 w-4 text-violet-500" />
              Evaluación de proyectos
            </Button>
            <Button
              className={activeTab === 'ranking' ? 'border-2 border-foreground bg-foreground text-background' : ''}
              variant={activeTab === 'ranking' ? 'flat' : 'bordered'}
              onPress={() => handleTabChange('ranking')}
            >
              <Award className="mr-2 h-4 w-4 text-amber-500" />
              Ranking
            </Button>
          </div>

          {/* selectedEvent info moved next to the select */}
        </CardBody>
      </Card>

      {activeTab === 'statistics' ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-1">
            <Card className="glass-card border border-default-200/70 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold">Desempeño por criterios</h3>
                    <p className="text-sm text-default-400">
                      Cómo han calificado los jurados cada criterio del proyecto.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-3 pt-0">
                {(() => {
                  const criterionNameByCategory = new Map(
                    (criterionsQuery.data?.criterions ?? []).map((criterion) => [criterion.category, criterion.name]),
                  );
                  const categoryStatsMap = new Map<string, { scores: number[]; weights: number[] }>();

                  statisticsProjects.forEach((project) => {
                    const stats = allProjectStatsById.get(String(project.id)) as ProjectEvaluationStats | undefined;

                    stats?.categoryStats?.forEach((categoryStat) => {
                      const existing = categoryStatsMap.get(categoryStat.category) ?? { scores: [], weights: [] };
                      existing.scores.push(categoryStat.averageScore);
                      existing.weights.push(categoryStat.weight);
                      categoryStatsMap.set(categoryStat.category, existing);
                    });
                  });

                  const criterionStats = Array.from(categoryStatsMap.entries())
                    .map(([category, data]) => ({
                      category,
                      criterionName: criterionNameByCategory.get(category) ?? category,
                      averageScore: data.scores.length > 0
                        ? data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length
                        : 0,
                      averageWeight: data.weights.length > 0
                        ? data.weights.reduce((sum, weight) => sum + weight, 0) / data.weights.length
                        : 0,
                    }))
                    .sort((left, right) => right.averageScore - left.averageScore);

                  return criterionStats.length > 0 ? (
                    <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1 md:max-h-[500px]">
                      {criterionStats.map((criterion) => {
                        const progress = Math.min(Math.max(criterion.averageScore, 0), 100);
                        const tone = progress >= 80
                          ? 'bg-emerald-500'
                          : progress >= 70
                            ? 'bg-sky-500'
                            : progress >= 60
                              ? 'bg-amber-500'
                              : 'bg-rose-500';

                        return (
                          <div key={criterion.category} className="space-y-2 rounded-2xl border border-default-200/70 bg-background/80 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground md:text-base">
                                  {criterion.criterionName}
                                </p>
                                <p className="text-[11px] text-default-400 md:text-xs">Categoría: {criterion.category}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-base font-bold text-primary md:text-lg">
                                  {criterion.averageScore.toFixed(2)}
                                </p>
                                <p className="text-[11px] text-default-400 md:text-xs">de 100</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-default-100 md:h-3">
                                <div
                                  className={`h-full rounded-full transition-all ${tone}`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="min-w-[40px] text-right text-[11px] font-semibold text-default-600 md:text-xs">
                                {Math.round(progress)}%
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-3 text-[11px] text-default-400 md:text-xs">
                              <span>Peso promedio: {criterion.averageWeight.toFixed(2)}</span>
                              <span>Promedio calculado</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-500">
                      Todavía no hay criterios con evaluaciones para mostrar.
                    </div>
                  );
                })()}
              </CardBody>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-default-200/70 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-default-400">Total de jurados</p>
              <p className="mt-2 text-2xl font-bold text-primary">{projectTotals.uniqueJurorsCount}</p>
            </div>
            <div className="rounded-2xl border border-default-200/70 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-default-400">Total de proyectos</p>
              <p className="mt-2 text-2xl font-bold text-primary">{projectTotals.total}</p>
            </div>
            <div className="rounded-2xl border border-default-200/70 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-default-400">Evaluaciones completadas</p>
              <p className="mt-2 text-2xl font-bold text-primary">{evaluationMetrics.totalEvaluationsSent}</p>
            </div>
            <div className="rounded-2xl border border-default-200/70 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-default-400">Tasa de completitud</p>
              <p className="mt-2 text-2xl font-bold text-primary">{evaluationMetrics.completionPercentage}%</p>
            </div>
          </div>

          <Card className="glass-card border border-default-200/70 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">Evaluación por categoría</h3>
                  <p className="text-sm text-default-400">
                    Proyectos evaluados y pendientes por categoría del evento.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-4 pt-0">
              {categoryEvaluationStats.length > 0 ? (
                <>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-default-500">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      Evaluados
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      Pendientes
                    </span>
                  </div>

                  <div className="space-y-3">
                    {categoryEvaluationStats.map((category) => {
                      const evaluatedWidth = category.totalProjects > 0
                        ? (category.evaluatedProjects / category.totalProjects) * 100
                        : 0;
                      const pendingWidth = category.totalProjects > 0
                        ? (category.pendingProjects / category.totalProjects) * 100
                        : 0;

                      return (
                        <div
                          key={category.courseId}
                          className="space-y-2 rounded-2xl border border-default-200/70 bg-background/80 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-foreground">{category.label}</p>
                              <p className="text-xs text-default-400">{category.totalProjects} proyectos en total</p>
                            </div>
                            <div className="text-right text-xs">
                              <p className="font-semibold text-emerald-600">{category.evaluatedProjects} evaluados</p>
                              <p className="text-default-400">{category.pendingProjects} pendientes</p>
                            </div>
                          </div>

                          <div className="h-3 overflow-hidden rounded-full bg-default-100">
                            <div className="flex h-full w-full">
                              <div
                                className="h-full bg-emerald-500 transition-all"
                                style={{ width: `${evaluatedWidth}%` }}
                              />
                              <div
                                className="h-full bg-amber-400/80 transition-all"
                                style={{ width: `${pendingWidth}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-500">
                  Todavía no hay categorías con proyectos para mostrar.
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      ) : activeTab === 'ranking' ? (
        <div className="space-y-4">
          <Card className="glass-card border border-default-200/70 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <Trophy className="h-8 w-8 text-amber-500 mr-2" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">RANKING TOP 5</h3>
                  <p className="text-sm text-default-400">{selectedEvent?.name ?? '—'}</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-4 p-5 md:p-6">
              {(projectQueryEnabled && allProjectEvaluationStatsQueries.some((q) => q.isLoading)) ? (
                <div className="flex min-h-[180px] items-center justify-center">
                  <Spinner size="lg" />
                </div>
              ) : (
                (() => {
                  const topProjects = (allProjects ?? [])
                    .map((project) => ({ project, stats: allProjectStatsById.get(String(project.id)) }))
                    .filter((entry) => entry.stats && (entry.stats.evaluationCount ?? 0) > 0)
                    .sort((a, b) => {
                      const gradeA = a.stats?.averageGrade ?? 0;
                      const gradeB = b.stats?.averageGrade ?? 0;

                      if (gradeB !== gradeA) return gradeB - gradeA;

                      const countA = a.stats?.evaluationCount ?? 0;
                      const countB = b.stats?.evaluationCount ?? 0;
                      if (countB !== countA) return countB - countA;

                      return (a.project.name ?? '').localeCompare(b.project.name ?? '');
                    })
                    .slice(0, 5)
                    .map((entry, i) => ({ ...entry, position: i + 1 }));

                  return topProjects.length > 0 ? (
                    <div className="overflow-hidden rounded-2xl border border-default-200/80">
                      <Table aria-label="Ranking de proyectos" selectionMode="none">
                        <TableHeader>
                          <TableColumn className="w-20">Posición</TableColumn>
                          <TableColumn className="w-36">Code</TableColumn>
                          <TableColumn>Equipo</TableColumn>
                          <TableColumn>Integrantes</TableColumn>
                          <TableColumn className="w-32 text-center">Puntaje</TableColumn>
                        </TableHeader>
                        <TableBody items={topProjects}>
                          {(entry) => (
                            <TableRow key={entry.project.id}>
                              <TableCell className="w-20">{entry.position}</TableCell>
                              <TableCell className="w-36 whitespace-nowrap">
                                <p className="font-medium text-default-700">{entry.project.projectCode ?? entry.project.eventNumber ?? '—'}</p>
                              </TableCell>
                              <TableCell>
                                <p className="text-lg font-semibold text-foreground">{entry.project.name}</p>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1 text-sm leading-tight">
                                  {(() => {
                                    const pendingLabels = (entry.project.pendingParticipants ?? [])
                                      .map((p) => `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim())
                                      .filter((l) => l.length > 0);

                                    const participantLabels = pendingLabels.length > 0
                                      ? pendingLabels
                                      : (entry.project.participants ?? []).map((p) => {
                                          const fullName = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim();
                                          if (fullName) return fullName;
                                          if (p.studentCode) return `Código ${p.studentCode}`;
                                          return 'Participante';
                                        });

                                    return participantLabels.length > 0 ? (
                                      participantLabels.map((label, i) => <p key={i} className="text-sm text-default-500">{label}</p>)
                                    ) : (
                                      <p className="text-default-400 text-sm">Sin integrantes</p>
                                    );
                                  })()}
                                </div>
                              </TableCell>
                              <TableCell className="w-32">
                                <div className="flex h-full flex-col items-center justify-center">
                                  <p className="text-lg font-semibold">{entry.stats?.averageGrade !== undefined ? entry.stats.averageGrade.toFixed(2) : '—'}</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-500">
                      No hay proyectos con evaluaciones para mostrar el ranking.
                    </div>
                  );
                })()
              )}
            </CardBody>
          </Card>
        </div>
      ) : (
        <Card className="glass-card border border-default-200/70 shadow-sm">
          <CardBody className="space-y-4 p-5 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <Input
                isClearable
                className="w-full lg:max-w-xl h-10"
                placeholder="Buscar por nombre, código de proyecto, participante o jurado…"
                startContent={<Search className="h-4 w-4 text-default-400" />}
                value={projectSearch}
                onClear={() => {
                  setProjectSearch('');

                  if (currentPage !== 1) {
                    updateParams({ page: 1 }, { resetPage: false });
                  }
                }}
                onValueChange={handleProjectSearchChange}
              />

              <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center lg:gap-4">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={sortOrder === 'desc' ? 'flat' : 'bordered'}
                    onPress={() => setSortOrder('desc')}
                    className={`${sortOrder === 'desc' ? 'bg-foreground text-background' : ''} h-9 px-3`}
                  >
                    Mayor → Menor
                  </Button>
                  <Button
                    size="sm"
                    variant={sortOrder === 'asc' ? 'flat' : 'bordered'}
                    onPress={() => setSortOrder('asc')}
                    className={`${sortOrder === 'asc' ? 'bg-foreground text-background' : ''} h-9 px-3`}
                  >
                    Menor → Mayor
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-default-500">
              <span>
                {filteredProjects.length} proyectos visibles
              </span>
              <span>
                Ordenado por evaluación: {sortOrder === 'desc' ? 'Mayor a menor' : 'Menor a mayor'}
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-default-200/80">
              <Table
                aria-label="Evaluación de proyectos"
                classNames={{ wrapper: 'shadow-none rounded-none' }}
                bottomContent={
                  <div className="flex items-center justify-between gap-4 px-2 pt-4">
                    <span className="text-sm text-default-400">
                      Página {currentPage} de {totalProjectPages}
                    </span>
                    <Pagination
                      isCompact
                      color="primary"
                      page={currentPage}
                      showControls
                      total={totalProjectPages}
                      onChange={handlePageChange}
                    />
                  </div>
                }
                bottomContentPlacement="outside"
                selectionMode="none"
              >
                <TableHeader>
                  <TableColumn className="w-28 whitespace-nowrap">Code</TableColumn>
                  <TableColumn>Proyecto</TableColumn>
                  <TableColumn>Integrantes</TableColumn>
                  <TableColumn>Jurados asignados</TableColumn>
                  <TableColumn>Progreso de evaluación</TableColumn>
                </TableHeader>
                <TableBody
                  emptyContent={
                    isProjectEvaluationsLoading
                      ? undefined
                      : 'No hay proyectos que coincidan con el filtro.'
                  }
                  items={isProjectEvaluationsLoading ? [] : sortedProjects}
                >
                  {isProjectEvaluationsLoading ? (
                    <TableRow key="loading">
                      <TableCell colSpan={5}>
                        <div className="flex min-h-[240px] items-center justify-center">
                          <Spinner size="lg" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (project: ProjectWithJurors) => (
                      <TableRow key={project.id}>
                        <TableCell className="w-28 whitespace-nowrap">
                          <p className="font-semibold text-foreground">
                            {project.projectCode ?? project.eventNumber ?? '—'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-foreground">
                            {project.name}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs leading-tight">
                            {(() => {
                              const pendingLabels = (project.pendingParticipants ?? [])
                                .map((participant) => `${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim())
                                .filter((label) => label.length > 0);

                              const participantLabels = pendingLabels.length > 0
                                ? pendingLabels
                                : (project.participants ?? []).map((participant) => {
                                    const fullName = `${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim();

                                    if (fullName) {
                                      return fullName;
                                    }

                                    if (participant.studentCode) {
                                      return `Código ${participant.studentCode}`;
                                    }

                                    return 'Participante';
                                  });

                              return participantLabels.length > 0 ? (
                                participantLabels.map((participantLabel, idx) => (
                                  <p key={idx} className="text-default-500">
                                    {participantLabel}
                                  </p>
                                ))
                              ) : (
                                <p className="text-default-400 text-xs">Sin integrantes</p>
                              );
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5 text-xs">
                            {getEvaluationProgress(project).jurors.length > 0 ? (
                              getEvaluationProgress(project).jurors.map((juror, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 rounded-md border border-default-200/70 px-2 py-1 text-default-600"
                                >
                                  <span className="font-medium text-default-700 whitespace-nowrap">
                                    {juror.firstName} {juror.lastName}
                                  </span>
                                  <span className="text-default-300">•</span>
                                  <span className="truncate text-default-500">{juror.email}</span>
                                  <span className="text-default-300">•</span>
                                  <span
                                    className={`whitespace-nowrap italic ${
                                      juror.evaluated ? 'text-emerald-600' : 'text-amber-600'
                                    }`}
                                  >
                                    {juror.evaluated ? 'Evaluado' : 'Pendiente'}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-default-400 italic text-xs">Sin jurados asignados</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const progress = getEvaluationProgress(project);
                            const isComplete = progress.total > 0 && progress.evaluated === progress.total;
                            const percentage = progress.total > 0 ? (progress.evaluated / progress.total) * 100 : 0;

                            return (
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-default-700">
                                      {progress.evaluated}/{progress.total}
                                    </span>
                                    <span
                                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                                        isComplete
                                          ? 'bg-emerald-500/10 text-emerald-600'
                                          : percentage > 0
                                            ? 'bg-amber-500/10 text-amber-600'
                                            : 'bg-default-200/50 text-default-600'
                                      }`}
                                    >
                                      {isComplete ? 'Completo' : `${Math.round(percentage)}%`}
                                    </span>
                                  </div>
                                  <div className="w-full bg-default-100 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all ${
                                        isComplete ? 'bg-emerald-500' : 'bg-amber-500'
                                      }`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};