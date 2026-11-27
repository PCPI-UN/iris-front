"use client";

import type { TopProject } from "@/features/monitoring/api/get-top-projects";
import type { AwardWinner, CategoryAward } from "../types";

import { Download, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import { useState } from "react";

import { downloadProjectDiploma } from "../api/award-diploma";
import { useAwardWinners } from "../api/award-winners";
import { formatGrade } from "../utils/winners";

import { Can } from "@/components/auth/can";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Spinner } from "@/components/ui/spinner";
import { formatAwardValue } from "@/features/events/utils/event-awards";
import { PERMISSIONS } from "@/lib/authorization";

type AwardCardProps = {
  award: CategoryAward;
  /** Event of the award; without it the diploma of the winners is not offered */
  eventId?: number;
  /** Ranking of the category, to show the name of each winner */
  rankingById: Map<number, TopProject>;
  onEdit: (award: CategoryAward) => void;
  onDelete: (award: CategoryAward, winners: AwardWinner[]) => void;
  onAssign: (award: CategoryAward) => void;
  onRemoveWinner: (
    award: CategoryAward,
    winner: AwardWinner,
    projectName: string,
  ) => void;
};

/**
 * Downloads the award diploma of a winner. The backend answers with its own
 * message (shown as an error notification) when the results are not published
 * yet or the event has no diploma design.
 */
const WinnerDiplomaButton = ({
  eventId,
  projectId,
  projectName,
}: {
  eventId: number;
  projectId: number;
  projectName: string;
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadProjectDiploma(eventId, projectId);
    } catch {
      // The API client already shows the backend message
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      isIconOnly
      aria-label={`Descargar diploma de ${projectName}`}
      isLoading={isDownloading}
      size="sm"
      title="Descargar diploma (PDF)"
      variant="light"
      onPress={handleDownload}
    >
      <Download className="h-4 w-4" />
    </Button>
  );
};

export const AwardCard = ({
  award,
  eventId,
  rankingById,
  onEdit,
  onDelete,
  onAssign,
  onRemoveWinner,
}: AwardCardProps) => {
  const winnersQuery = useAwardWinners({ awardId: award.id });
  const winners = winnersQuery.data ?? [];
  const value = formatAwardValue(award.value);
  const hasCoWinners = winners.length > 1;

  return (
    <Card
      aria-label={award.title}
      as="article"
      className="glass-card border border-default-200/70 shadow-sm"
    >
      <CardBody className="space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Chip color="warning" size="sm" variant="flat">
                Posición {award.position}
              </Chip>
              {value && (
                <Chip color="success" size="sm" variant="flat">
                  {value}
                </Chip>
              )}
            </div>
            <h4 className="text-base font-semibold text-foreground">
              {award.title}
            </h4>
            {award.description?.trim() && (
              <p className="text-sm text-default-500">{award.description}</p>
            )}
          </div>

          <Can permission={PERMISSIONS.manageEvents}>
            <div className="flex shrink-0 gap-2">
              <Button
                aria-label={`Editar ${award.title}`}
                size="sm"
                variant="bordered"
                onPress={() => onEdit(award)}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
              <Button
                aria-label={`Eliminar ${award.title}`}
                color="danger"
                isDisabled={winnersQuery.isLoading}
                size="sm"
                variant="bordered"
                onPress={() => onDelete(award, winners)}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            </div>
          </Can>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-default-700">Ganadores</p>
            {hasCoWinners && (
              <Chip
                color="warning"
                size="sm"
                startContent={<Users className="h-3 w-3" />}
                variant="flat"
              >
                Coganadores
              </Chip>
            )}
          </div>

          {winnersQuery.isLoading ? (
            <div className="flex justify-center py-3">
              <Spinner size="sm" />
            </div>
          ) : winnersQuery.isError ? (
            <p className="text-sm text-danger-500">
              No se pudieron cargar los ganadores.
            </p>
          ) : winners.length === 0 ? (
            <p className="text-sm text-default-400">Sin ganador asignado.</p>
          ) : (
            <ul className="space-y-2">
              {winners.map((winner) => {
                const projectName =
                  rankingById.get(winner.projectId)?.name ??
                  `Proyecto #${winner.projectId}`;

                return (
                  <li
                    key={winner.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-default-200/70 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {projectName}
                      </p>
                      <p className="text-xs text-default-500">
                        Calificación {formatGrade(winner.grade)}
                      </p>
                    </div>
                    <Can permission={PERMISSIONS.manageEvents}>
                      <div className="flex shrink-0 items-center gap-1">
                        {eventId != null && (
                          <WinnerDiplomaButton
                            eventId={eventId}
                            projectId={winner.projectId}
                            projectName={projectName}
                          />
                        )}
                        <Button
                          isIconOnly
                          aria-label={`Quitar a ${projectName} de ${award.title}`}
                          color="danger"
                          size="sm"
                          variant="light"
                          onPress={() =>
                            onRemoveWinner(award, winner, projectName)
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Can>
                  </li>
                );
              })}
            </ul>
          )}

          <Can permission={PERMISSIONS.manageEvents}>
            <Button
              aria-label={`Asignar ganador a ${award.title}`}
              color="primary"
              isDisabled={winnersQuery.isLoading || winnersQuery.isError}
              size="sm"
              variant="flat"
              onPress={() => onAssign(award)}
            >
              <Plus className="h-4 w-4" />
              {winners.length > 0 ? "Agregar coganador" : "Asignar ganador"}
            </Button>
          </Can>
        </div>
      </CardBody>
    </Card>
  );
};
