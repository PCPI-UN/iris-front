"use client";

import type { TopProject } from "@/features/monitoring/api/get-top-projects";
import type { AwardWinner, CategoryAward } from "../types";

import { Checkbox } from "@heroui/react";
import { Radio, RadioGroup } from "@heroui/radio";
import { Medal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAssignAwardWinners } from "../api/award-winners";
import {
  buildWinnersToAssign,
  formatGrade,
  getCoWinnersOf,
  getEligibleProjects,
} from "../utils/winners";

import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { useNotifications } from "@/components/ui/notifications";
import { getPositionLabel } from "@/features/monitoring/utils/co-winners";

type AssignWinnerModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  award: CategoryAward;
  /** Full ranking of the category (approved projects with evaluations) */
  ranking: TopProject[];
  winners: AwardWinner[];
};

export const AssignWinnerModal = ({
  isOpen,
  onOpenChange,
  award,
  ranking,
  winners,
}: AssignWinnerModalProps) => {
  const { addNotification } = useNotifications();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [includeCoWinners, setIncludeCoWinners] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedProjectId("");
    setIncludeCoWinners(true);
    setSaveError(null);
  }, [isOpen]);

  const eligible = useMemo(
    () => getEligibleProjects(ranking, winners),
    [ranking, winners],
  );
  const projectId = Number(selectedProjectId) || 0;
  const coWinners = useMemo(
    () => (projectId ? getCoWinnersOf(eligible, projectId) : []),
    [eligible, projectId],
  );

  const assignWinners = useAssignAwardWinners();

  const handleAssign = async (onClose: () => void) => {
    const toAssign = buildWinnersToAssign({
      ranking,
      projectId,
      includeCoWinners,
      winners,
    });

    if (toAssign.length === 0) {
      setSaveError("Selecciona el proyecto ganador.");

      return;
    }

    setSaveError(null);
    try {
      await assignWinners.mutateAsync({ awardId: award.id, winners: toAssign });
      addNotification({
        type: "success",
        title:
          toAssign.length > 1 ? "Coganadores asignados" : "Ganador asignado",
      });
      onClose();
    } catch (error) {
      setSaveError(
        error instanceof Error && error.message
          ? error.message
          : "No se pudo asignar el ganador",
      );
    }
  };

  return (
    <Modal
      className="m-auto mx-5 lg:max-w-xl"
      isOpen={isOpen}
      scrollBehavior="inside"
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Medal className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-bold">Asignar ganador</h2>
              </div>
              <p className="text-sm font-normal text-default-500">
                {award.title}
              </p>
            </ModalHeader>

            <ModalBody className="space-y-3">
              {eligible.length === 0 ? (
                <p className="rounded-xl border border-dashed border-default-200 p-4 text-sm text-default-500">
                  {ranking.length === 0
                    ? "La categoría aún no tiene proyectos evaluados en la clasificación."
                    : "Todos los proyectos de la clasificación ya ganaron este premio."}
                </p>
              ) : (
                <RadioGroup
                  label="Proyectos de la clasificación de la categoría"
                  value={selectedProjectId}
                  onValueChange={(value) => {
                    setSelectedProjectId(value);
                    setSaveError(null);
                  }}
                >
                  {eligible.map((project) => (
                    <Radio
                      key={project.id}
                      description={`${getPositionLabel(project.position)} · Promedio ${formatGrade(project.averageGrade)}`}
                      value={String(project.id)}
                    >
                      {project.name}
                    </Radio>
                  ))}
                </RadioGroup>
              )}

              {coWinners.length > 0 && (
                <div className="rounded-xl border border-warning-200 bg-warning-50/50 p-3 text-sm">
                  <p className="text-default-700">
                    Comparte el {getPositionLabel(coWinners[0].position)} con{" "}
                    {coWinners.map((project) => project.name).join(", ")}: son
                    coganadores.
                  </p>
                  <Checkbox
                    className="mt-2"
                    isSelected={includeCoWinners}
                    onValueChange={setIncludeCoWinners}
                  >
                    Asignar el premio también a los coganadores
                  </Checkbox>
                </div>
              )}

              {saveError && (
                <p className="text-sm text-danger-500" role="alert">
                  {saveError}
                </p>
              )}
            </ModalBody>

            <ModalFooter>
              <Button
                isDisabled={assignWinners.isPending}
                variant="light"
                onPress={onClose}
              >
                Cancelar
              </Button>
              <Button
                color="primary"
                isDisabled={eligible.length === 0}
                isLoading={assignWinners.isPending}
                onPress={() => void handleAssign(onClose)}
              >
                Asignar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
