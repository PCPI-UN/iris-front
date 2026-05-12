"use client";

import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useNotifications } from "@/components/ui/notifications";
import { useState } from "react";
import { Input } from "@/components/ui/input";

// 🔥 Debes crear este hook
// import { useAssignJudges } from "../api/assign-judges";

interface Judge {
  id: number;
  firstName: string;
  lastName: string;
  assignedProjects?: number;
}

interface AssignJudgesModalProps {
  projectId: number;
  judges: Judge[];
  initialSelected?: number[];

  // modo tabla
  isOpenTable?: boolean;
  onOpenChangeTable?: (open: boolean) => void;
}

export const AssignJudgesModal = ({
  projectId,
  judges,
  initialSelected = [],
  isOpenTable,
  onOpenChangeTable,
}: AssignJudgesModalProps) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { addNotification } = useNotifications();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>(initialSelected);

  // 🔥 reemplaza con tu mutation real
  // const assignMutation = useAssignJudges();

  const controlled = isOpenTable !== undefined;

  const filteredJudges = judges.filter((j) =>
    `${j.firstName} ${j.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const toggleJudge = (id: number) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((j) => j !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (selected.length === 0) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Debes seleccionar al menos un jurado",
      });
      return;
    }

    // 🔥 aquí llamas tu API
    /*
    assignMutation.mutate(
      { projectId, judges: selected },
      {
        onSuccess: () => {
          addNotification({
            type: "success",
            title: "Jurados asignados",
          });
          onCloseModal();
        },
      }
    );
    */

    addNotification({
      type: "success",
      title: "Jurados asignados",
    });

    handleClose();
  };

  const handleClose = () => {
    setSearch("");
    setSelected(initialSelected);

    if (controlled && onOpenChangeTable) {
      onOpenChangeTable(false);
    } else {
      onOpenChange();
    }
  };

  return (
    <>
      {!controlled && (
        <Button
          size="sm"
          onPress={onOpen}
          className="bg-transparent border border-[#ffffff30] py-5 text-white hover:bg-cyan-500/40"
        >
          Asignar jurados
        </Button>
      )}

      <Modal
        isOpen={controlled ? isOpenTable : isOpen}
        onOpenChange={controlled ? onOpenChangeTable : onOpenChange}
        size="lg"
      >
        <ModalContent>
          {(onCloseModal) => (
            <>
              <ModalHeader>Asignar jurados</ModalHeader>

              <ModalBody className="space-y-4">
                {/* 🔍 Buscador */}
                <Input
                  placeholder="Buscar jurado..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                {/* 📊 Contador */}
                <div className="text-sm text-muted-foreground">
                  Seleccionados: {selected.length}
                </div>

                {/* 👨‍⚖️ Lista */}
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {filteredJudges.map((judge) => {
                    const isSelected = selected.includes(judge.id);

                    return (
                      <div
                        key={judge.id}
                        onClick={() => toggleJudge(judge.id)}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                          ${
                            isSelected
                              ? "bg-cyan-500/10 border-cyan-400"
                              : "border-muted/20 hover:bg-muted/10"
                          }
                        `}
                      >
                        {/* Info */}
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                            {judge.firstName[0]}
                            {judge.lastName[0]}
                          </div>

                          <div>
                            <p className="text-sm font-medium">
                              {judge.firstName} {judge.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {judge.assignedProjects ?? 0} proyectos
                            </p>
                          </div>
                        </div>

                        {/* Checkbox visual */}
                        <div
                          className={`h-5 w-5 rounded border flex items-center justify-center
                            ${
                              isSelected
                                ? "bg-cyan-500 border-cyan-500"
                                : "border-muted-foreground"
                            }
                          `}
                        >
                          {isSelected && (
                            <span className="text-white text-xs">✓</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {filteredJudges.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground">
                      No se encontraron jurados
                    </p>
                  )}
                </div>

                {/* 👥 Preview */}
                {selected.length > 0 && (
                  <div className="pt-2">
                    <p className="text-sm mb-2">Seleccionados:</p>
                  </div>
                )}
              </ModalBody>

              <ModalFooter className="space-x-2">
                <Button variant="light" onPress={handleClose}>
                  Cancelar
                </Button>

                <Button
                  color="primary"
                  // isLoading={assignMutation.isPending}
                  onPress={handleSubmit}
                >
                  Guardar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};