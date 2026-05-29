'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trophy, GripVertical, AlertTriangle } from 'lucide-react';
import { Chip } from '@/components/ui/chip';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Select, SelectItem } from '@/components/ui/select/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { useNotifications } from '@/components/ui/notifications';
import {
  getTopProjects,
  createTiebreak,
  updateTiebreak,
  listTiebreaks,
  type TopProject,
  type TiebreakRecord,
  type TopProjectsResponse,
} from '@/features/tiebreaks/api/tiebreaks';

// --- Sortable drag item ---

function SortableItem({ project, index }: { project: TopProject; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex items-center gap-3 rounded-xl border border-default-200/70 bg-default-50/50 px-4 py-3 touch-none"
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="cursor-grab active:cursor-grabbing text-default-400 hover:text-default-600 shrink-0"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <span className="text-sm font-bold text-default-400 w-5 shrink-0">{index + 1}</span>
      <p className="flex-1 font-semibold text-foreground">{project.name}</p>
      <span className="text-sm font-semibold text-teal-500 shrink-0">
        {project.averageGrade.toFixed(2)}
      </span>
    </div>
  );
}

// --- Helpers ---

function buildTiedPool(data: TopProjectsResponse): TopProject[] {
  if (!data.items?.length) return [];

  const lastGrade = data.items[data.items.length - 1].averageGrade;
  const tiedFromItems = data.items.filter((p) => p.averageGrade === lastGrade);

  const hasTiebreaks = Boolean(data.tiebreaks?.length);
  const hasDisputed = Boolean(data.disputedProjects?.length);
  // Empate DENTRO de los n seleccionados: 2+ proyectos comparten la última posición
  const hasTieWithinItems = tiedFromItems.length > 1;

  if (!hasTiebreaks && !hasDisputed && !hasTieWithinItems) return [];

  if (hasTiebreaks) {
    const itemsMap = new Map(data.items.map((p) => [p.id, p]));
    const disputedMap = new Map((data.disputedProjects ?? []).map((p) => [p.id, p]));
    return (data.tiebreaks ?? []).map(
      (tb) =>
        itemsMap.get(tb.projectId) ??
        disputedMap.get(tb.projectId) ?? {
          id: tb.projectId,
          name: `Proyecto ${tb.projectId}`,
          averageGrade: lastGrade,
          evaluationCount: 0,
          participants: [],
        },
    );
  }

  // Caso 2: empate dentro del top-n Y/O con disputedProjects fuera del límite
  return [...tiedFromItems, ...(data.disputedProjects ?? [])];
}

function sortPoolByTiebreaks(pool: TopProject[], tiebreaks: TiebreakRecord[]): TopProject[] {
  const tiebreakMap: Record<number, number> = {};
  tiebreaks.forEach((tb) => {
    tiebreakMap[tb.projectId] = tb.tiebreakOrder;
  });
  return [...pool].sort((a, b) => {
    const orderA = tiebreakMap[a.id] ?? Infinity;
    const orderB = tiebreakMap[b.id] ?? Infinity;
    return orderA - orderB;
  });
}

function participantLabel(p: {
  firstName?: string;
  lastName?: string;
  studentCode?: string;
  email?: string;
  name?: string;
  userId?: number | string;
}): string {
  if (p.name) return p.name;
  const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ');
  if (fullName) return fullName;
  if (p.studentCode) return `Código ${p.studentCode}`;
  if (p.email) return p.email;
  if (p.userId) return `ID ${p.userId}`;
  return 'Participante';
}

// --- Main Component ---

const TOP_N_OPTIONS = [3, 5, 10] as const;
type TopN = (typeof TOP_N_OPTIONS)[number];

type RankingTabProps = {
  selectedEventId?: number;
  selectedCategoryId?: number;
  selectedEventName?: string;
  evaluationsOpened?: boolean;
  eventStatusName?: string;
};

export const RankingTab = ({
  selectedEventId,
  selectedCategoryId,
  selectedEventName,
  evaluationsOpened,
  eventStatusName,
}: RankingTabProps) => {
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();

  const [topN, setTopN] = useState<TopN>(10);
  const [orderedPool, setOrderedPool] = useState<TopProject[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canFetch = Boolean(selectedEventId && selectedCategoryId);

  const queryKey = ['top-projects', selectedEventId, selectedCategoryId, topN] as const;

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => getTopProjects(selectedCategoryId!, selectedEventId!, topN),
    enabled: canFetch,
  });

  const evaluationsClosed = evaluationsOpened === false;
  const eventFinished = eventStatusName === 'FINISHED';
  const canResolveTiebreak = evaluationsClosed || eventFinished;

  const hasTiebreaks = Boolean(data?.tiebreaks?.length);
  const hasDisputed = Boolean(data?.disputedProjects?.length);

  // Proyectos del pool de empate dentro de los n seleccionados
  const lastGrade = data?.items?.at(-1)?.averageGrade;
  const tiedItemsAtLastPos = (data?.items ?? []).filter(
    (p) => p.averageGrade === lastGrade,
  );
  const hasTieWithinItems = tiedItemsAtLastPos.length > 1;

  const hasTieConflict = hasTiebreaks || hasDisputed || hasTieWithinItems;

  // IDs a marcar con badge "Empate"
  const disputedIds = new Set<number>([
    // Proyectos dentro del top-n empatados en última posición
    ...(hasTieWithinItems || hasTiebreaks ? tiedItemsAtLastPos.map((p) => p.id) : []),
    // Proyectos fuera del top-n que también empatan con la última posición
    ...(data?.disputedProjects?.map((p) => p.id) ?? []),
    // Si hay tiebreaks previos, marcar también los involucrados
    ...(hasTiebreaks ? (data?.tiebreaks ?? []).map((tb) => tb.projectId) : []),
  ]);

  // Sync pool when data changes
  useEffect(() => {
    if (!data) {
      setOrderedPool([]);
      setIsDirty(false);
      return;
    }
    const pool = buildTiedPool(data);
    const sorted =
      hasTiebreaks && data.tiebreaks ? sortPoolByTiebreaks(pool, data.tiebreaks) : pool;
    setOrderedPool(sorted);
    setIsDirty(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrderedPool((prev) => {
      const from = prev.findIndex((p) => p.id === active.id);
      const to = prev.findIndex((p) => p.id === over.id);
      return arrayMove(prev, from, to);
    });
    setIsDirty(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedEventId || !selectedCategoryId) return;
    setIsSubmitting(true);

    try {
      if (hasTiebreaks && data?.tiebreaks) {
        // Case 3 — update existing tiebreaks via PUT
        const tiebreakIdMap = new Map(data.tiebreaks.map((tb) => [tb.projectId, tb.id]));
        await Promise.all(
          orderedPool.map((project, index) => {
            const tbId = tiebreakIdMap.get(project.id);
            if (tbId === undefined) return Promise.resolve();
            return updateTiebreak(tbId, {
              tiebreakOrder: index + 1,
              projectId: project.id,
              categoryId: selectedCategoryId,
            });
          }),
        );
      } else {
        // Case 2 — create new tiebreaks via POST, fallback to PUT on 409
        const results = await Promise.all(
          orderedPool.map((project, index) =>
            createTiebreak({
              projectId: project.id,
              eventId: selectedEventId,
              categoryId: selectedCategoryId,
              tiebreakOrder: index + 1,
            }),
          ),
        );

        const has409 = results.some((r) => r.status === 409);
        if (has409) {
          const existing = await listTiebreaks({
            eventId: selectedEventId,
            categoryId: selectedCategoryId,
          });
          const existingIdMap = new Map(existing.map((tb) => [tb.projectId, tb.id]));
          await Promise.all(
            orderedPool.map((project, index) => {
              const tbId = existingIdMap.get(project.id);
              if (tbId === undefined) return Promise.resolve();
              return updateTiebreak(tbId, {
                tiebreakOrder: index + 1,
                projectId: project.id,
                categoryId: selectedCategoryId,
              });
            }),
          );
        }
      }

      addNotification({
        type: 'success',
        title: '¡Desempate guardado!',
        message: 'El orden de desempate fue confirmado correctamente.',
      });

      await queryClient.invalidateQueries({ queryKey: [...queryKey] });
      setIsDirty(false);
    } catch {
      addNotification({
        type: 'error',
        title: 'Error al guardar',
        message: 'No se pudo guardar el desempate. Intenta nuevamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedEventId,
    selectedCategoryId,
    hasTiebreaks,
    data,
    orderedPool,
    addNotification,
    queryClient,
    queryKey,
  ]);

  return (
    <div className="space-y-4">
      <Card className="glass-card border border-default-200/70 shadow-sm">
        <CardHeader className="pb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-amber-500 shrink-0" />
            <div>
              <h3 className="text-lg font-semibold">RANKING</h3>
              <p className="text-sm text-default-400">{selectedEventName ?? '—'}</p>
            </div>
          </div>

          <div className="w-full sm:w-44">
            <Select
              label="Mostrar"
              selectedKeys={[String(topN)]}
              onSelectionChange={(keys) => {
                const val = Number(Array.from(keys)[0]) as TopN;
                if (TOP_N_OPTIONS.includes(val)) setTopN(val);
              }}
              isDisabled={!canFetch}
              size="sm"
            >
              {TOP_N_OPTIONS.map((n) => (
                <SelectItem key={String(n)} textValue={`Top ${n}`}>
                  Top {n}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardHeader>

        <CardBody className="space-y-4 p-5 md:p-6">
          {/* IDLE — no event/category selected */}
          {!canFetch && (
            <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-500">
              Selecciona un evento y una categoría para ver el ranking.
            </div>
          )}

          {/* LOADING */}
          {canFetch && isLoading && (
            <div className="flex min-h-[180px] items-center justify-center">
              <Spinner size="lg" />
            </div>
          )}

          {/* ERROR */}
          {canFetch && isError && !isLoading && (
            <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-danger-200 text-sm text-danger-500">
              No se pudo cargar el ranking. Intenta nuevamente.
            </div>
          )}

          {/* NO DATA */}
          {canFetch && !isLoading && !isError && data && !data.items?.length && (
            <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-500">
              No hay proyectos evaluados para mostrar el ranking.
            </div>
          )}

          {/* RANKING TABLE */}
          {canFetch && !isLoading && !isError && Boolean(data?.items?.length) && (
            <div className="overflow-hidden rounded-2xl border border-default-200/80">
              <Table aria-label="Ranking de proyectos" selectionMode="none">
                <TableHeader>
                  <TableColumn className="w-16">Pos.</TableColumn>
                  <TableColumn>Proyecto</TableColumn>
                  <TableColumn>Integrantes</TableColumn>
                  <TableColumn className="w-28 text-center">Promedio</TableColumn>
                  <TableColumn className="w-28 text-center">Evaluaciones</TableColumn>
                  <TableColumn className="w-24 text-center">Estado</TableColumn>
                </TableHeader>
                <TableBody items={(data?.items ?? []).map((p, i) => ({ ...p, participants: p.participants ?? [], pos: i + 1 }))}>
                  {(item) => (
                    <TableRow key={item.id}>
                      <TableCell className="w-16">
                        <span className="font-bold text-default-500">{item.pos}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-foreground">{item.name}</span>
                          {disputedIds.has(item.id) && (
                            <Chip
                              size="sm"
                              color="warning"
                              variant="flat"
                              startContent={<AlertTriangle className="h-3 w-3" />}
                            >
                              Empate
                            </Chip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {(item.participants?.length ?? 0) > 0 ? (
                            item.participants!.map((p, idx) => (
                              <p key={idx} className="text-default-500">
                                {participantLabel(p)}
                              </p>
                            ))
                          ) : (
                            <p className="text-default-400">Sin integrantes</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="w-28 text-center">
                        <span className="text-lg font-semibold text-teal-500">
                          {item.averageGrade.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="w-28 text-center">
                        <span className="text-sm text-default-500">{item.evaluationCount}</span>
                      </TableCell>
                      <TableCell className="w-24 text-center">
                        <Chip size="sm" color="success" variant="flat">
                          OK
                        </Chip>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* TIEBREAK — read-only notice */}
          {canFetch && !isLoading && !canResolveTiebreak && hasTieConflict && (
            <div className="flex items-center gap-3 rounded-xl border border-warning-200/60 bg-warning-50/20 px-4 py-3 text-sm text-default-500">
              <AlertTriangle className="h-4 w-4 text-warning-400 shrink-0" />
              Se detectó un empate. La resolución estará disponible cuando las evaluaciones estén
              cerradas o el evento haya finalizado.
            </div>
          )}

          {/* TIEBREAK — drag & drop resolver */}
          {canFetch && !isLoading && canResolveTiebreak && hasTieConflict && (
            <div className="space-y-4 rounded-2xl border border-warning-200/60 bg-warning-50/10 p-5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning-500 shrink-0" />
                <h4 className="font-semibold text-warning-600">
                  Empate detectado — Define el orden manualmente
                </h4>
              </div>
              <p className="text-sm text-default-500">
                Los siguientes proyectos tienen el mismo puntaje. Arrastra para definir el orden
                final de desempate.
              </p>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={orderedPool.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {orderedPool.map((project, index) => (
                      <SortableItem key={project.id} project={project} index={index} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="flex justify-end pt-1">
                <Button
                  color="primary"
                  isDisabled={!isDirty || isSubmitting}
                  isLoading={isSubmitting}
                  onPress={handleSubmit}
                >
                  {hasTiebreaks ? 'Actualizar desempate' : 'Confirmar desempate'}
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
