'use client';

import { useMemo, useState } from 'react';
import { Calendar, Users, Award, Folder } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Select, SelectItem } from '@/components/ui/select/select';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge/status-badge';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// local tabs: Statistics | Projects | Jurors | Ranking
import { useProjectsWithJurors } from '@/features/projects/api/get-projects-with-jurors';
import { useCategoriesDropdown } from '@/features/courses/api/get-categories-dropdown';
import { getUniqueJurors, getJurorKey } from '@/features/monitoring/utils/calculations';
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

    const projectsQuery = useProjectsWithJurors({ currentPage: 1, itemsPerPage: 10000, eventId: event.id, courseId: selectedCategoryId, queryConfig: { enabled: Boolean(event.id) } });
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
            const categoryId = project.courseId;
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
                    <p className="mt-1 text-sm text-default-500 line-clamp-2">{event.description}</p>
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
                        </div>

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

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
                    <div className="space-y-3">
                        {projects.map((project) => {
                            const category = categoryMap.get(project.courseId);
                            const participants = getUniqueParticipants([...(project.participants ?? []), ...(project.pendingParticipants ?? [])]);

                            return (
                                <Card key={String(project.id)} className="glass-card">
                                    <CardHeader className="flex items-center justify-between gap-4 p-3">
                                        <div className="min-w-0 space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="text-sm font-semibold text-foreground">{project.name}</div>
                                                <StatusBadge state={project.state} />
                                            </div>
                                            <div className="line-clamp-2 text-xs text-default-400">{project.description ?? 'Sin descripción'}</div>
                                            <div className="text-xs text-default-400">{category?.code ?? `Categoría ${project.courseId}`}</div>
                                        </div>

                                        <div className="text-right text-sm text-default-500">
                                            <div>{participants.length} participantes</div>
                                            <div>{getUniqueJurors(project.jurors ?? []).length} jurados</div>
                                        </div>
                                    </CardHeader>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'jurors' && (
                    <div className="space-y-2">
                        {jurors.map((juror: any) => (
                            <Card key={getJurorKey(juror)} className="glass-card">
                                <CardHeader className="flex items-center justify-between gap-4 p-3">
                                    <div>
                                        <div className="text-sm font-semibold text-foreground">{juror.firstName} {juror.lastName}</div>
                                        <div className="text-xs text-default-400">{juror.email}</div>
                                    </div>
                                    <div className="text-sm text-default-400">ID: {juror.id ?? '—'}</div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}

                {activeTab === 'ranking' && (
                    <div className="space-y-4">
                        {Array.from(
                            projects.reduce((acc, project) => {
                                const list = acc.get(project.courseId) ?? [];
                                list.push(project);
                                acc.set(project.courseId, list);
                                return acc;
                            }, new Map<number, typeof projects>()),
                        ).map(([courseId, courseProjects]) => {
                            const category = categoryMap.get(courseId);
                            const label = category?.code ?? category?.description ?? `Categoría ${courseId}`;
                            const sorted = [...courseProjects].sort(
                                (a, b) => getUniqueJurors(b.jurors ?? []).length - getUniqueJurors(a.jurors ?? []).length,
                            );

                            return (
                                <div key={String(courseId)} className="space-y-2">
                                    <h4 className="text-sm font-semibold text-foreground">{label}</h4>
                                    {sorted.map((project, index) => (
                                        <Card key={String(project.id)} className="glass-card">
                                            <CardHeader className="flex items-center justify-between gap-4 p-3">
                                                <div>
                                                    <div className="text-sm font-semibold text-foreground">{index + 1}. {project.name}</div>
                                                    <div className="text-xs text-default-400">
                                                        {(project.participants ?? []).length + (project.pendingParticipants ?? []).length} participantes
                                                    </div>
                                                </div>
                                                <div className="text-sm font-bold text-default-700">{getUniqueJurors(project.jurors ?? []).length} jurados</div>
                                            </CardHeader>
                                        </Card>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PastEventDashboard;
