'use client';

import { useMemo, useState } from 'react';
import { Calendar, Users, Award, Folder, Search, Trophy, Download } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Select, SelectItem } from '@/components/ui/select/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge/status-badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@/components/ui/table';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQueries } from '@tanstack/react-query';
// local tabs: Statistics | Projects | Jurors | Ranking
import { useProjectsWithJurors } from '@/features/projects/api/get-projects-with-jurors';
import { useCategoriesDropdown } from '@/features/courses/api/get-categories-dropdown';
import { getUniqueJurors, getJurorKey } from '@/features/monitoring/utils/calculations';
import { normalizeText } from '@/features/monitoring/utils/filters';
import { getProjectEvaluationStats } from '@/features/evaluations/api/get-project-evaluation-stats';
import type { Event } from '@/types/api';

type Props = {
    event: Event;
    onBack?: () => void;
};

const getParticipantKey = (p: any) => {
    if (p.userId !== undefined && p.userId !== null) return `id:${p.userId}`;
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

export const PastEventDashboard = ({ event, onBack }: Props) => {
    const [activeTab, setActiveTab] = useState<'statistics' | 'projects' | 'ranking' | 'jurors'>('statistics');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
    const categorySelection = selectedCategoryId !== undefined ? [String(selectedCategoryId)] : ['all'];

    const [projectSearch, setProjectSearch] = useState<string>('');

    const projectsQuery = useProjectsWithJurors({ currentPage: 1, itemsPerPage: 10000, eventId: event.id, categoryId: selectedCategoryId, queryConfig: { enabled: Boolean(event.id) } });
    const projects = projectsQuery.data?.data ?? [];

    const categoriesQuery = useCategoriesDropdown({ eventId: event.id, queryConfig: { enabled: Boolean(event.id) } });

    const totals = useMemo(() => {
        const jurorKeys = new Set<string>();
        const participantKeys = new Set<string>();

        projects.forEach((project) => {
            getUniqueJurors(project.jurors ?? []).forEach((j) => jurorKeys.add(getJurorKey(j)));
            // count both confirmed and pending participants as participation
            (project.participants ?? []).forEach((p) => participantKeys.add(getParticipantKey(p)));
            (project.pendingParticipants ?? []).forEach((p) => participantKeys.add(getParticipantKey(p)));
        });

        return {
            projects: projects.length,
            jurors: jurorKeys.size,
            participants: participantKeys.size,
        };
    }, [projects]);

    const categories = categoriesQuery.data?.data ?? [];
    const categoryMap = useMemo(() => new Map(categories.map((category: any) => [category.id, category])), [categories]);

    const chartData = useMemo(() => {
        const participantsByCategory = new Map<number, Set<string>>();
        const projectsByCategory = new Map<number, number>();

        projects.forEach((project) => {
            const categoryId = project.courseId ?? 0;
            projectsByCategory.set(categoryId, (projectsByCategory.get(categoryId) ?? 0) + 1);

            if (!participantsByCategory.has(categoryId)) {
                participantsByCategory.set(categoryId, new Set<string>());
            }

            const participantSet = participantsByCategory.get(categoryId)!;
            (project.participants ?? []).forEach((participant) => participantSet.add(getParticipantKey(participant)));
            (project.pendingParticipants ?? []).forEach((participant) => participantSet.add(getParticipantKey(participant)));
        });

        return categories
            .map((category: any) => ({
                id: category.id,
                name: category.code ?? category.description ?? `Categoría ${category.id}`,
                participants: participantsByCategory.get(category.id)?.size ?? 0,
                projects: projectsByCategory.get(category.id) ?? 0,
            }))
            .filter((entry) => entry.participants > 0 || entry.projects > 0);
    }, [projects, categories]);

    const jurors = useMemo(() => {
        const map = new Map<string, any>();

        projects.forEach((project) => {
            (project.jurors ?? []).forEach((juror: any) => {
                const key = getJurorKey(juror);
                if (!map.has(key)) {
                    map.set(key, juror);
                }
            });
        });

        return Array.from(map.values());
    }, [projects]);

    const [jurorSearch, setJurorSearch] = useState<string>('');
    const filteredJurors = useMemo(() => {
        const term = normalizeText(jurorSearch);
        if (!term) return jurors;
        return jurors.filter((juror) =>
            normalizeText(`${juror.firstName ?? ''} ${juror.lastName ?? ''} ${juror.email ?? ''}`).includes(term),
        );
    }, [jurors, jurorSearch]);

    const projectEvaluationQueries = useQueries({
        queries: projects.map((project) => ({
            queryKey: ['project-evaluation-stats-past', project.id],
            queryFn: () => getProjectEvaluationStats(String(project.id)),
            enabled: Boolean(event.id && project.id),
        })),
    });

    const projectStatsById = useMemo(() => {
        return new Map<string, any>(
            projects.map((project, index) => [
                String(project.id),
                projectEvaluationQueries[index]?.data?.data,
            ]),
        );
    }, [projectEvaluationQueries, projects]);

    const totalCompletedEvaluations = useMemo(() => {
        let sum = 0;
        for (const project of projects) {
            const stats = projectStatsById.get(String(project.id));
            if (stats && typeof stats.evaluationCount === 'number') {
                sum += stats.evaluationCount;
            }
        }
        return sum;
    }, [projectStatsById, projects]);

    const filteredProjects = useMemo(() => {
        const term = normalizeText(projectSearch);

        if (!term) {
            return projects;
        }

        return projects.filter((project) => {
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
    }, [projectSearch, projects]);

    const [rankingSearch, setRankingSearch] = useState<string>('');
    const [isRankingPublic, setIsRankingPublic] = useState<boolean>(false);
    const rankingEntries = useMemo(() => {
        const term = normalizeText(rankingSearch);
        const byCategory = Array.from(
            projects.reduce((acc, project) => {
                const key = project.courseId ?? 0;
                const list = acc.get(key) ?? [];
                list.push(project);
                acc.set(key, list);
                return acc;
            }, new Map<number, typeof projects>()),
        );

        const entries: Array<any> = [];

        byCategory.forEach(([courseId, courseProjects]) => {
            const category = categoryMap.get(courseId);
            const label = category?.code ?? category?.description ?? `Categoría ${courseId}`;

            const sorted = [...courseProjects]
                .map((project) => ({ project, stats: projectStatsById.get(String(project.id)) }))
                .filter((entry) => {
                    if (!term) return true;
                    const p = entry.project;
                    const participantLabels = ((p.participants ?? []) as any[])
                        .map((pt) => `${pt.firstName ?? ''} ${pt.lastName ?? ''}`.trim())
                        .join(' ');
                    const jurorLabels = ((p.jurors ?? []) as any[])
                        .map((j) => `${j.firstName ?? ''} ${j.lastName ?? ''} ${j.email ?? ''}`)
                        .join(' ');

                    return normalizeText([
                        label,
                        p.name,
                        p.projectCode ?? '',
                        p.eventNumber ?? '',
                        participantLabels,
                        jurorLabels,
                    ].join(' ')).includes(term);
                })
                .sort((a, b) => {
                    const gradeA = a.stats?.averageGrade ?? 0;
                    const gradeB = b.stats?.averageGrade ?? 0;
                    if (gradeB !== gradeA) return gradeB - gradeA;
                    const countA = a.stats?.evaluationCount ?? 0;
                    const countB = b.stats?.evaluationCount ?? 0;
                    if (countB !== countA) return countB - countA;
                    return (a.project.name ?? '').localeCompare(b.project.name ?? '');
                });

            sorted.forEach((entry, index) => {
                entries.push({
                    category: label,
                    position: index + 1,
                    project: entry.project,
                    stats: entry.stats,
                });
            });
        });

        return entries;
    }, [projects, categoryMap, projectStatsById, rankingSearch]);

    const colors = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <div className="mb-2">
                        <Button variant="ghost" onPress={() => onBack && onBack()}>
                            ← Volver a eventos pasados
                        </Button>
                    </div>

                    <h1 className="text-2xl font-semibold max-w-full whitespace-normal md:max-w-md">{event.name}</h1>
                    <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <p className="text-sm text-default-500 line-clamp-2">{event.description}</p>
                        <Button
                            className="shrink-0"
                            size="sm"
                            variant="flat"
                            startContent={<Download className="h-4 w-4" />}
                            onPress={() => {}}
                        >
                            Descargar reporte
                        </Button>
                    </div>
                    <div className="mt-2 flex flex-col gap-2 text-sm text-default-500 sm:flex-row sm:flex-wrap sm:items-center">
                        <div className="inline-flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-default-400" />
                            <span>
                                {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="inline-flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-default-400" />
                            <span>Inscripción: {new Date(event.inscriptionDeadline).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <Select
                        label="Categoría"
                        className="w-full md:w-80"
                        placeholder={categories.length ? 'Todas las categorías' : 'Sin categorías'}
                        selectedKeys={categorySelection}
                        onSelectionChange={(keys) => {
                            const selected = Array.from(keys)[0];
                            setSelectedCategoryId(selected === 'all' || !selected ? undefined : Number(selected));
                        }}
                        isLoading={categoriesQuery.isLoading}
                        items={[
                            { id: 'all', label: 'Todas las categorías' },
                            ...categories.map((category: any) => ({
                                id: String(category.id),
                                label: category.code ?? category.description ?? `Categoría ${category.id}`,
                            })),
                        ]}
                    >
                        {(item) => <SelectItem key={item.id}>{item.label}</SelectItem>}
                    </Select>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-wrap gap-2">
                        <button className={`rounded-md px-3 py-1 text-sm ${activeTab === 'statistics' ? 'bg-foreground text-background' : 'border'}`} onClick={() => setActiveTab('statistics')}>Estadísticas</button>
                        <button className={`rounded-md px-3 py-1 text-sm ${activeTab === 'projects' ? 'bg-foreground text-background' : 'border'}`} onClick={() => setActiveTab('projects')}>Proyectos</button>
                        <button className={`rounded-md px-3 py-1 text-sm ${activeTab === 'jurors' ? 'bg-foreground text-background' : 'border'}`} onClick={() => setActiveTab('jurors')}>Jurados</button>
                        <button className={`rounded-md px-3 py-1 text-sm ${activeTab === 'ranking' ? 'bg-foreground text-background' : 'border'}`} onClick={() => setActiveTab('ranking')}>Ranking</button>
                    </div>
                </div>
            </div>

            <div>
                {activeTab === 'statistics' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            <Card className="glass-card shadow-sm">
                                <CardHeader className="pb-2">
                                    <div className="flex w-full items-center justify-between gap-2">
                                        <div className="min-w-0 flex-1 space-y-0.5">
                                            <p className="text-xs font-medium text-default-500 md:text-sm">Participantes</p>
                                            <h3 className="text-xl font-bold md:text-2xl">{totals.participants}</h3>
                                        </div>
                                        <Users className="h-6 w-6 text-violet-500" />
                                    </div>
                                </CardHeader>
                            </Card>

                            <Card className="glass-card shadow-sm">
                                <CardHeader className="pb-2">
                                    <div className="flex w-full items-center justify-between gap-2">
                                        <div className="min-w-0 flex-1 space-y-0.5">
                                            <p className="text-xs font-medium text-default-500 md:text-sm">Proyectos</p>
                                            <h3 className="text-xl font-bold md:text-2xl">{totals.projects}</h3>
                                        </div>
                                        <Folder className="h-6 w-6 text-emerald-500" />
                                    </div>
                                </CardHeader>
                            </Card>

                            <Card className="glass-card shadow-sm">
                                <CardHeader className="pb-2">
                                    <div className="flex w-full items-center justify-between gap-2">
                                        <div className="min-w-0 flex-1 space-y-0.5">
                                            <p className="text-xs font-medium text-default-500 md:text-sm">Jurados</p>
                                            <h3 className="text-xl font-bold md:text-2xl">{totals.jurors}</h3>
                                        </div>
                                        <Award className="h-6 w-6 text-amber-500" />
                                    </div>
                                </CardHeader>
                            </Card>

                            <Card className="glass-card shadow-sm">
                                <CardHeader className="pb-2">
                                    <div className="flex w-full items-center justify-between gap-2">
                                        <div className="min-w-0 flex-1 space-y-0.5">
                                            <p className="text-xs font-medium text-default-500 md:text-sm">Evaluaciones completas</p>
                                            <h3 className="text-xl font-bold md:text-2xl">{totalCompletedEvaluations}</h3>
                                        </div>
                                        <Award className="h-6 w-6 text-amber-500" />
                                    </div>
                                </CardHeader>
                            </Card>
                            
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                            <Card className="glass-card p-5 shadow-sm">
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-foreground">Participantes por Categoría</h3>
                                    <p className="text-sm text-default-400">Distribución de participantes únicos por categoría.</p>
                                </div>

                                <div className="h-[320px] w-full">
                                    {chartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={chartData}
                                                    dataKey="participants"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={110}
                                                    innerRadius={55}
                                                    paddingAngle={2}
                                                    label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}
                                                >
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={String(entry.id)} fill={colors[index % colors.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={((value: any) => [`${value ?? 0} participantes`, 'Participantes']) as any} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-400">
                                            No hay datos suficientes para el gráfico.
                                        </div>
                                    )}
                                </div>
                            </Card>

                            <Card className="glass-card p-5 shadow-sm">
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-foreground">Distribución por Categoría</h3>
                                    <p className="text-sm text-default-400">Comparación entre participantes y proyectos por categoría.</p>
                                </div>

                                <div className="h-[320px] w-full">
                                    {chartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                                                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                                                <YAxis allowDecimals={false} />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="participants" name="Participantes" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                                                <Bar dataKey="projects" name="Proyectos" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-400">
                                            No hay datos suficientes para el gráfico.
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'projects' && (
                    <Card className="glass-card border border-default-200/70 shadow-sm">
                        <CardHeader className="pb-2">
                            <h3 className="text-lg font-semibold">Evaluación de proyectos</h3>
                        </CardHeader>
                        <div className="p-5 md:p-6">
                            <div className="mb-4">
                                <Input
                                    isClearable
                                    className="w-full lg:max-w-xl h-10"
                                    placeholder="Buscar por nombre, código de proyecto, participante o jurado…"
                                    startContent={<Search className="h-4 w-4 text-default-400" />}
                                    value={projectSearch}
                                    onClear={() => setProjectSearch('')}
                                    onValueChange={setProjectSearch}
                                />
                            </div>

                            {projects.length > 0 ? (
                                <div className="overflow-hidden rounded-2xl border border-default-200/80">
                                    <Table aria-label="Evaluación de proyectos" selectionMode="none">
                                        <TableHeader>
                                            <TableColumn className="w-32">Code</TableColumn>
                                            <TableColumn>Proyecto</TableColumn>
                                            <TableColumn>Integrantes</TableColumn>
                                            <TableColumn>Jurados asignados</TableColumn>
                                        </TableHeader>
                                        <TableBody items={filteredProjects}>
                                            {(project) => (
                                                <TableRow key={project.id}>
                                                    <TableCell className="w-32 whitespace-nowrap">
                                                        <p className="font-medium text-default-700">{project.projectCode ?? project.eventNumber ?? '—'}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <p className="text-lg font-semibold text-foreground">{project.name}</p>
                                                            <p className="text-xs text-default-400">{project.description ?? 'Sin descripción'}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1 text-sm leading-tight">
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
                                                                    participantLabels.map((label, index) => (
                                                                        <p key={index} className="text-sm text-default-500">
                                                                            {label}
                                                                        </p>
                                                                    ))
                                                                ) : (
                                                                    <p className="text-sm text-default-400">Sin integrantes</p>
                                                                );
                                                            })()}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1 text-sm">
                                                            {(() => {
                                                                const jurorList = getUniqueJurors(project.jurors ?? []);
                                                                return jurorList.length > 0 ? (
                                                                    jurorList.map((juror, index) => (
                                                                        <p key={index} className="text-sm text-default-500">
                                                                            {juror.firstName} {juror.lastName}
                                                                        </p>
                                                                    ))
                                                                ) : (
                                                                    <p className="text-sm text-default-400">Sin jurados asignados</p>
                                                                );
                                                            })()}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : null}
                            {filteredProjects.length === 0 && projects.length > 0 && (
                                <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-400">
                                    No hay proyectos que coincidan con la búsqueda.
                                </div>
                            )}
                            {projects.length === 0 && (
                                <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-400">
                                    No hay proyectos para mostrar.
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {activeTab === 'jurors' && (
                    <Card className="glass-card border border-default-200/70 shadow-sm">
                        <CardHeader className="pb-2">
                            <h3 className="text-lg font-semibold">Jurados</h3>
                        </CardHeader>
                        <div className="p-5 md:p-6">
                            <div className="mb-4">
                                <Input
                                    isClearable
                                    className="w-full lg:max-w-xl h-10"
                                    placeholder="Buscar por nombre o correo…"
                                    startContent={<Search className="h-4 w-4 text-default-400" />}
                                    value={jurorSearch}
                                    onClear={() => setJurorSearch('')}
                                    onValueChange={setJurorSearch}
                                />
                            </div>

                            {jurors.length > 0 ? (
                                <div className="overflow-hidden rounded-2xl border border-default-200/80">
                                    <Table aria-label="Jurados" selectionMode="none">
                                        <TableHeader>
                                            <TableColumn>Nombre</TableColumn>
                                            <TableColumn>Correo</TableColumn>
                                            <TableColumn>Proyectos Asignados</TableColumn>
                                        </TableHeader>
                                        <TableBody items={filteredJurors}>
                                            {(juror) => {
                                                const jurorKey = getJurorKey(juror);
                                                const jurorProjects = projects.filter((project) =>
                                                    getUniqueJurors(project.jurors ?? []).some((j) => getJurorKey(j) === jurorKey),
                                                );

                                                return (
                                                    <TableRow key={jurorKey}>
                                                        <TableCell>
                                                            <div className="text-sm font-semibold text-foreground">{juror.firstName} {juror.lastName}</div>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-default-400">{juror.email ?? '—'}</TableCell>
                                                        <TableCell>
                                                            {jurorProjects.length > 0 ? (
                                                                <div className="space-y-1 text-sm">
                                                                    {jurorProjects.map((p) => (
                                                                        <p key={p.id} className="text-sm text-default-500">{p.name}{p.projectCode ? ` (${p.projectCode})` : ''}</p>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-default-400">Sin proyectos evaluados</p>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            }}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-400">
                                    No hay jurados para mostrar.
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {activeTab === 'ranking' && (
                    <Card className="glass-card border border-default-200/70 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">Ranking por Categoría</h3>
                                    <p className="text-sm text-default-400">Vista visual del ranking con puestos destacados.</p>
                                </div>
                                <div className="flex items-center gap-3 rounded-2xl border border-default-200/80 bg-default-50 px-3 py-2">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-foreground">Visible al público</span>
                                        <span className="text-xs text-default-400">
                                            {isRankingPublic ? 'Ranking publicado' : 'Ranking oculto'}
                                        </span>
                                    </div>
                                    <Switch
                                        isSelected={isRankingPublic}
                                        onValueChange={setIsRankingPublic}
                                        aria-label="Hacer ranking visible al público"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <div className="p-5 md:p-6">
                            <div className="mb-4">
                                <Input
                                    isClearable
                                    className="w-full lg:max-w-xl h-10"
                                    placeholder="Buscar por categoría, equipo, código o participante…"
                                    startContent={<Search className="h-4 w-4 text-default-400" />}
                                    value={rankingSearch}
                                    onClear={() => setRankingSearch('')}
                                    onValueChange={setRankingSearch}
                                />
                            </div>

                            {rankingEntries.length > 0 ? (
                                <div className="overflow-hidden rounded-2xl border border-default-200/80">
                                    <Table aria-label="Ranking por categorías" selectionMode="none">
                                        <TableHeader>
                                            <TableColumn className="w-36">Categoría</TableColumn>
                                            <TableColumn className="w-20">Pos.</TableColumn>
                                            <TableColumn className="w-36">Code</TableColumn>
                                            <TableColumn>Equipo</TableColumn>
                                            <TableColumn>Integrantes</TableColumn>
                                            <TableColumn className="w-32 text-center">Puntaje</TableColumn>
                                            <TableColumn className="w-32 text-center">Evaluaciones</TableColumn>
                                        </TableHeader>
                                        <TableBody items={rankingEntries}>
                                            {(entry) => (
                                                <TableRow key={`${entry.project.id}-${entry.category}`}>
                                                    <TableCell className="w-36">{entry.category}</TableCell>
                                                    <TableCell className="w-20">
                                                        {entry.position === 1 ? (
                                                            <div className="inline-flex items-center gap-2">
                                                                <Trophy className="h-5 w-5 text-amber-500" />
                                                                <span className="font-semibold">1</span>
                                                            </div>
                                                        ) : entry.position === 2 ? (
                                                            <div className="inline-flex items-center gap-2">
                                                                <div className="h-6 w-6 rounded-full bg-slate-200 text-default-700 flex items-center justify-center">2</div>
                                                            </div>
                                                        ) : entry.position === 3 ? (
                                                            <div className="inline-flex items-center gap-2">
                                                                <div className="h-6 w-6 rounded-full bg-amber-100 text-default-700 flex items-center justify-center">3</div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-default-700">{entry.position}</div>
                                                        )}
                                                    </TableCell>
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
                                                                    .map((participant: any) => `${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim())
                                                                    .filter((label: string) => label.length > 0);

                                                                const participantLabels = pendingLabels.length > 0
                                                                    ? pendingLabels
                                                                    : (entry.project.participants ?? []).map((participant: any) => {
                                                                        const fullName = `${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim();
                                                                        if (fullName) return fullName;
                                                                        if (participant.studentCode) return `Código ${participant.studentCode}`;
                                                                        return 'Participante';
                                                                    });

                                                                return participantLabels.length > 0 ? (
                                                                    participantLabels.map((label: string, i: number) => <p key={i} className="text-sm text-default-500">{label}</p>)
                                                                ) : (
                                                                    <p className="text-sm text-default-400">Sin integrantes</p>
                                                                );
                                                            })()}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="w-32 text-center">
                                                        <div className="flex h-full flex-col items-center justify-center">
                                                            <p className="text-lg font-semibold">{entry.stats?.averageGrade !== undefined ? entry.stats.averageGrade.toFixed(2) : '—'}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="w-32 text-center">
                                                        <div className="flex h-full flex-col items-center justify-center">
                                                            <p className="text-sm">{entry.stats?.evaluationCount ?? 0}</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-400">
                                    No hay proyectos con evaluaciones para mostrar el ranking.
                                </div>
                            )}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default PastEventDashboard;
