'use client';

import { useMemo, useState, useEffect } from 'react';
import { Calendar, Users, Award, Folder, Search, Trophy, Download, Eye, Settings, RefreshCw } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Select, SelectItem } from '@/components/ui/select/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@/components/ui/table';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQueries } from '@tanstack/react-query';
// local tabs: Statistics | Projects | Jurors | Ranking
import { useProjectsWithJurors } from '@/features/projects/api/get-projects-with-jurors';
import { useCategoriesDropdown } from '@/features/courses/api/get-categories-dropdown';
import { getUniqueJurors, getJurorKey } from '@/features/monitoring/utils/calculations';
import { normalizeText } from '@/features/monitoring/utils/filters';
import { getProjectEvaluationStats } from '@/features/evaluations/api/get-project-evaluation-stats';
import { ParticipantsDetails } from '@/features/projects/components/participants-details';
import { ExportEventReportButton } from '@/features/reports/components/export-event-report-button';
import { RankingConfigModal } from '@/features/monitoring/components/ranking-config-modal';
import type { RankingConfigType } from '@/features/monitoring/types';
import { useRankingConfig } from '@/features/monitoring/api/get-ranking-config';
import { downloadEventRankingsReport, useEventRankings } from '@/features/monitoring/api/get-event-rankings';
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [isJurorModalOpen, setIsJurorModalOpen] = useState(false);
    const [selectedJuror, setSelectedJuror] = useState<any>(null);
    const [isRankingConfigOpen, setIsRankingConfigOpen] = useState(false);
    const [rankingConfigId, setRankingConfigId] = useState<number | undefined>(undefined);
    const [rankingTableVersion, setRankingTableVersion] = useState(0);
    const [rankingConfig, setRankingConfig] = useState<RankingConfigType>({
        visiblePositions: 0,
        visibleInLanding: false,
        visibleScore: true,
    });
    const [isRefreshingRanking, setIsRefreshingRanking] = useState(false);
    const [isDownloadingNotes, setIsDownloadingNotes] = useState(false);
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
    const canFetchRanking = Boolean(event.id && selectedCategoryId);
    const rankingConfigQuery = useRankingConfig({
        eventId: event.id,
        queryConfig: { enabled: Boolean(event.id) },
    });
    const rankingQuery = useEventRankings({
        eventId: event.id,
        categoryId: selectedCategoryId,
        state: 'APPROVED',
        queryConfig: { enabled: canFetchRanking },
    });

    const approvedProjects = useMemo(
        () => projects.filter((project) => String(project.state ?? '').toUpperCase() === 'APPROVED'),
        [projects],
    );

    const approvedProjectLookup = useMemo(() => {
        const byId = new Set<string>();
        const byCode = new Set<string>();
        const byName = new Set<string>();

        approvedProjects.forEach((project) => {
            if (project.id !== undefined && project.id !== null) {
                byId.add(String(project.id));
            }

            const projectCode = normalizeText(String(project.projectCode ?? project.eventNumber ?? ''));
            if (projectCode) {
                byCode.add(projectCode);
            }

            const projectName = normalizeText(String(project.name ?? ''));
            if (projectName) {
                byName.add(projectName);
            }
        });

        return { byId, byCode, byName };
    }, [approvedProjects]);

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
    const effectiveRankingConfig = rankingConfigQuery.data?.data ?? event.rankingConfig ?? null;
    const visiblePositions = effectiveRankingConfig?.visiblePositions ?? effectiveRankingConfig?.positions ?? 0;
    const showRankingScore = rankingConfig.visibleScore;
    const rankingRows = rankingQuery.data?.data ?? [];

    const handleOpenRankingConfig = async () => {
        let fetchedConfig = undefined as any;
        if (event?.id) {
            const refetchResult = await rankingConfigQuery.refetch();
            fetchedConfig = refetchResult?.data?.data;
        }

        const existingRankingConfig = event?.rankingConfig;
        const source = fetchedConfig ?? existingRankingConfig;

        setRankingConfigId(
            typeof source?.id === 'number'
                ? source.id
                : typeof event?.rankingConfigId === 'number'
                    ? event.rankingConfigId
                    : undefined,
        );

        setRankingConfig({
            visiblePositions: source?.visiblePositions ?? source?.positions ?? 0,
            visibleInLanding: source?.visibleInLanding ?? false,
            visibleScore: source?.visibleScore ?? true,
        });

        setIsRankingConfigOpen(true);
    };

    const handleRefreshRanking = async () => {
        if (!event?.id) {
            return;
        }

        setIsRefreshingRanking(true);

        try {
            const [, configResult] = await Promise.all([
                rankingQuery.refetch(),
                rankingConfigQuery.refetch(),
            ]);
            const refreshedConfig = configResult.data?.data;

            setRankingConfigId(
                typeof refreshedConfig?.id === 'number'
                    ? refreshedConfig.id
                    : typeof event.rankingConfigId === 'number'
                        ? event.rankingConfigId
                        : typeof event.rankingConfig?.id === 'number'
                            ? event.rankingConfig.id
                            : undefined,
            );

            setRankingConfig({
                visiblePositions: refreshedConfig?.visiblePositions ?? refreshedConfig?.positions ?? event.rankingConfig?.visiblePositions ?? event.rankingConfig?.positions ?? 0,
                visibleInLanding: refreshedConfig?.visibleInLanding ?? event.rankingConfig?.visibleInLanding ?? false,
                visibleScore: refreshedConfig?.visibleScore ?? event.rankingConfig?.visibleScore ?? true,
            });

            setRankingTableVersion((value) => value + 1);
        } finally {
            setIsRefreshingRanking(false);
        }
    };

    const handleDownloadNotes = async () => {
        if (!event?.id) {
            return;
        }

        setIsDownloadingNotes(true);

        try {
            const { blob, fileName } = await downloadEventRankingsReport({
                eventId: event.id,
                categoryId: selectedCategoryId,
                state: 'APPROVED',
            });

            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');

            anchor.href = url;
            anchor.download = fileName;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
        } finally {
            setIsDownloadingNotes(false);
        }
    };

    useEffect(() => {
        const existingRankingConfig = event.rankingConfig;
        const fetchedRankingConfig = rankingConfigQuery.data?.data;

        setRankingConfigId(
            typeof event.rankingConfigId === 'number'
                ? event.rankingConfigId
                : typeof existingRankingConfig?.id === 'number'
                    ? existingRankingConfig.id
                    : typeof fetchedRankingConfig?.id === 'number'
                        ? fetchedRankingConfig.id
                    : undefined,
        );

        setRankingConfig({
            visiblePositions:
                existingRankingConfig?.visiblePositions ?? existingRankingConfig?.positions ?? fetchedRankingConfig?.visiblePositions ?? fetchedRankingConfig?.positions ?? 0,
            visibleInLanding: existingRankingConfig?.visibleInLanding ?? fetchedRankingConfig?.visibleInLanding ?? false,
            visibleScore: existingRankingConfig?.visibleScore ?? fetchedRankingConfig?.visibleScore ?? true,
        });
    }, [event, rankingConfigQuery.data]);
    const rankingEntries = useMemo<any[]>(() => {
        const term = normalizeText(rankingSearch);
        const approvedRankingRows = rankingRows
            .map((entry) => {
                const projectId = entry.projectId !== undefined && entry.projectId !== null ? String(entry.projectId) : undefined;
                const matchedProject = approvedProjects.find((project) => {
                    if (projectId && String(project.id) === projectId) return true;

                    const projectCode = normalizeText(String(project.projectCode ?? project.eventNumber ?? ''));
                    if (projectCode && projectCode === normalizeText(String(entry.projectCode ?? ''))) return true;

                    const projectName = normalizeText(String(project.name ?? ''));
                    return projectName && projectName === normalizeText(String(entry.projectName ?? ''));
                });

                const projectStats = matchedProject?.id !== undefined ? projectStatsById.get(String(matchedProject.id)) : undefined;
                const fallbackEvaluationCount = typeof projectStats?.evaluationCount === 'number' ? projectStats.evaluationCount : undefined;

                return {
                    ...entry,
                    evaluationCount: entry.evaluationCount > 0 ? entry.evaluationCount : (fallbackEvaluationCount ?? entry.evaluationCount ?? 0),
                };
            })
            .filter((entry) => {
                const projectId = entry.projectId !== undefined && entry.projectId !== null ? String(entry.projectId) : undefined;
                if (projectId && approvedProjectLookup.byId.has(projectId)) {
                    return true;
                }

                const projectCode = normalizeText(String(entry.projectCode ?? ''));
                if (projectCode && approvedProjectLookup.byCode.has(projectCode)) {
                    return true;
                }

                const projectName = normalizeText(String(entry.projectName ?? ''));
                if (projectName && approvedProjectLookup.byName.has(projectName)) {
                    return true;
                }

                return false;
            })
            .filter((entry) => {
                if (!term) return true;

                const participantLabels = (entry.participants ?? []).join(' ');
                return normalizeText([
                    entry.category ?? '',
                    entry.projectName ?? '',
                    entry.projectCode ?? '',
                    participantLabels,
                ].join(' ')).includes(term);
            })
            .sort((a, b) => a.position - b.position);

        return approvedRankingRows;
    }, [approvedProjects, approvedProjectLookup, projectStatsById, rankingRows, rankingSearch]);

    const visibleRankingEntries = useMemo<any[]>(() => {
        if (!visiblePositions || visiblePositions <= 0) {
            return rankingEntries;
        }

        const seenByCategory = new Map<string, number>();

        return rankingEntries.filter((entry) => {
            const categoryKey = normalizeText(entry.category ?? '') || '__uncategorized__';
            const currentCount = seenByCategory.get(categoryKey) ?? 0;
            if (currentCount >= visiblePositions) {
                return false;
            }

            seenByCategory.set(categoryKey, currentCount + 1);
            return true;
        });
    }, [rankingEntries, visiblePositions]);

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
                        <div className="shrink-0">
                            <ExportEventReportButton eventId={event.id} label="Descargar reporte" />
                        </div>
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
                                                    label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
                                                    labelLine={false}
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
                                            <TableColumn className="w-36">Código</TableColumn>
                                            <TableColumn>Nombre Proyecto</TableColumn>
                                            <TableColumn className="w-32 text-center">Acciones</TableColumn>
                                        </TableHeader>
                                        <TableBody items={filteredProjects}>
                                            {(project) => {
                                                const category = categoryMap.get(project.courseId);
                                                const categoryLabel = category?.code ?? category?.description;

                                                return (
                                                    <TableRow key={project.id}>
                                                        <TableCell className="w-36 whitespace-nowrap">
                                                            <Chip size="sm" variant="flat">
                                                                {project.projectCode ?? project.eventNumber ?? '—'}
                                                            </Chip>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-1">
                                                                <p className="font-semibold text-foreground leading-tight">{project.name}</p>
                                                                {categoryLabel && (
                                                                    <Chip size="sm" variant="flat" color="secondary" className="text-xs">
                                                                        {categoryLabel}
                                                                    </Chip>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="w-32 text-center">
                                                            <Button
                                                                size="sm"
                                                                variant="bordered"
                                                                startContent={<Eye className="h-4 w-4" />}
                                                                className="border-default-300"
                                                                onPress={() => {
                                                                    setSelectedProject(project);
                                                                    setIsModalOpen(true);
                                                                }}
                                                            >
                                                                Ver más
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            }}
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
                                            <TableColumn className="w-40 text-center">Proyectos</TableColumn>
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
                                                        <TableCell className="w-40 text-center">
                                                            <Button
                                                                size="sm"
                                                                variant="bordered"
                                                                startContent={<Folder className="h-4 w-4" />}
                                                                className="border-default-300"
                                                                isDisabled={jurorProjects.length === 0}
                                                                onPress={() => {
                                                                    setSelectedJuror({ ...juror, assignedProjects: jurorProjects });
                                                                    setIsJurorModalOpen(true);
                                                                }}
                                                            >
                                                                {jurorProjects.length > 0 ? `Ver (${jurorProjects.length})` : 'Sin proyectos'}
                                                            </Button>
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
                        <CardHeader className="pb-2 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Ranking por Categoría</h3>
                            <div className="flex items-center gap-1 md:gap-2">
                                <Button
                                    className="relative gap-2 border-2 border-default-300 hover:border-primary text-default-600 hover:text-primary hover:scale-105 transition-all duration-300 font-semibold px-4 py-2"
                                    variant="bordered"
                                    onPress={handleOpenRankingConfig}
                                >
                                    <Eye className="h-5 w-5" />
                                    <Settings className="h-5 w-5" />
                                </Button>
                                <Button
                                    className="relative gap-2 border-2 border-default-300 hover:border-primary text-default-600 hover:text-primary hover:scale-105 transition-all duration-300 font-semibold px-4 py-2"
                                    variant="bordered"
                                    onPress={handleRefreshRanking}
                                    isDisabled={isRefreshingRanking || isDownloadingNotes || !event?.id}
                                >
                                    <RefreshCw className={isRefreshingRanking ? 'h-5 w-5 animate-spin' : 'h-5 w-5'} />
                                    {isRefreshingRanking ? 'Actualizando…' : 'Refrescar'}
                                </Button>
                                <Button
                                    className="relative gap-2 border-2 border-default-300 hover:border-primary text-default-600 hover:text-primary hover:scale-105 transition-all duration-300 font-semibold px-4 py-2"
                                    variant="bordered"
                                    onPress={handleDownloadNotes}
                                    isDisabled={isRefreshingRanking || isDownloadingNotes || !event?.id}
                                >
                                    <Download className={isDownloadingNotes ? 'h-5 w-5 animate-pulse' : 'h-5 w-5'} />
                                    {isDownloadingNotes ? 'Descargando…' : 'Descargar notas'}
                                </Button>
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

                            {!selectedCategoryId ? (
                                <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-400">
                                    Selecciona una categoría para ver el ranking.
                                </div>
                            ) : rankingEntries.length > 0 ? (
                                <>
                                    <div className="mb-3 flex flex-wrap gap-2">
                                        <Chip size="sm" variant="flat">
                                            Posiciones visibles: {visiblePositions > 0 ? visiblePositions : 'Todas'}
                                        </Chip>
                                        <Chip size="sm" variant="flat" color={showRankingScore ? 'success' : 'default'}>
                                            Puntaje {showRankingScore ? 'visible' : 'oculto'}
                                        </Chip>
                                    </div>
                                    <div className="overflow-hidden rounded-2xl border border-default-200/80">
                                        <Table key={rankingTableVersion} aria-label="Ranking por categorías" selectionMode="none">
                                            <TableHeader>
                                                <TableColumn className="w-16 text-center">Pos.</TableColumn>
                                                <TableColumn className="w-32">Código</TableColumn>
                                                <TableColumn>Nombre Proyecto</TableColumn>
                                                <TableColumn className="w-28 text-center">Evaluaciones</TableColumn>
                                                <TableColumn className="w-28 text-center">Puntaje</TableColumn>
                                                <TableColumn className="w-28 text-center">Ver más</TableColumn>
                                            </TableHeader>
                                            <TableBody items={visibleRankingEntries}>
                                                {(entry) => (
                                                    <TableRow key={`${entry.projectId ?? entry.projectCode ?? entry.projectName}-${entry.position}-${entry.category ?? 'all'}`}>
                                                        <TableCell className="w-16 text-center">
                                                            {entry.position === 1 ? (
                                                                <div className="inline-flex items-center justify-center gap-1">
                                                                    <Trophy className="h-5 w-5 text-amber-500" />
                                                                    <span className="font-bold text-amber-500">1</span>
                                                                </div>
                                                            ) : entry.position === 2 ? (
                                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600 mx-auto">2</div>
                                                            ) : entry.position === 3 ? (
                                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700 mx-auto">3</div>
                                                            ) : (
                                                                <span className="text-sm text-default-500">{entry.position}</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="w-32 whitespace-nowrap">
                                                            <Chip size="sm" variant="flat">
                                                                {entry.projectCode ?? '—'}
                                                            </Chip>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-1">
                                                                <p className="font-semibold text-foreground leading-tight">{entry.projectName}</p>
                                                                <Chip size="sm" variant="flat" color="secondary" className="text-xs">
                                                                    {entry.category}
                                                                </Chip>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="w-28 text-center">
                                                            <span className="text-sm font-medium text-default-600">{entry.evaluationCount ?? 0}</span>
                                                        </TableCell>
                                                        <TableCell className="w-28 text-center">
                                                            <span className={showRankingScore ? 'text-base font-bold text-foreground' : 'text-base text-default-400'}>
                                                                {showRankingScore
                                                                    ? entry.averageGrade !== undefined
                                                                        ? entry.averageGrade.toFixed(2)
                                                                        : '—'
                                                                    : 'Oculto'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="w-28 text-center">
                                                            <Button
                                                                size="sm"
                                                                variant="bordered"
                                                                startContent={<Eye className="h-4 w-4" />}
                                                                className="border-default-300"
                                                                onPress={() => {
                                                                    const relatedProject = projects.find((project) => String(project.id) === String(entry.projectId)) ?? null;
                                                                    setSelectedProject(relatedProject);
                                                                    setIsModalOpen(true);
                                                                }}
                                                            >
                                                                Ver más
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </>
                            ) : (
                                <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-400">
                                    No hay proyectos con evaluaciones para mostrar el ranking.
                                </div>
                            )}
                        </div>
                    </Card>
                )}
            </div>

            {/* Modal de detalles del proyecto */}
            <Modal
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                className="m-auto mx-5 lg:max-w-[50vw] max-h-[80vh]"
                scrollBehavior="inside"
            >
                <ModalContent className="rounded-2xl overflow-hidden">
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-3">
                                <div className="flex flex-wrap items-center gap-3">
                                    {(selectedProject?.projectCode || selectedProject?.eventNumber) && (
                                        <div className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-100 shadow-sm shadow-cyan-400/10">
                                            <span className="mr-1 text-cyan-200/80">Código:</span>
                                            <span>{selectedProject?.projectCode ?? selectedProject?.eventNumber}</span>
                                        </div>
                                    )}
                                    <h2 className="text-2xl font-bold">{selectedProject?.name}</h2>
                                </div>
                            </ModalHeader>

                            <ModalBody className="space-y-5 overflow-y-auto">
                                {/* Descripción */}
                                {selectedProject?.description && (
                                    <section className="space-y-2">
                                        <h2 className="font-medium bg-gradient-to-br from-white via-white/80 to-white bg-clip-text text-transparent inline-block">
                                            Descripción
                                        </h2>
                                        <p className="text-sm font-light">{selectedProject.description}</p>
                                    </section>
                                )}

                                {/* Integrantes */}
                                <section className="space-y-2">
                                    <ParticipantsDetails
                                        confirmedParticipants={selectedProject?.participants ?? []}
                                        pendingParticipants={selectedProject?.pendingParticipants ?? []}
                                    />
                                </section>

                                {/* Jurados */}
                                {(() => {
                                    const jurorList = getUniqueJurors(selectedProject?.jurors ?? []);
                                    if (jurorList.length === 0) return null;
                                    return (
                                        <section className="space-y-3">
                                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md sm:px-4">
                                                <div className="min-w-0">
                                                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Jurados</p>
                                                    <h3 className="text-sm font-semibold text-white">
                                                        {jurorList.length} jurado{jurorList.length === 1 ? '' : 's'}
                                                    </h3>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md">
                                                <table className="w-full">
                                                    <thead className="bg-white/5">
                                                        <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-white/60 border-b border-white/10">
                                                            <th className="px-4 py-3">Nombre</th>
                                                            <th className="px-4 py-3">Email</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {jurorList.map((juror: any, index: number) => {
                                                            const initials = `${juror.firstName?.[0] ?? ''}${juror.lastName?.[0] ?? ''}`.toUpperCase() || '?';
                                                            return (
                                                                <tr key={index} className={index !== jurorList.length - 1 ? 'border-b border-white/10' : ''}>
                                                                    <td className="px-4 py-3 align-top">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-400/10 text-xs font-semibold text-violet-300 ring-1 ring-violet-400/20">
                                                                                {initials}
                                                                            </div>
                                                                            <p className="font-medium text-white whitespace-nowrap">
                                                                                {juror.firstName} {juror.lastName}
                                                                            </p>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-3 align-top text-sm text-white/70">
                                                                        {juror.email ?? '—'}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </section>
                                    );
                                })()}

                                {/* Evaluación */}
                                {(() => {
                                    const stats = selectedProject?.id ? projectStatsById.get(String(selectedProject.id)) : null;
                                    if (!stats) return null;
                                    return (
                                        <section className="space-y-2">
                                            <h2 className="font-medium bg-gradient-to-br from-white via-white/80 to-white bg-clip-text text-transparent inline-block">
                                                Evaluación
                                            </h2>
                                            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 space-y-2 text-sm">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-white/60">Puntaje Promedio</span>
                                                    <span className="font-semibold text-white">{stats.averageGrade?.toFixed(2) ?? '—'}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-white/60">Evaluaciones Completadas</span>
                                                    <span className="font-semibold text-white">{stats.evaluationCount ?? 0}</span>
                                                </div>
                                            </div>
                                        </section>
                                    );
                                })()}
                            </ModalBody>

            <ModalFooter />
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Modal de proyectos del jurado */}
            <Modal
                isOpen={isJurorModalOpen}
                onOpenChange={setIsJurorModalOpen}
                className="m-auto mx-5 lg:max-w-[45vw] max-h-[75vh]"
                scrollBehavior="inside"
            >
                <ModalContent className="rounded-2xl overflow-hidden">
                    {() => (
                        <>
                            <ModalHeader className="flex flex-col gap-2">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-400/10 text-xs font-semibold text-violet-300 ring-1 ring-violet-400/20">
                                        {`${selectedJuror?.firstName?.[0] ?? ''}${selectedJuror?.lastName?.[0] ?? ''}`.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold leading-tight">
                                            {selectedJuror?.firstName} {selectedJuror?.lastName}
                                        </h2>
                                        <p className="text-xs text-white/60">{selectedJuror?.email ?? ''}</p>
                                    </div>
                                </div>
                            </ModalHeader>

                            <ModalBody className="space-y-4 overflow-y-auto pb-4">
                                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Proyectos Asignados</p>
                                        <h3 className="text-sm font-semibold text-white">
                                            {selectedJuror?.assignedProjects?.length ?? 0} proyecto{(selectedJuror?.assignedProjects?.length ?? 0) === 1 ? '' : 's'}
                                        </h3>
                                    </div>
                                </div>

                                {(selectedJuror?.assignedProjects ?? []).length > 0 ? (
                                    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md">
                                        <table className="w-full">
                                            <thead className="bg-white/5">
                                                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-white/60 border-b border-white/10">
                                                    <th className="px-4 py-3 whitespace-nowrap">Código</th>
                                                    <th className="px-4 py-3">Nombre</th>
                                                    <th className="px-4 py-3">Categoría</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(selectedJuror?.assignedProjects ?? []).map((project: any, index: number) => {
                                                    const category = categoryMap.get(project.courseId);
                                                    const categoryLabel = category?.code ?? category?.description ?? '—';
                                                    const code = project.projectCode ?? project.eventNumber ?? '—';
                                                    const isLast = index === (selectedJuror?.assignedProjects?.length ?? 0) - 1;
                                                    return (
                                                        <tr key={project.id} className={!isLast ? 'border-b border-white/10' : ''}>
                                                            <td className="px-4 py-3 align-top whitespace-nowrap">
                                                                <span className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-100">
                                                                    {code}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 align-top text-sm font-medium text-white">
                                                                {project.name}
                                                            </td>
                                                            <td className="px-4 py-3 align-top text-sm text-white/70 whitespace-nowrap">
                                                                {categoryLabel}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex min-h-[100px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-white/40">
                                        Sin proyectos asignados
                                    </div>
                                )}
                            </ModalBody>

                            <ModalFooter />
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Modal de configuración del ranking */}
            <RankingConfigModal
                isOpen={isRankingConfigOpen}
                onOpenChange={setIsRankingConfigOpen}
                config={rankingConfig}
                onConfigChange={setRankingConfig}
                eventId={event.id}
                rankingConfigId={rankingConfigId}
                onSaved={async () => {
                    await handleRefreshRanking();
                }}
            />
        </div>
    );
};

export default PastEventDashboard;
