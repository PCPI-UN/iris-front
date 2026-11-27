"use client";

import { useQuery } from "@tanstack/react-query";
import { Trophy, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Select, SelectItem } from "@/components/ui/select/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useEventRankings } from "../api/get-event-rankings";
import { getTopProjects, type TopProject } from "../api/get-top-projects";
import { filterByTopPositions, getCoWinnerPositions } from "../utils/co-winners";

function participantLabel(p: {
  firstName?: string;
  lastName?: string;
  studentCode?: string;
  email?: string;
  name?: string;
  userId?: number | string;
}): string {
  if (p.name) return p.name;
  const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ");
  if (fullName) return fullName;
  if (p.studentCode) return `Código ${p.studentCode}`;
  if (p.email) return p.email;
  if (p.userId) return `ID ${p.userId}`;
  return "Participante";
}

function topProjectParticipantNames(item: TopProject): string[] {
  if ((item.pendingParticipants?.length ?? 0) > 0) {
    return item.pendingParticipants!.map((p) => {
      const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ");
      return fullName || p.studentCode || p.email || "Participante";
    });
  }

  return (item.participants ?? []).map(participantLabel);
}

type RankingDisplayRow = {
  key: string;
  position: number;
  name: string;
  category?: string;
  participants: string[];
  averageGrade?: number;
  evaluationCount: number;
};

const TOP_N_OPTIONS = [2, 3, 5] as const;
type TopN = (typeof TOP_N_OPTIONS)[number];

type RankingTabProps = {
  selectedEventId?: number;
  selectedCategoryId?: number;
  selectedEventName?: string;
  evaluationsOpened?: boolean;
  eventStatusName?: string;
  eventEndDate?: string;
};

/**
 * Ranking of a category or global ranking of an event (when "Todas las categorías"
 * is selected). Positions come from the backend: projects with the same average
 * (rounded to 2 decimals) are co-winners and share the position.
 * There is no tie-break (decision of the 27 Oct meeting).
 */
export const RankingTab = ({
  selectedEventId,
  selectedCategoryId,
  selectedEventName,
}: RankingTabProps) => {
  const [topN, setTopN] = useState<TopN>(5);

  const hasEvent = Boolean(selectedEventId);
  const isCategoryRanking = Boolean(selectedEventId && selectedCategoryId);
  const isGlobalRanking = Boolean(selectedEventId && !selectedCategoryId);
  const canFetch = hasEvent;

  const categoryRankingQuery = useQuery({
    queryKey: ["top-projects", selectedEventId, selectedCategoryId, topN],
    // `limit` is the number of positions; the backend keeps every co-winner
    queryFn: () => getTopProjects(selectedCategoryId!, selectedEventId!, topN),
    enabled: isCategoryRanking,
  });

  // Global ranking across all categories uses GET /events/:eventId/rankings?format=json
  const globalRankingQuery = useEventRankings({
    eventId: selectedEventId,
    queryConfig: { enabled: isGlobalRanking },
  });

  const isLoading = isGlobalRanking
    ? globalRankingQuery.isLoading
    : categoryRankingQuery.isLoading;
  const isError = isGlobalRanking
    ? globalRankingQuery.isError
    : categoryRankingQuery.isError;
  const hasData = isGlobalRanking
    ? Boolean(globalRankingQuery.data)
    : Boolean(categoryRankingQuery.data);

  const items = useMemo<RankingDisplayRow[]>(() => {
    if (isGlobalRanking) {
      const globalRows = filterByTopPositions(
        globalRankingQuery.data?.data ?? [],
        topN,
      );

      return globalRows.map((row, index) => ({
        key: String(row.projectId ?? `${row.position}-${index}`),
        position: row.position,
        name: row.projectName,
        category: row.category,
        participants: row.participants ?? [],
        averageGrade: row.averageGrade,
        evaluationCount: row.evaluationCount,
      }));
    }

    return (categoryRankingQuery.data?.items ?? []).map((item) => ({
      key: String(item.id),
      position: item.position,
      name: item.name,
      participants: topProjectParticipantNames(item),
      averageGrade: item.averageGrade,
      evaluationCount: item.evaluationCount,
    }));
  }, [
    categoryRankingQuery.data?.items,
    globalRankingQuery.data?.data,
    isGlobalRanking,
    topN,
  ]);

  const coWinnerPositions = useMemo(
    () => getCoWinnerPositions(items),
    [items],
  );

  const headerSubtitle = useMemo(() => {
    if (isGlobalRanking) {
      return (
        [selectedEventName, "Clasificación global"]
          .filter(Boolean)
          .join(" · ") || "Clasificación global"
      );
    }

    return selectedEventName ?? "—";
  }, [isGlobalRanking, selectedEventName]);

  return (
    <div className="space-y-4">
      <Card className="glass-card border border-default-200/70 shadow-sm">
        <CardHeader className="pb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-amber-500 shrink-0" />
            <div>
              <h3 className="text-lg font-semibold">CLASIFICACIÓN</h3>
              <p className="text-sm text-default-400">{headerSubtitle}</p>
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
          {/* IDLE — no event selected */}
          {!canFetch && (
            <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-500">
              Selecciona un evento para ver la clasificación.
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
              No se pudo cargar la clasificación. Intenta nuevamente.
            </div>
          )}

          {/* NO DATA */}
          {canFetch && !isLoading && !isError && hasData && items.length === 0 && (
            <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-500">
              No hay proyectos evaluados para mostrar la clasificación.
            </div>
          )}

          {/* RANKING TABLE */}
          {canFetch && !isLoading && !isError && items.length > 0 && (
            <>
              <div className="overflow-hidden rounded-2xl border border-default-200/80">
                <Table aria-label="Clasificación de proyectos" selectionMode="none">
                  <TableHeader>
                    <TableColumn className="w-16">Pos.</TableColumn>
                    <TableColumn>Proyecto</TableColumn>
                    <TableColumn>Integrantes</TableColumn>
                    <TableColumn className="w-28 text-center">
                      Promedio
                    </TableColumn>
                    <TableColumn className="w-28 text-center">
                      Evaluaciones
                    </TableColumn>
                    <TableColumn className="w-28 text-center">
                      Estado
                    </TableColumn>
                  </TableHeader>
                  <TableBody items={items}>
                    {(item) => (
                      <TableRow key={item.key}>
                        <TableCell className="w-16">
                          <span className="font-bold text-default-500">
                            {item.position}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="font-semibold text-foreground">
                              {item.name}
                            </span>
                            {isGlobalRanking && item.category && (
                              <p className="text-xs text-default-400">
                                {item.category}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {item.participants.length > 0 ? (
                              item.participants.map((name, idx) => (
                                <p key={idx} className="text-default-500">
                                  {name}
                                </p>
                              ))
                            ) : (
                              <p className="text-default-400">
                                Sin integrantes
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="w-28 text-center">
                          <span className="text-lg font-semibold text-teal-500">
                            {typeof item.averageGrade === "number"
                              ? item.averageGrade.toFixed(2)
                              : "—"}
                          </span>
                        </TableCell>
                        <TableCell className="w-28 text-center">
                          <span className="text-sm text-default-500">
                            {item.evaluationCount}
                          </span>
                        </TableCell>
                        <TableCell className="w-28 text-center">
                          {coWinnerPositions.has(item.position) ? (
                            <Chip
                              size="sm"
                              color="warning"
                              variant="flat"
                              startContent={<Users className="h-3 w-3" />}
                            >
                              Coganador
                            </Chip>
                          ) : (
                            <span className="text-default-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {coWinnerPositions.size > 0 && (
                <p className="text-sm text-default-500">
                  Los proyectos con el mismo promedio (redondeado a 2 decimales)
                  son coganadores y comparten la posición. Por eso puede haber
                  más filas que el top elegido.
                </p>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
