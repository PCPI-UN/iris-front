'use client';

import { useMemo } from 'react';
import {
  BarChart3,
  FileCheck,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';

import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { useUser } from '@/lib/auth';
import { normalizeCategoryId } from '@/lib/compat/category-legacy';
import { getProjectEvaluationStats, type ProjectEvaluationStats } from '@/features/evaluations/api/get-project-evaluation-stats';
import { useEvents } from '@/features/events/api/get-events';
import { useCategoriesDropdown } from '@/features/courses/api/get-categories-dropdown';
import { ProjectWithJurors, useProjectsWithJurors } from '@/features/projects/api/get-projects-with-jurors';
import { useCriterions } from '@/features/criterions/api/get-criterions';
import { useQueries } from '@tanstack/react-query';
import '@/features/landing/index.css';
import { useEventsDropdown } from '@/features/events/api/get-events-dropdown';

import { MonitoringDashboardProps, ProjectEvaluationProgress, ProjectEvaluationSummary } from '@/features/monitoring/types';
import { stateColors, stateLabels } from '@/features/monitoring/utils/constants';
import { formatDate } from '@/features/monitoring/utils/formatting';
import { buildCategoryEvaluationStats, getJurorKey, getUniqueJurors } from '@/features/monitoring/utils/calculations';
import { normalizeText } from '@/features/monitoring/utils/filters';
import { useMonitoringFilters } from '@/features/monitoring/hooks/use-monitoring-filters';
import { MonitoringDashboardHeader } from '@/features/monitoring/components/monitoring-dashboard-header';
import { MonitoringDashboardFilters } from '@/features/monitoring/components/monitoring-dashboard-filters';
import { MonitoringDashboardTabs } from '@/features/monitoring/components/monitoring-dashboard-tabs';
import { RankingTab } from '@/features/monitoring/components/ranking-tab';
import { StatisticsTab } from '@/features/monitoring/components/statistics-tab';
import { ProjectsTab } from '@/features/monitoring/components/projects-tab';

export const MonitoringDashboard = ({ initialEventId, onBack, eventData }: MonitoringDashboardProps = {}) => {
  const user = useUser();  
  const { data: eventsData, isLoading: isEventsLoading } = useEventsDropdown();
 
  const {
    activeTab,
    currentPage,
    handleCategoryChange,
    handleEventChange,
    handlePageChange,
    handleProjectSearchChange,
    handleTabChange,
    isPastEventMode,
    projectSearch,
    selectedCategoryId,
    selectedEventIdFromUrl,
    selectedState,
    sortOrder,
    setSortOrder,
  } = useMonitoringFilters({ initialEventId });

  const events = eventsData?.data ?? [];
  const selectedEvent =
    events.find((event) => event.id === selectedEventIdFromUrl) ?? events[0];
  const selectedEventId = selectedEvent?.id;

  const projectQueryEnabled = Boolean(selectedEventId);
  const categoriesDropdownQuery = useCategoriesDropdown({
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
    categoryId: selectedCategoryId,
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

  const projectEvaluationsQueries = useQueries({
    queries: pagedProjects.map((project) => ({
      queryKey: ['project-evaluation-stats', project.id],
      queryFn: () => getProjectEvaluationStats(String(project.id)),
      enabled: projectQueryEnabled && activeTab === 'projects' && Boolean(project.id),
    })),
  });

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
    () =>
      (selectedCategoryId
        ? allProjects.filter(
            (project): project is ProjectWithJurors & { categoryId: number } =>
              Number(normalizeCategoryId(project)) === selectedCategoryId,
          )
        : allProjects.filter(
            (project): project is ProjectWithJurors & { categoryId: number } => project.categoryId !== undefined,
          )) as Array<{ id: number; categoryId: number; evaluated?: boolean } & ProjectWithJurors>,
    [allProjects, selectedCategoryId],
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
      categoriesDropdownQuery.data?.data ?? [],
      allProjectStatsById,
    );
  }, [allProjectStatsById, categoriesDropdownQuery.data?.data, statisticsProjects]);

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
      <MonitoringDashboardHeader
        onBack={onBack}
        userName={`${user.data?.firstName ?? ''} ${user.data?.lastName ?? ''}`.trim()}
        eventData={eventData}
      />

      <Card className="glass-card border border-default-200/70 shadow-sm">
        <CardBody className="space-y-5 p-5 md:p-6">
          <MonitoringDashboardFilters
            events={events}
            isEventsLoading={isEventsLoading}
            isPastEventMode={isPastEventMode}
            selectedEventId={selectedEventId}
            selectedEventName={selectedEvent?.name}
            selectedCategoryId={selectedCategoryId}
            categories={categoriesDropdownQuery.data?.data ?? []}
            categoriesLoading={categoriesDropdownQuery.isLoading}
            onEventChange={handleEventChange}
            onCategoryChange={handleCategoryChange}
          />

          <MonitoringDashboardTabs activeTab={activeTab} onTabChange={handleTabChange} />
        </CardBody>
      </Card>

      {activeTab === 'statistics' ? (
        <StatisticsTab
          criterions={(criterionsQuery.data?.criterions ?? []).map((criterion) => ({
            category: criterion.category,
            name: criterion.name,
          }))}
          statisticsProjects={statisticsProjects}
          allProjectStatsById={allProjectStatsById}
          projectTotals={{
            uniqueJurorsCount: projectTotals.uniqueJurorsCount,
            total: projectTotals.total,
          }}
          evaluationMetrics={{
            totalEvaluationsSent: evaluationMetrics.totalEvaluationsSent,
            completionPercentage: evaluationMetrics.completionPercentage,
            averageGrade: evaluationMetrics.averageGrade,
          }}
          categoryEvaluationStats={categoryEvaluationStats}
          
        />
      ) : activeTab === 'ranking' ? (
        <RankingTab
          selectedEventName={selectedEvent?.name}
          isLoading={projectQueryEnabled && allProjectEvaluationStatsQueries.some((q) => q.isLoading)}
          allProjects={allProjects}
          allProjectStatsById={allProjectStatsById}
        />
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
                onClear={() => handleProjectSearchChange('')}
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