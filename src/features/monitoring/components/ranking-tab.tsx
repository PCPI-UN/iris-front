'use client';

import { useState } from 'react';
import { Trophy, Eye, Settings } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { ProjectWithJurors } from '@/features/projects/api/get-projects-with-jurors';
import type { ProjectEvaluationStats } from '@/features/evaluations/api/get-project-evaluation-stats';
import { RankingConfigModal, type RankingConfigType } from './ranking-config-modal';

type RankingTabProps = {
  selectedEventName?: string;
  isLoading: boolean;
  allProjects: ProjectWithJurors[];
  allProjectStatsById: Map<string, ProjectEvaluationStats | undefined>;
};

export const RankingTab = ({ selectedEventName, isLoading, allProjects, allProjectStatsById }: RankingTabProps) => {
  const [isRankingConfigOpen, setIsRankingConfigOpen] = useState(false);
  const [rankingConfig, setRankingConfig] = useState<RankingConfigType>({
    visiblePositions: 0,
    visibleInLanding: false,
    visibleScore: true,
  });
  return (
    <div className="space-y-4">
      <Card className="glass-card border border-default-200/70 shadow-sm">
        <CardHeader className="pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <Trophy className="mr-2 h-8 w-8 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">RANKING TOP 5</h3>
              <p className="text-sm text-default-400">{selectedEventName ?? '—'}</p>
            </div>
          </div>
          <Button
            className="relative gap-2 border-2 border-default-300 hover:border-primary text-default-600 hover:text-primary hover:scale-105 transition-all duration-300 font-semibold px-4 py-2"
            variant="bordered"
            onPress={() => setIsRankingConfigOpen(true)}
          >
            <Eye className="h-5 w-5" />
            <Settings className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardBody className="space-y-4 p-5 md:p-6">
          {isLoading ? (
            <div className="flex min-h-[180px] items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            (() => {
              const topProjects = allProjects
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
                .map((entry, index) => ({ ...entry, position: index + 1 }));

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
                                  .map((participant) => `${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim())
                                  .filter((label) => label.length > 0);

                                const participantLabels = pendingLabels.length > 0
                                  ? pendingLabels
                                  : (entry.project.participants ?? []).map((participant) => {
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
                                  participantLabels.map((label, index) => <p key={index} className="text-sm text-default-500">{label}</p>)
                                ) : (
                                  <p className="text-sm text-default-400">Sin integrantes</p>
                                );
                              })()}
                            </div>
                          </TableCell>
                          <TableCell className="w-32">
                            <div className="flex h-full flex-col items-center justify-center">
                              <p className="text-lg font-semibold">
                                {entry.stats?.averageGrade !== undefined ? entry.stats.averageGrade.toFixed(2) : '—'}
                              </p>
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

      {/* Modal de configuración del ranking */}
      <RankingConfigModal
        isOpen={isRankingConfigOpen}
        onOpenChange={setIsRankingConfigOpen}
        config={rankingConfig}
        onConfigChange={setRankingConfig}
      />
    </div>
  );
};