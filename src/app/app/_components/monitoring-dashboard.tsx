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
  Users,
} from 'lucide-react';

import { Card, CardHeader, CardBody } from '@/components/ui/card';
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
import { StatusBadge } from '@/components/ui/status-badge/status-badge';
import { useUser } from '@/lib/auth';
import { useEvents } from '@/features/events/api/get-events';
import {
  ProjectWithJurors,
  useProjectsWithJurors,
} from '@/features/projects/api/get-projects-with-jurors';
import '@/features/landing/index.css';

type MonitoringTab = 'statistics' | 'projects';
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

  const activeTab: MonitoringTab =
    searchParams?.get('view') === 'projects' ? 'projects' : 'statistics';
  const currentPage = parsePage(searchParams?.get('page'));
  const stateParam = searchParams?.get('state');
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
    state: selectedState === 'ALL' ? undefined : selectedState,
    q: projectSearch.trim() || undefined,
    queryConfig: { enabled: projectQueryEnabled && activeTab === 'projects' },
  });

  const projectTotals = useMemo(
    () => ({
      total: allProjectsQuery.data?.meta.total ?? 0,
      underReview: (allProjectsQuery.data?.data ?? []).filter((project) => project.state === 'UNDER_REVIEW').length,
      requestChanges: (allProjectsQuery.data?.data ?? []).filter((project) => project.state === 'REQUEST_CHANGES').length,
      approved: (allProjectsQuery.data?.data ?? []).filter((project) => project.state === 'APPROVED').length,
      rejected: (allProjectsQuery.data?.data ?? []).filter((project) => project.state === 'REJECTED').length,
      jurorsAssigned: (allProjectsQuery.data?.data ?? []).reduce(
        (sum, project) => sum + (project.jurors?.length ?? 0),
        0,
      ),
    }),
    [allProjectsQuery.data?.data, allProjectsQuery.data?.meta.total],
  );

  const projectStateSeries = [
    { key: 'UNDER_REVIEW' as const, label: stateLabels.UNDER_REVIEW, count: projectTotals.underReview, color: stateColors.UNDER_REVIEW },
    { key: 'REQUEST_CHANGES' as const, label: stateLabels.REQUEST_CHANGES, count: projectTotals.requestChanges, color: stateColors.REQUEST_CHANGES },
    { key: 'APPROVED' as const, label: stateLabels.APPROVED, count: projectTotals.approved, color: stateColors.APPROVED },
    { key: 'REJECTED' as const, label: stateLabels.REJECTED, count: projectTotals.rejected, color: stateColors.REJECTED },
  ];

  const maxStateCount = Math.max(...projectStateSeries.map((item) => item.count), 1);
  const visibleProjects = visibleProjectsQuery.data?.data ?? [];

  const selectedEventOpenLabel = selectedEvent?.evaluationsOpened
    ? 'Evaluaciones abiertas'
    : 'Evaluaciones cerradas';
  const selectedEventLabel = selectedEvent
    ? `${formatDate(selectedEvent.startDate)} - ${formatDate(selectedEvent.endDate)}`
    : 'Sin evento seleccionado';

  const handleEventChange = (value: string) => {
    setProjectSearch('');
    updateParams({ event: value }, { resetPage: true });
  };

  const handleTabChange = (tab: MonitoringTab) => {
    updateParams({ view: tab }, { resetPage: false });
  };

  const handleStateChange = (state: ProjectFilterState) => {
    updateParams({ state: state === 'ALL' ? null : state }, { resetPage: true });
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

  const getParticipantLabels = (project: ProjectWithJurors): string[] => {
    const pendingLabels = (project.pendingParticipants ?? [])
      .map((participant) => `${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim())
      .filter((label) => label.length > 0);

    if (pendingLabels.length > 0) {
      return pendingLabels;
    }

    const participants = (project.participants ?? []) as unknown as Array<{
      userId?: number;
      studentCode?: string;
      firstName?: string;
      lastName?: string;
    }>;

    return participants.map((participant) => {
      const fullName = `${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim();
      if (fullName) {
        return fullName;
      }

      if (participant.studentCode) {
        return `Código ${participant.studentCode}`;
      }

      return `Usuario ${participant.userId}`;
    });
  };

  // Calculate evaluation progress for each project (0/Y for now)
  const getEvaluationProgress = (project: ProjectWithJurors) => {
    const total = project.jurors?.length ?? 0;
    const evaluated = 0; // To be filled when evaluation endpoint is available
    return { evaluated, total };
  };

  type SortOrder = 'asc' | 'desc';
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const sortedProjects = useMemo(() => {
    const sorted = [...visibleProjects].sort((a, b) => {
      const progressA = getEvaluationProgress(a);
      const progressB = getEvaluationProgress(b);
      const ratioA = progressA.total > 0 ? progressA.evaluated / progressA.total : 0;
      const ratioB = progressB.total > 0 ? progressB.evaluated / progressB.total : 0;

      return sortOrder === 'desc' ? ratioB - ratioA : ratioA - ratioB;
    });
    return sorted;
  }, [visibleProjects, sortOrder]);

  const statsCards = [
    {
      title: 'Estado de evaluación',
      value: selectedEventOpenLabel,
      description: 'Si el evento acepta nuevas calificaciones',
      icon: ShieldCheck,
      iconClassName: 'text-emerald-500',
    },
    {
      title: 'Proyectos en evaluación',
      value: projectTotals.underReview + projectTotals.requestChanges,
      description: 'Proyectos todavía abiertos o con ajustes pendientes',
      icon: Folder,
      iconClassName: 'text-emerald-500',
    },
    {
      title: 'Proyectos evaluados',
      value: projectTotals.approved + projectTotals.rejected,
      description: 'Proyectos ya cerrados por evaluación',
      icon: FileCheck,
      iconClassName: 'text-amber-500',
    },
    {
      title: 'Jurados asignados',
      value: projectTotals.jurorsAssigned,
      description: 'Total de jurados asignados en este evento',
      icon: Users,
      iconClassName: 'text-violet-500',
    },
  ];

  return (
    <div className="dashboard-page space-y-6 pb-8">
      <div className="space-y-1 md:space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-default-400">
          Panel del administrador
        </p>
        <h1 className="text-3xl font-bold md:text-4xl">
          Monitoreo, {`${user.data?.firstName ?? ''} ${user.data?.lastName ?? ''}`.trim()}
        </h1>
        <p className="max-w-3xl text-sm text-default-500 md:text-base">
          Sigue el estado de las evaluaciones y revisa rápidamente qué proyectos siguen abiertos, quién los evalúa y qué falta por cerrar.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
        {statsCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <Card className="glass-card border border-default-200/70 shadow-sm">
        <CardBody className="space-y-5 p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-default-400">
                Monitoreo por evento
              </p>
              <h2 className="text-2xl font-bold md:text-3xl">
                Seleccionar evento
              </h2>
              <p className="max-w-2xl text-sm text-default-500">
                Elige un evento para ver una lectura rápida del estado de sus evaluaciones, los jurados asignados y los proyectos pendientes.
              </p>
            </div>

            <div className="relative w-full lg:max-w-[420px]">
              <select
                className="h-12 w-full appearance-none rounded-2xl border border-default-300 bg-background/90 px-4 pr-12 text-sm shadow-sm outline-none transition focus:border-primary"
                value={selectedEventId ? String(selectedEventId) : ''}
                onChange={(event) => handleEventChange(event.target.value)}
              >
                {!events.length && <option value="">Cargando eventos...</option>}
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-default-400" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              className={activeTab === 'statistics' ? 'border-2 border-foreground bg-foreground text-background' : ''}
              variant={activeTab === 'statistics' ? 'flat' : 'bordered'}
              onPress={() => handleTabChange('statistics')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Estadísticas
            </Button>
            <Button
              className={activeTab === 'projects' ? 'border-2 border-foreground bg-foreground text-background' : ''}
              variant={activeTab === 'projects' ? 'flat' : 'bordered'}
              onPress={() => handleTabChange('projects')}
            >
              <Folder className="mr-2 h-4 w-4" />
              Evaluación de proyectos
            </Button>
          </div>

          {selectedEvent ? (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-default-200/80 bg-default-50/40 px-4 py-3 text-sm text-default-600">
              <span className="rounded-full border border-default-200 bg-background px-3 py-1 font-medium text-default-700">
                {selectedEvent.name}
              </span>
              <span>{selectedEventLabel}</span>
              <span
                className={`rounded-full px-3 py-1 font-medium ${
                  selectedEvent.evaluationsOpened
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-default-200/60 text-default-500'
                }`}
              >
                {selectedEventOpenLabel}
              </span>
              <span className="rounded-full border border-default-200 px-3 py-1">
                Código: {selectedEvent.accessCode}
              </span>
            </div>
          ) : isEventsLoading ? (
            <div className="flex min-h-[96px] items-center justify-center rounded-2xl border border-dashed border-default-200">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-default-200 px-4 py-6 text-sm text-default-500">
              No hay eventos disponibles para monitorear.
            </div>
          )}
        </CardBody>
      </Card>

      {activeTab === 'statistics' ? (
        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
          <Card className="glass-card border border-default-200/70 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">Distribución de evaluaciones</h3>
                  <p className="text-sm text-default-400">
                    Estado de evaluación de los proyectos para el evento seleccionado.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-4 pt-0">
              {projectQueryEnabled && allProjectsQuery.isLoading ? (
                <div className="flex min-h-[320px] items-center justify-center">
                  <Spinner size="lg" />
                </div>
              ) : projectTotals.total > 0 ? (
                <div className="space-y-5">
                  {projectStateSeries.map((state) => {
                    const width = `${Math.max((state.count / maxStateCount) * 100, state.count > 0 ? 12 : 0)}%`;

                    return (
                      <div key={state.key} className="space-y-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-default-600">{state.label}</span>
                          <span className="text-default-400">
                            {state.count} proyectos
                          </span>
                        </div>
                        <div className="h-3 rounded-full bg-default-100">
                          <div
                            className={`h-3 rounded-full ${state.color}`}
                            style={{ width }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Card className="border border-default-200/70 bg-background/80 shadow-none">
                      <CardBody className="space-y-1 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-default-400">
                          Pendientes de evaluación
                        </p>
                        <p className="text-2xl font-bold">
                          {projectTotals.underReview + projectTotals.requestChanges}
                        </p>
                        <p className="text-xs text-default-500">
                          Revisión activa y cambios solicitados.
                        </p>
                      </CardBody>
                    </Card>
                    <Card className="border border-default-200/70 bg-background/80 shadow-none">
                      <CardBody className="space-y-1 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-default-400">
                          Cerradas
                        </p>
                        <p className="text-2xl font-bold">
                          {projectTotals.approved + projectTotals.rejected}
                        </p>
                        <p className="text-xs text-default-500">
                          Proyectos ya cerrados por el flujo de evaluación.
                        </p>
                      </CardBody>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-500">
                  Todavía no hay proyectos para este evento.
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="glass-card border border-default-200/70 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">Insights rápidos</h3>
                  <p className="text-sm text-default-400">
                    Señales útiles para decidir dónde intervenir primero.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-4 pt-0">
              <div className="rounded-2xl border border-default-200/70 bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-default-400">
                  Estado del evento
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {selectedEventOpenLabel}
                </p>
                <p className="mt-1 text-sm text-default-500">
                  {selectedEvent?.evaluationsOpened
                    ? 'Los jurados pueden seguir calificando proyectos de este evento.'
                    : 'Las calificaciones están cerradas para este evento.'}
                </p>
              </div>

              <div className="rounded-2xl border border-default-200/70 bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-default-400">
                  Puntos de atención
                </p>
                <ul className="mt-3 space-y-3 text-sm text-default-500">
                  <li className="flex items-start gap-2">
                    <CircleBullet />
                    <span>
                      {projectTotals.underReview > 0
                        ? `${projectTotals.underReview} proyectos siguen en revisión.`
                        : 'No quedan proyectos en revisión.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CircleBullet />
                    <span>
                      {projectTotals.requestChanges > 0
                        ? `${projectTotals.requestChanges} proyectos requieren cambios.`
                        : 'No hay proyectos con cambios solicitados.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CircleBullet />
                    <span>
                      {projectTotals.approved + projectTotals.rejected > 0
                        ? `${projectTotals.approved + projectTotals.rejected} proyectos ya están cerrados.`
                        : 'Todavía no hay proyectos cerrados.'}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-default-200/70 bg-primary/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-default-400">
                  Lectura general
                </p>
                <p className="mt-2 text-sm text-default-600">
                  {projectTotals.total > 0
                    ? `El evento tiene ${projectTotals.total} proyectos registrados, ${projectTotals.jurorsAssigned} jurados asignados y ${projectTotals.approved + projectTotals.rejected} proyectos cerrados.`
                    : 'Selecciona otro evento para ver métricas más útiles.'}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      ) : (
        <Card className="glass-card border border-default-200/70 shadow-sm">
          <CardBody className="space-y-4 p-5 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <Input
                isClearable
                className="w-full lg:max-w-xl"
                placeholder="Buscar por nombre, descripción, participante o jurado…"
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

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={sortOrder === 'desc' ? 'flat' : 'bordered'}
                  onPress={() => setSortOrder('desc')}
                  className={sortOrder === 'desc' ? 'bg-foreground text-background' : ''}
                >
                  Mayor → Menor
                </Button>
                <Button
                  size="sm"
                  variant={sortOrder === 'asc' ? 'flat' : 'bordered'}
                  onPress={() => setSortOrder('asc')}
                  className={sortOrder === 'asc' ? 'bg-foreground text-background' : ''}
                >
                  Menor → Mayor
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-default-500">
              <span>
                {visibleProjects.length} proyectos visibles
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
                      Página {currentPage} de {visibleProjectsQuery.data?.meta.totalPages ?? 1}
                    </span>
                    <Pagination
                      isCompact
                      color="primary"
                      page={currentPage}
                      showControls
                      total={visibleProjectsQuery.data?.meta.totalPages ?? 1}
                      onChange={handlePageChange}
                    />
                  </div>
                }
                bottomContentPlacement="outside"
                selectionMode="none"
              >
                <TableHeader>
                  <TableColumn>Proyecto</TableColumn>
                  <TableColumn>Integrantes</TableColumn>
                  <TableColumn>Jurados asignados</TableColumn>
                  <TableColumn>Progreso de evaluación</TableColumn>
                </TableHeader>
                <TableBody
                  emptyContent={
                    visibleProjectsQuery.isLoading
                      ? undefined
                      : 'No hay proyectos que coincidan con el filtro.'
                  }
                  items={visibleProjectsQuery.isLoading ? [] : sortedProjects}
                >
                  {visibleProjectsQuery.isLoading ? (
                    <TableRow key="loading">
                      <TableCell colSpan={4}>
                        <div className="flex min-h-[240px] items-center justify-center">
                          <Spinner size="lg" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (project: ProjectWithJurors) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">
                              {project.name}
                            </p>
                            <p className="text-xs text-default-400">
                              {project.description || 'Sin descripción'}
                            </p>
                            {project.eventNumber ? (
                              <p className="text-xs text-default-400">
                                #{project.eventNumber}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs leading-tight">
                            {getParticipantLabels(project).length > 0 ? (
                              getParticipantLabels(project).map((participantLabel, idx) => (
                                <p key={idx} className="text-default-500">
                                  {participantLabel}
                                </p>
                              ))
                            ) : (
                              <p className="text-default-400 text-xs">Sin integrantes</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5 text-xs">
                            {(project.jurors ?? []).length > 0 ? (
                              (project.jurors ?? []).map((juror, idx) => (
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
                                  <span className="italic text-default-400 whitespace-nowrap">Estado: —</span>
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