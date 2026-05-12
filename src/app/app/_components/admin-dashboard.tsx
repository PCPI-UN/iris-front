'use client';

import { useUser } from '@/lib/auth';
import { Calendar, Folder, FileCheck, ShieldCheck, Users, Award } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Select, SelectItem } from '@/components/ui/select/select';
import { useEvents } from '@/features/events/api/get-events';
import { useCategoriesDropdown } from '@/features/courses/api/get-categories-dropdown';
import { useProjectsWithJurors } from '@/features/projects/api/get-projects-with-jurors';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { useDashboardStats } from '@/features/dashboard/api/get-dashboard-stats';
import { Spinner } from '@/components/ui/spinner';
import '@/features/landing/index.css';

export const AdminDashboard = () => {
  const user = useUser();
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Valores por defecto mientras se carga la información
  const defaultStats = {
    activeEvents: 0,
    totalProjects: 0,
    evaluations: 0,
  };

  const displayStats = stats ?? defaultStats;

  const statsCards = [
    {
      title: 'Eventos activos',
      value: displayStats.activeEvents,
      icon: Calendar,
      iconColor: 'text-blue-500',
    },
    {
      title: 'Proyectos registrados',
      value: displayStats.totalProjects,
      icon: Folder,
      iconColor: 'text-emerald-500',
    },
    {
      title: 'Evaluaciones completadas',
      value: displayStats.evaluations,
      icon: FileCheck,
      iconColor: 'text-amber-500',
    },
  ];

  return (
    <div className="dashboard-page space-y-4 md:space-y-6">
      <div className="space-y-1 md:space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">
          Bienvenido, {`${user.data?.firstName} ${user.data?.lastName}`}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Gestiona eventos, proyectos y evaluaciones desde un solo lugar.
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="glass-card shadow-sm">
            <CardHeader className="pb-2 md:pb-3">
              <div className="flex items-center justify-between w-full">
                <div className="space-y-0.5 md:space-y-1 flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-default-500 truncate">
                    {stat.title}
                  </p>
                  <h3 className="text-xl md:text-2xl font-bold">{stat.value}</h3>
                </div>
                <stat.icon className={`h-6 w-6 md:h-8 md:w-8 flex-shrink-0 ml-2 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardBody className="pt-0" />
          </Card>
        ))}
      </div>

      {/* Distribución de proyectos (moved here from monitoreo) */}
      <div className="mt-4">
        <Card className="glass-card border border-default-200/70 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Resumen general del evento</h3>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-4 pt-0">
            <DistributionCardContent />
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

const getJurorKey = (juror: any) => {
  if (juror.id !== undefined && juror.id !== null) return `id:${juror.id}`;
  if (juror.email?.trim()) return `email:${juror.email.trim().toLowerCase()}`;
  return `name:${juror.firstName ?? ''}:${juror.lastName ?? ''}`;
};

const getUniqueJurors = (jurors: any[] = []) => {
  const seen = new Set<string>();
  return jurors.filter((juror) => {
    const key = getJurorKey(juror);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getParticipantKey = (p: any) => {
  if (p.id !== undefined && p.id !== null) return `id:${p.id}`;
  if (p.studentCode?.toString().trim()) return `student:${p.studentCode}`;
  if (p.email?.trim()) return `email:${p.email.trim().toLowerCase()}`;
  return `name:${(p.firstName ?? '').trim().toLowerCase()}:${(p.lastName ?? '').trim().toLowerCase()}`;
};

const getUniqueParticipants = (participants: any[] = []) => {
  const seen = new Set<string>();
  return participants.filter((p) => {
    const key = getParticipantKey(p);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

function DistributionCardContent() {
  const { data: eventsData, isLoading: isEventsLoading } = useEvents({ page: 1 });
  const events = eventsData?.data ?? [];
  const [selectedEventId, setSelectedEventId] = useState<number | undefined>(events[0]?.id);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!events.length) return;
    if (!selectedEventId) setSelectedEventId(events[0].id);
  }, [events]);

  // Reset category when event changes
  useEffect(() => {
    setSelectedCategoryId(undefined);
  }, [selectedEventId]);

  const categoriesDropdownQuery = useCategoriesDropdown({ eventId: selectedEventId, queryConfig: { enabled: Boolean(selectedEventId) } });

  const projectsQuery = useProjectsWithJurors({ currentPage: 1, itemsPerPage: 10000, eventId: selectedEventId, courseId: selectedCategoryId, queryConfig: { enabled: Boolean(selectedEventId) } });
  const projects = projectsQuery.data?.data ?? [];

  const projectTotals = useMemo(() => {
    const uniqueJurorKeys = new Set<string>();
    const uniqueParticipantKeys = new Set<string>();

    projects.forEach((project) => {
      getUniqueJurors(project.jurors ?? []).forEach((juror) => uniqueJurorKeys.add(getJurorKey(juror)));
      // only count confirmed participants (exclude pendingParticipants)
      getUniqueParticipants(project.participants ?? []).forEach((p) => uniqueParticipantKeys.add(getParticipantKey(p)));
    });

    return {
      total: projects.length,
      underReview: projects.filter((p) => p.state === 'UNDER_REVIEW').length,
      requestChanges: projects.filter((p) => p.state === 'REQUEST_CHANGES').length,
      approved: projects.filter((p) => p.state === 'APPROVED').length,
      rejected: projects.filter((p) => p.state === 'REJECTED').length,
      uniqueJurorsCount: uniqueJurorKeys.size,
      uniqueParticipantsCount: uniqueParticipantKeys.size,
      jurorAssignments: projects.reduce((sum, project) => sum + getUniqueJurors(project.jurors ?? []).length, 0),
    };
  }, [projects]);

  const projectStateSeries = [
    { key: 'UNDER_REVIEW', label: 'En revisión', count: projectTotals.underReview, icon: FileCheck, textColor: 'text-amber-500', bgColor: 'bg-amber-500' },
    { key: 'REQUEST_CHANGES', label: 'Cambios requeridos', count: projectTotals.requestChanges, icon: FileCheck, textColor: 'text-sky-500', bgColor: 'bg-sky-500' },
    { key: 'APPROVED', label: 'Aprobado', count: projectTotals.approved, icon: FileCheck, textColor: 'text-emerald-500', bgColor: 'bg-emerald-500' },
    { key: 'REJECTED', label: 'Rechazado', count: projectTotals.rejected, icon: FileCheck, textColor: 'text-rose-500', bgColor: 'bg-rose-500' },
  ];

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div className="md:flex-1">
          <Select
            label="Evento"
            placeholder="Selecciona un evento"
            selectedKeys={selectedEventId ? [String(selectedEventId)] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];
              setSelectedEventId(selected ? Number(selected) : undefined);
            }}
            isLoading={isEventsLoading}
          >
            {events.map((ev) => (
              <SelectItem key={String(ev.id)}>{ev.name}</SelectItem>
            ))}
          </Select>
        </div>

        <div className="md:w-80">
          <Select
            label="Categoría"
            placeholder={selectedEventId ? 'Todas las categorías' : 'Selecciona un evento primero'}
            selectedKeys={selectedCategoryId ? [String(selectedCategoryId)] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];
              setSelectedCategoryId(selected ? Number(selected) : undefined);
            }}
            isDisabled={!selectedEventId}
            isLoading={categoriesDropdownQuery.isLoading}
          >
            {categoriesDropdownQuery.data?.data?.length ? (
              categoriesDropdownQuery.data.data.map((category: any) => (
                <SelectItem key={String(category.id)}>{category.code}</SelectItem>
              ))
            ) : (
              <SelectItem key="no-categories" isDisabled>{selectedEventId ? 'No hay categorías' : 'Selecciona un evento primero'}</SelectItem>
            )}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left column: Distribution of projects with chart */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-default-600 mb-3">Estado de proyectos</h4>
          {projectTotals.total > 0 ? (
            <div className="space-y-3">
              {projectStateSeries.map((item) => {
                const percentage = projectTotals.total > 0 ? (item.count / projectTotals.total) * 100 : 0;
                return (
                  <div key={item.key} className="space-y-2 rounded-2xl border border-default-200/70 bg-background/80 p-4">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <item.icon className={`h-4 w-4 ${item.textColor}`} />
                        <span className="font-medium text-foreground">{item.label}</span>
                      </div>
                      <span className="text-default-400">{item.count} / {projectTotals.total}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-default-100">
                      <div className={`h-full rounded-full transition-all ${item.bgColor}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-500">
              Todavía no hay proyectos para mostrar por estado.
            </div>
          )}
        </div>

        {/* Right column: Participants and Jurors */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-default-600 mb-3">Participación del evento</h4>
          <Card className="glass-card shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-default-500">Participantes</p>
                  <h3 className="text-xl md:text-2xl font-bold">{projectTotals.uniqueParticipantsCount ?? 0}</h3>
                </div>
                <Users className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0 text-violet-500" />
              </div>
            </CardHeader>
          </Card>

          <Card className="glass-card shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-default-500">Jurados</p>
                  <h3 className="text-xl md:text-2xl font-bold">{projectTotals.uniqueJurorsCount}</h3>
                </div>
                <Award className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0 text-amber-500" />
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
