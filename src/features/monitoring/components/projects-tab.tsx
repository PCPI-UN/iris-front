'use client';

import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@/components/ui/table';
import type { ProjectWithJurors } from '@/features/projects/api/get-projects-with-jurors';
import type { ProjectEvaluationProgress, SortOrder } from '../types';

type ProjectsTabProps = {
  projectSearch: string;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  onProjectSearchChange: (value: string) => void;
  filteredProjectsLength: number;
  currentPage: number;
  totalProjectPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  sortedProjects: ProjectWithJurors[];
  getEvaluationProgress: (project: ProjectWithJurors) => ProjectEvaluationProgress;
};

export const ProjectsTab = ({
  projectSearch,
  sortOrder,
  onSortOrderChange,
  onProjectSearchChange,
  filteredProjectsLength,
  currentPage,
  totalProjectPages,
  onPageChange,
  isLoading,
  sortedProjects,
  getEvaluationProgress,
}: ProjectsTabProps) => {
  return (
    <Card className="glass-card border border-default-200/70 shadow-sm">
      <CardBody className="space-y-4 p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Input
            isClearable
            className="h-10 w-full lg:max-w-xl"
            placeholder="Buscar por nombre, código de proyecto, participante o jurado…"
            startContent={<Search className="h-4 w-4 text-default-400" />}
            value={projectSearch}
            onClear={() => onProjectSearchChange('')}
            onValueChange={onProjectSearchChange}
          />

          <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center lg:gap-4">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={sortOrder === 'desc' ? 'flat' : 'bordered'}
                onPress={() => onSortOrderChange('desc')}
                className={`${sortOrder === 'desc' ? 'bg-foreground text-background' : ''} h-9 px-3`}
              >
                Mayor → Menor
              </Button>
              <Button
                size="sm"
                variant={sortOrder === 'asc' ? 'flat' : 'bordered'}
                onPress={() => onSortOrderChange('asc')}
                className={`${sortOrder === 'asc' ? 'bg-foreground text-background' : ''} h-9 px-3`}
              >
                Menor → Mayor
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-default-500">
          <span>{filteredProjectsLength} proyectos visibles</span>
          <span>
            Ordenado por evaluación: {sortOrder === 'desc' ? 'Mayor a menor' : 'Menor a mayor'}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-default-200/80">
          <Table
            aria-label="Evaluación de proyectos"
            classNames={{ wrapper: 'rounded-none shadow-none' }}
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
                  onChange={onPageChange}
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
              emptyContent={isLoading ? undefined : 'No hay proyectos que coincidan con el filtro.'}
              items={isLoading ? [] : sortedProjects}
            >
              {isLoading ? (
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
                      <p className="font-semibold text-foreground">{project.name}</p>
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
                            <p className="text-xs text-default-400">Sin integrantes</p>
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
                              <span className="whitespace-nowrap font-medium text-default-700">
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
                          <p className="text-xs italic text-default-400">Sin jurados asignados</p>
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
                              <div className="mb-1 flex items-center gap-2">
                                <span className="font-semibold text-default-700">
                                  {progress.evaluated}/{progress.total}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-medium ${
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
                              <div className="h-2 w-full rounded-full bg-default-100">
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
  );
};