"use client";

import type { AwardWinner, CategoryAward } from "../types";

import { useQuery } from "@tanstack/react-query";
import { Plus, Trophy } from "lucide-react";
import { useMemo, useState } from "react";

import { useRemoveAwardWinner } from "../api/award-winners";
import {
  useCategoryAwards,
  useDeleteCategoryAward,
} from "../api/category-awards";
import { getNextAwardPosition } from "../utils/award-form";

import { AssignWinnerModal } from "./assign-winner-modal";
import { AwardCard } from "./award-card";
import { AwardFormModal } from "./award-form-modal";

import { Can } from "@/components/auth/can";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { useNotifications } from "@/components/ui/notifications";
import { Spinner } from "@/components/ui/spinner";
import { getTopProjects } from "@/features/monitoring/api/get-top-projects";
import { PERMISSIONS } from "@/lib/authorization";

type AwardsTabProps = {
  selectedEventId?: number;
  selectedCategoryId?: number;
  selectedEventName?: string;
  selectedCategoryName?: string;
};

type PendingConfirmation =
  | { kind: "delete-award"; award: CategoryAward; winners: AwardWinner[] }
  | {
      kind: "remove-winner";
      award: CategoryAward;
      winner: AwardWinner;
      projectName: string;
    };

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

/**
 * Awards of a category and their winners (CU-86e3wzr61). The admin creates,
 * edits and deletes awards and assigns the winners among the projects of the
 * category ranking; projects that share a position are co-winners and can all
 * receive the same award. Read-only roles see the awards without the actions.
 */
export const AwardsTab = ({
  selectedEventId,
  selectedCategoryId,
  selectedEventName,
  selectedCategoryName,
}: AwardsTabProps) => {
  const { addNotification } = useNotifications();
  const canFetch = Boolean(selectedEventId && selectedCategoryId);

  const awardsQuery = useCategoryAwards({
    categoryId: selectedCategoryId,
    queryConfig: { enabled: canFetch },
  });
  // limit 0: every project of the ranking, a winner may come from any position
  const rankingQuery = useQuery({
    queryKey: ["top-projects", selectedEventId, selectedCategoryId, 0],
    queryFn: () => getTopProjects(selectedCategoryId!, selectedEventId!, 0),
    enabled: canFetch,
  });

  const awards = useMemo(() => awardsQuery.data ?? [], [awardsQuery.data]);
  const ranking = useMemo(
    () => rankingQuery.data?.items ?? [],
    [rankingQuery.data],
  );
  const rankingById = useMemo(
    () => new Map(ranking.map((project) => [project.id, project])),
    [ranking],
  );

  const [formState, setFormState] = useState<{
    isOpen: boolean;
    award?: CategoryAward;
  }>({ isOpen: false });
  const [assignState, setAssignState] = useState<{
    award: CategoryAward;
  } | null>(null);
  const [confirmation, setConfirmation] = useState<PendingConfirmation | null>(
    null,
  );
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const deleteAward = useDeleteCategoryAward();
  const removeWinner = useRemoveAwardWinner();
  const isConfirming = deleteAward.isPending || removeWinner.isPending;

  const openConfirmation = (pending: PendingConfirmation) => {
    setConfirmError(null);
    setConfirmation(pending);
  };

  const handleConfirm = async () => {
    if (!confirmation || !selectedCategoryId) return;
    setConfirmError(null);
    try {
      if (confirmation.kind === "delete-award") {
        await deleteAward.mutateAsync({
          awardId: confirmation.award.id,
          categoryId: selectedCategoryId,
        });
        addNotification({ type: "success", title: "Premio eliminado" });
      } else {
        await removeWinner.mutateAsync({
          winnerId: confirmation.winner.id,
          awardId: confirmation.award.id,
        });
        addNotification({ type: "success", title: "Ganador quitado" });
      }
      setConfirmation(null);
    } catch (error) {
      setConfirmError(
        errorMessage(
          error,
          confirmation.kind === "delete-award"
            ? "No se pudo eliminar el premio"
            : "No se pudo quitar el ganador",
        ),
      );
    }
  };

  const isLoading =
    canFetch && (awardsQuery.isLoading || rankingQuery.isLoading);

  return (
    <div className="space-y-4">
      <Card className="glass-card border border-default-200/70 shadow-sm">
        <CardHeader className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 shrink-0 text-amber-500" />
            <div>
              <h3 className="text-lg font-semibold">PREMIOS</h3>
              <p className="text-sm text-default-400">
                {[selectedEventName, selectedCategoryName]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </p>
            </div>
          </div>

          {canFetch && (
            <Can permission={PERMISSIONS.manageEvents}>
              <Button
                color="primary"
                isDisabled={awardsQuery.isLoading || awardsQuery.isError}
                onPress={() => setFormState({ isOpen: true })}
              >
                <Plus className="h-4 w-4" />
                Nuevo premio
              </Button>
            </Can>
          )}
        </CardHeader>

        <CardBody className="space-y-4 p-5 md:p-6">
          {!canFetch && (
            <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-500">
              Selecciona un evento y una categoría para gestionar sus premios.
            </div>
          )}

          {isLoading && (
            <div className="flex min-h-[180px] items-center justify-center">
              <Spinner size="lg" />
            </div>
          )}

          {canFetch && !isLoading && awardsQuery.isError && (
            <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-danger-200 text-sm text-danger-500">
              No se pudieron cargar los premios. Intenta nuevamente.
            </div>
          )}

          {canFetch && !isLoading && !awardsQuery.isError && (
            <>
              {rankingQuery.isError && (
                <p className="text-sm text-warning-600">
                  No se pudo cargar la clasificación de la categoría: los
                  ganadores se muestran por su número de proyecto.
                </p>
              )}

              {awards.length === 0 ? (
                <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-500">
                  Esta categoría aún no tiene premios.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {awards.map((award) => (
                    <AwardCard
                      key={award.id}
                      award={award}
                      rankingById={rankingById}
                      onAssign={(item) => setAssignState({ award: item })}
                      onDelete={(item, winners) =>
                        openConfirmation({
                          kind: "delete-award",
                          award: item,
                          winners,
                        })
                      }
                      onEdit={(item) =>
                        setFormState({ isOpen: true, award: item })
                      }
                      onRemoveWinner={(item, winner, projectName) =>
                        openConfirmation({
                          kind: "remove-winner",
                          award: item,
                          winner,
                          projectName,
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {selectedCategoryId && (
        <AwardFormModal
          award={formState.award}
          categoryId={selectedCategoryId}
          isOpen={formState.isOpen}
          nextPosition={getNextAwardPosition(awards)}
          onOpenChange={(open) =>
            setFormState((current) => ({ ...current, isOpen: open }))
          }
        />
      )}

      {assignState && (
        <AssignWinnerModal
          isOpen
          award={assignState.award}
          ranking={ranking}
          onOpenChange={(open) => !open && setAssignState(null)}
        />
      )}

      <Modal
        className="m-auto mx-5 lg:max-w-md"
        isOpen={confirmation !== null}
        onOpenChange={(open) => !open && setConfirmation(null)}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <h2 className="text-lg font-bold">
                  {confirmation?.kind === "delete-award"
                    ? "Eliminar premio"
                    : "Quitar ganador"}
                </h2>
              </ModalHeader>
              <ModalBody className="space-y-2 text-sm text-default-600">
                {confirmation?.kind === "delete-award" ? (
                  <>
                    <p>
                      ¿Eliminar el premio «{confirmation.award.title}»? Esta
                      acción no se puede deshacer.
                    </p>
                    {confirmation.winners.length > 0 && (
                      <p className="text-warning-600">
                        {confirmation.winners.length === 1
                          ? "También se quitará su ganador."
                          : `También se quitarán sus ${confirmation.winners.length} ganadores.`}
                      </p>
                    )}
                  </>
                ) : confirmation?.kind === "remove-winner" ? (
                  <p>
                    ¿Quitar a «{confirmation.projectName}» como ganador de «
                    {confirmation.award.title}»?
                  </p>
                ) : null}
                {confirmError && (
                  <p className="text-danger-500" role="alert">
                    {confirmError}
                  </p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  isDisabled={isConfirming}
                  variant="light"
                  onPress={onClose}
                >
                  Cancelar
                </Button>
                <Button
                  color="danger"
                  isLoading={isConfirming}
                  onPress={() => void handleConfirm()}
                >
                  {confirmation?.kind === "delete-award"
                    ? "Eliminar"
                    : "Quitar"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};
