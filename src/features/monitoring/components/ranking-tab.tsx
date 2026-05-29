'use client';

import { useEffect, useState } from 'react';
import { Download, Trophy, Eye, Settings, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { RankingConfigModal } from './ranking-config-modal';
import type { RankingConfigType } from '../types';
import { downloadEventRankingsReport, useEventRankings } from '../api/get-event-rankings';
import type { Event } from '@/types/api';
import { useRankingConfig } from '../api/get-ranking-config';

type RankingTabProps = {
  selectedEventId?: number;
  selectedCategoryId?: number;
  selectedEventName?: string;
  eventId?: number;
  categoryId?: number;
  event?: Event;
};

export const RankingTab = ({ selectedEventName, eventId, categoryId, event }: RankingTabProps) => {
  const [isRankingConfigOpen, setIsRankingConfigOpen] = useState(false);
  const [rankingConfigId, setRankingConfigId] = useState<number | undefined>(undefined);
  const [rankingTableVersion, setRankingTableVersion] = useState(0);
  const [rankingConfig, setRankingConfig] = useState<RankingConfigType>({
    visiblePositions: 0,
    visibleInLanding: false,
    visibleScore: true,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const rankingQuery = useEventRankings({
    eventId,
    categoryId,
    queryConfig: { enabled: Boolean(eventId) },
  });
  const rankingConfigQuery = useRankingConfig({
    eventId,
    queryConfig: { enabled: Boolean(eventId) },
  });

  const isLoading = rankingQuery.isLoading;
  const rankingRows = rankingQuery.data?.data ?? [];
  const effectiveRankingConfig = rankingConfigQuery.data?.data ?? event?.rankingConfig ?? null;
  const visiblePositions = effectiveRankingConfig?.visiblePositions ?? effectiveRankingConfig?.positions ?? 0;
  const showRankingScore = rankingConfig.visibleScore;

  useEffect(() => {
    const existingRankingConfig = event?.rankingConfig;
    const fetchedRankingConfig = rankingConfigQuery.data?.data;

    setRankingConfigId(
      typeof event?.rankingConfigId === 'number'
        ? event.rankingConfigId
        : typeof existingRankingConfig?.id === 'number'
          ? existingRankingConfig.id
          : typeof fetchedRankingConfig?.id === 'number'
            ? fetchedRankingConfig.id
          : undefined,
    );

    setRankingConfig({
      visiblePositions:
        existingRankingConfig?.visiblePositions ?? existingRankingConfig?.positions ?? 0,
      visibleInLanding:
        existingRankingConfig?.visibleInLanding ?? fetchedRankingConfig?.visibleInLanding ?? false,
      visibleScore:
        existingRankingConfig?.visibleScore ?? fetchedRankingConfig?.visibleScore ?? true,
    });
  }, [eventId, event, rankingConfigQuery.data]);

  const visibleRankingRows = rankingRows.filter((entry) => {
    if (!visiblePositions || visiblePositions <= 0) {
      return true;
    }

    return Number(entry.position) <= visiblePositions;
  });

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const { blob, fileName } = await downloadEventRankingsReport({ eventId, categoryId });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'No se pudo descargar el reporte');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRefresh = async () => {
    if (!eventId) {
      return;
    }

    setIsRefreshing(true);

    try {
      const [rankingResult, configResult] = await Promise.all([
        rankingQuery.refetch(),
        rankingConfigQuery.refetch(),
      ]);

      const refreshedConfig = configResult.data?.data;
      const fallbackConfig = event?.rankingConfig;

      setRankingConfigId(
        typeof refreshedConfig?.id === 'number'
          ? refreshedConfig.id
          : typeof fallbackConfig?.id === 'number'
            ? fallbackConfig.id
            : typeof event?.rankingConfigId === 'number'
              ? event.rankingConfigId
              : undefined,
      );

      setRankingConfig({
        visiblePositions:
          refreshedConfig?.visiblePositions ??
          refreshedConfig?.positions ??
          fallbackConfig?.visiblePositions ??
          fallbackConfig?.positions ??
          0,
        visibleInLanding:
          refreshedConfig?.visibleInLanding ?? fallbackConfig?.visibleInLanding ?? false,
        visibleScore:
          refreshedConfig?.visibleScore ?? fallbackConfig?.visibleScore ?? true,
      });

      setRankingTableVersion((value) => value + 1);

      if (rankingResult.data?.data) {
        setDownloadError(null);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenRankingConfig = async () => {
    let fetchedConfig = undefined as any;
    if (eventId) {
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
          <div className="flex flex-wrap items-center gap-2">
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
              onPress={handleRefresh}
              isDisabled={isLoading || isRefreshing || !eventId}
            >
              <RefreshCw className={isRefreshing ? 'h-5 w-5 animate-spin' : 'h-5 w-5'} />
              {isRefreshing ? 'Actualizando…' : 'Refrescar'}
            </Button>
            <Button
              className="relative gap-2 border-2 border-default-300 hover:border-primary text-default-600 hover:text-primary hover:scale-105 transition-all duration-300 font-semibold px-4 py-2"
              variant="bordered"
              onPress={handleDownload}
              isDisabled={isLoading || isDownloading || !eventId}
            >
              <Download className="h-5 w-5" />
              {isDownloading ? 'Descargando…' : 'Descargar reporte'}
            </Button>
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
          ) : (
            visibleRankingRows.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-default-200 bg-default-50 px-3 py-1 text-xs font-medium text-default-600">
                    Posiciones visibles: {visiblePositions > 0 ? visiblePositions : 'Todas'}
                  </span>
                  <span className="rounded-full border border-default-200 bg-default-50 px-3 py-1 text-xs font-medium text-default-600">
                    Puntaje {showRankingScore ? 'visible' : 'oculto'}
                  </span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-default-200/80">
                  <Table key={rankingTableVersion} aria-label="Ranking de proyectos" selectionMode="none">
                    <TableHeader>
                      <TableColumn className="w-20">Posición</TableColumn>
                      <TableColumn className="w-36">Código</TableColumn>
                      <TableColumn>Proyecto</TableColumn>
                      <TableColumn>Categoría</TableColumn>
                      <TableColumn>Integrantes</TableColumn>
                      <TableColumn className="w-32 text-center">Puntaje</TableColumn>
                    </TableHeader>
                    <TableBody items={visibleRankingRows}>
                      {(entry) => (
                        <TableRow key={`${entry.projectId ?? entry.projectCode ?? entry.projectName}-${entry.position}-${entry.category ?? 'all'}`}>
                          <TableCell className="w-20">{entry.position}</TableCell>
                          <TableCell className="w-36 whitespace-nowrap">
                            <p className="font-medium text-default-700">{entry.projectCode ?? '—'}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium leading-snug text-foreground md:text-base">
                              {entry.projectName}
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-default-500">{entry.category ?? '—'}</p>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-xs leading-tight md:text-sm">
                              {entry.participants.length > 0 ? (
                                entry.participants.map((label, index) => (
                                  <p key={`${label}-${index}`} className="text-xs text-default-500 md:text-sm">
                                    {label}
                                  </p>
                                ))
                              ) : (
                                <p className="text-xs text-default-400 md:text-sm">Sin integrantes</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="w-32 text-center">
                            <span className={showRankingScore ? 'text-base font-bold text-foreground' : 'text-base text-default-400'}>
                              {showRankingScore
                                ? entry.averageGrade !== undefined
                                  ? entry.averageGrade.toFixed(2)
                                  : '—'
                                : 'Oculto'}
                            </span>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-500">
                No hay proyectos con evaluaciones para mostrar el ranking.
              </div>
            )
          )}
          {downloadError && <p className="text-sm text-danger-500">{downloadError}</p>}
        </CardBody>
      </Card>

      {/* Modal de configuración del ranking */}
      <RankingConfigModal
        isOpen={isRankingConfigOpen}
        onOpenChange={setIsRankingConfigOpen}
        config={rankingConfig}
        onConfigChange={setRankingConfig}
        eventId={eventId}
        rankingConfigId={rankingConfigId}
        onSaved={async () => {
          await handleRefresh();
        }}
      />
    </div>
  );
};
