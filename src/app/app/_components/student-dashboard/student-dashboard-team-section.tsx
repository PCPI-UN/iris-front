"use client";

import { useState } from "react";
import { Avatar } from "@heroui/avatar";
import {
  Hash,
  Mail,
  User,
  Users,
  Scale,
  BookOpen,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { ProjectParticipant } from "@/types/api";
import {
  getInitials,
  getParticipantStatusColor,
  getParticipantStatusLabel,
  normalizeParticipantStatus,
  SEMESTER_OPTIONS,
  CAREER_OPTIONS,
} from "../../../../features/events/api/student-dashboard.helpers";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { useNotifications } from "@/components/ui/notifications";
import {
  useAddUpdateParticipant,
  useCreateInvitation,
} from "@/features/projects/api/participant-mutations";
import { StudentDashboardSectionCard } from "./student-dashboard-section-card";

type StudentDashboardTeamSectionProps = {
  participants: ProjectParticipant[];
  canEdit: boolean;
  projectId: number;
  UserEmail?: string;
};

export const StudentDashboardTeamSection = ({
  participants,
  canEdit,
  projectId,
  UserEmail,
}: StudentDashboardTeamSectionProps) => {
  const { addNotification } = useNotifications();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({
    firstName: "",
    lastName: "",
    email: "",
    studentCode: "",
    semester: "",
    career: "",
  });
  const [editingParticipantEmail, setEditingParticipantEmail] = useState<
    string | null
  >(null);
  const [draftParticipant, setDraftParticipant] =
    useState<ProjectParticipant | null>(null);

  const addUpdateParticipantMutation = useAddUpdateParticipant({
    onSuccess: () => {
      addNotification({
        type: "success",
        title: "Participante actualizado",
        message:
          "Los cambios se guardaron correctamente, Procede a Enviar cambios.",
      });
      setDraftParticipant(null);
      setEditingParticipantEmail(null);
    },
    onError: (error: any) => {
      addNotification({
        type: "error",
        title: "Error al actualizar participante",
        message: error?.message || "Hubo un error al actualizar.",
      });
    },
  });

  const createInvitationMutation = useCreateInvitation({
    onSuccess: () => {
      addNotification({
        type: "success",
        title: "Invitación enviada",
        message: "La invitación se envió correctamente.",
      });
    },
    onError: (error: any) => {
      addNotification({
        type: "error",
        title: "Error al enviar invitación",
        message: error?.message || "No se pudo enviar la invitación.",
      });
    },
  });

  const canEditParticipant = (participantEmail: string): boolean => {
    return !!UserEmail && participantEmail === UserEmail;
  };

  const startEditParticipant = (participant: ProjectParticipant) => {
    if (!canEditParticipant(participant.email)) {
      addNotification({
        type: "error",
        title: "Acceso denegado",
        message: "Solo puedes editar tu información de participante.",
      });
      return;
    }
    setEditingParticipantEmail(participant.email);
    setDraftParticipant({ ...participant });
  };

  const cancelEditParticipant = () => {
    setEditingParticipantEmail(null);
    setDraftParticipant(null);
  };

  const currentParticipant = participants.find(
    (p) => p.email === editingParticipantEmail,
  );

  console.log("currentParticipant", currentParticipant);

  const handleSaveParticipant = async (currentStatus?: string | number) => {
    if (!draftParticipant) return;

    const currentParticipant = participants.find(
      (p) => p.email === editingParticipantEmail,
    );

    const statusToSend = normalizeParticipantStatus(
      currentStatus ??
        currentParticipant?.status ??
        draftParticipant.status ??
        1,
    );

    try {
      await addUpdateParticipantMutation.mutateAsync({
        projectId,
        firstName: draftParticipant.firstName,
        lastName: draftParticipant.lastName,
        email: editingParticipantEmail || draftParticipant.email,
        studentCode: draftParticipant.ParticipantCode || "",
        semester: String(draftParticipant.semester),
        career: draftParticipant.career,
        status: statusToSend,
      });
      console.log("Participante actualizado con status:", statusToSend);
    } catch (error) {
      console.error("Error updating participant:", error);
    }
  };

  const handleAddMember = async () => {
    if (!newMember.email) {
      addNotification({
        type: "error",
        title: "Email requerido",
        message: "Ingresa el correo del miembro.",
      });
      return;
    }

    if (!newMember.firstName || !newMember.lastName) {
      addNotification({
        type: "error",
        title: "Datos incompletos",
        message: "Completa nombre y apellido antes de continuar.",
      });
      return;
    }

    try {
      await addUpdateParticipantMutation.mutateAsync({
        projectId,
        firstName: newMember.firstName,
        lastName: newMember.lastName,
        email: newMember.email,
        studentCode: newMember.studentCode,
        semester: newMember.semester,
        career: newMember.career,
        status: 1,
      });

      await createInvitationMutation.mutateAsync({
        email: newMember.email,
        eventType: "PROJECT",
        targetType: "PROJECT",
        targetId: projectId,
        firstName: newMember.firstName,
        lastName: newMember.lastName,
      });

      setNewMember({
        firstName: "",
        lastName: "",
        email: "",
        studentCode: "",
        semester: "",
        career: "",
      });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error creating participant/invitation:", error);
    }
  };

  return (
    <StudentDashboardSectionCard
      title="Miembros del equipo"
      icon={Users}
      className="space-y-5"
    >
      {canEdit ? (
        <div className="rounded-xl border border-default-200/60 bg-default-50/50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Agregar participante nuevo
              </p>
              <p className="text-xs text-default-500">
                Primero se crea el participante y luego se envía la invitación
                al correo.
              </p>
            </div>

            <Button
              size="sm"
              variant="flat"
              className="bg-emerald-200/20 text-emerald-600 hover:bg-emerald-300/20"
              onPress={() => setShowAddForm((current) => !current)}
            >
              {showAddForm ? "Ocultar formulario" : "Agregar miembro"}
            </Button>
          </div>

          {showAddForm ? (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                size="sm"
                placeholder="Nombre"
                value={newMember.firstName}
                onValueChange={(value) =>
                  setNewMember({ ...newMember, firstName: value })
                }
              />
              <Input
                size="sm"
                placeholder="Apellido"
                value={newMember.lastName}
                onValueChange={(value) =>
                  setNewMember({ ...newMember, lastName: value })
                }
              />
              <Input
                size="sm"
                placeholder="Correo"
                value={newMember.email}
                onValueChange={(value) =>
                  setNewMember({ ...newMember, email: value })
                }
              />
              <Input
                size="sm"
                placeholder="Codigo estudiantil"
                value={newMember.studentCode}
                onValueChange={(value) =>
                  setNewMember({ ...newMember, studentCode: value })
                }
              />
              <Select
                size="sm"
                placeholder="Selecciona semestre"
                selectedKeys={newMember.semester ? [newMember.semester] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setNewMember({ ...newMember, semester: selected });
                }}
              >
                {SEMESTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value}>{option.label}</SelectItem>
                ))}
              </Select>
              <Select
                size="sm"
                placeholder="Selecciona carrera"
                selectedKeys={newMember.career ? [newMember.career] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setNewMember({ ...newMember, career: selected });
                }}
              >
                {CAREER_OPTIONS.map((option) => (
                  <SelectItem key={option.value}>{option.label}</SelectItem>
                ))}
              </Select>
            </div>
          ) : null}

          {showAddForm ? (
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                color="success"
                onPress={handleAddMember}
                isLoading={
                  addUpdateParticipantMutation.isPending ||
                  createInvitationMutation.isPending
                }
              >
                Agregar y enviar invitación
              </Button>
              <Button
                size="sm"
                variant="flat"
                color="danger"
                onPress={() => {
                  setShowAddForm(false);
                  setNewMember({
                    firstName: "",
                    lastName: "",
                    email: "",
                    studentCode: "",
                    semester: "",
                    career: "",
                  });
                }}
              >
                Cancelar
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {participants.length > 0 ? (
        <ol className="space-y-4" aria-label="Lista de participantes">
          {participants.map((participant, idx) => {
            const participantStatus = normalizeParticipantStatus(
              participant.status,
            );

            const isEditingThis =
              editingParticipantEmail === participant.email &&
              !!draftParticipant;

            return (
              <li key={idx}>
                <article
                  className="group relative rounded-xl border border-default-200/60 bg-default-50/50 p-5 transition-colors hover:border-primary/40"
                  aria-label={`Participante: ${participant.firstName} ${participant.lastName}`}
                >
                  <div className="flex min-h-[120px] flex-col gap-4 xl:flex-row xl:items-stretch">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <Avatar
                        name={getInitials(
                          participant.firstName,
                          participant.lastName,
                        )}
                        className="bg-primary/20 font-semibold text-primary"
                        radius="full"
                        size="lg"
                        aria-hidden="true"
                      />

                      <div className="min-w-0 flex-1 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {/* Nombre */}
                        <div className="space-y-1">
                          <label
                            htmlFor={`participant-name-${idx}`}
                            className="flex items-center gap-2 text-default-500"
                          >
                            <User className="h-4 w-4" aria-hidden="true" />
                            <span className="text-xs font-semibold uppercase tracking-wide">
                              Nombre
                            </span>
                          </label>

                          {isEditingThis ? (
                            <Input
                              size="sm"
                              value={draftParticipant!.firstName}
                              onValueChange={(value) =>
                                setDraftParticipant({
                                  ...draftParticipant!,
                                  firstName: value,
                                })
                              }
                              placeholder="Nombre"
                              className="text-sm"
                            />
                          ) : (
                            <div
                              id={`participant-name-${idx}`}
                              className="text-sm w-full font-medium md:text-base"
                            >
                              {participant.firstName}
                            </div>
                          )}
                        </div>

                        {/* Apellido */}
                        <div className="space-y-1">
                          <label
                            htmlFor={`participant-lastname-${idx}`}
                            className="flex items-center gap-2 text-default-500"
                          >
                            <User className="h-4 w-4" aria-hidden="true" />
                            <span className="text-xs font-semibold uppercase tracking-wide">
                              Apellido
                            </span>
                          </label>

                          {isEditingThis ? (
                            <Input
                              size="sm"
                              value={draftParticipant!.lastName}
                              onValueChange={(value) =>
                                setDraftParticipant({
                                  ...draftParticipant!,
                                  lastName: value,
                                })
                              }
                              placeholder="Apellido"
                              className="text-sm"
                            />
                          ) : (
                            <div
                              id={`participant-lastname-${idx}`}
                              className="text-sm w-full font-medium md:text-base"
                            >
                              {participant.lastName}
                            </div>
                          )}
                        </div>

                        {/* Correo (no editable) */}
                        <div className="space-y-1">
                          <label
                            htmlFor={`participant-email-${idx}`}
                            className="flex items-center gap-2 text-default-500"
                          >
                            <Mail className="h-4 w-4" aria-hidden="true" />
                            <span className="text-xs font-semibold uppercase tracking-wide">
                              Correo
                            </span>
                          </label>
                          <div
                            id={`participant-email-${idx}`}
                            className="w-full break-words text-sm"
                          >
                            {participant.email}
                          </div>
                        </div>

                        {/* Semestre */}
                        <div className="space-y-1">
                          <label
                            htmlFor={`participant-semester-${idx}`}
                            className="flex items-center gap-2 text-default-500"
                          >
                            <Scale className="h-4 w-4" aria-hidden="true" />
                            <span className="text-xs font-semibold uppercase tracking-wide">
                              Semestre
                            </span>
                          </label>

                          {isEditingThis ? (
                            <Select
                              size="sm"
                              selectedKeys={
                                draftParticipant!.semester
                                  ? [String(draftParticipant!.semester)]
                                  : []
                              }
                              onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0] as string;
                                setDraftParticipant({
                                  ...draftParticipant!,
                                  semester: Number(selected),
                                });
                              }}
                              placeholder="Selecciona semestre"
                              className="text-sm"
                            >
                              {SEMESTER_OPTIONS.map((option) => (
                                <SelectItem key={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </Select>
                          ) : (
                            <div
                              id={`participant-semester-${idx}`}
                              className="text-sm italic text-default-500"
                            >
                              {SEMESTER_OPTIONS.find(
                                (o) => o.value === String(participant.semester),
                              )?.label || "Sin semestre"}
                            </div>
                          )}
                        </div>

                        {/* Carrera */}
                        <div className="space-y-1">
                          <label
                            htmlFor={`participant-career-${idx}`}
                            className="flex items-center gap-2 text-default-500"
                          >
                            <BookOpen className="h-4 w-4" aria-hidden="true" />
                            <span className="text-xs font-semibold uppercase tracking-wide">
                              Carrera
                            </span>
                          </label>

                          {isEditingThis ? (
                            <Select
                              size="sm"
                              selectedKeys={
                                draftParticipant!.career
                                  ? [draftParticipant!.career]
                                  : []
                              }
                              onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0] as string;
                                setDraftParticipant({
                                  ...draftParticipant!,
                                  career: selected,
                                });
                              }}
                              placeholder="Selecciona carrera"
                              className="text-sm"
                            >
                              {CAREER_OPTIONS.map((option) => (
                                <SelectItem key={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </Select>
                          ) : (
                            <div
                              id={`participant-career-${idx}`}
                              className="text-sm italic text-default-500"
                            >
                              {CAREER_OPTIONS.find(
                                (o) => o.value === participant.career,
                              )?.label || "Sin carrera"}
                            </div>
                          )}
                        </div>

                        {/* Codigo estudiantil */}
                        <div className="space-y-1">
                          <label
                            htmlFor={`participant-code-${idx}`}
                            className="flex items-center gap-2 text-default-500"
                          >
                            <Hash className="h-4 w-4" aria-hidden="true" />
                            <span className="text-xs font-semibold uppercase tracking-wide">
                              Codigo estudiantil
                            </span>
                          </label>

                          {isEditingThis ? (
                            <Input
                              size="sm"
                              value={draftParticipant!.ParticipantCode || ""}
                              onValueChange={(value) =>
                                setDraftParticipant({
                                  ...draftParticipant!,
                                  ParticipantCode: value,
                                })
                              }
                              placeholder="Codigo estudiantil"
                              className="text-sm"
                            />
                          ) : (
                            <div
                              id={`participant-code-${idx}`}
                              className="text-sm italic text-default-500"
                            >
                              {participant.ParticipantCode || "Sin codigo"}
                            </div>
                          )}

                          {/* Actions: Save/Cancel when editing, Edit when not */}
                          {isEditingThis && (
                            <div className="col-span-full flex gap-2">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="flat"
                                color="success"
                                onPress={() =>
                                  void handleSaveParticipant(participant.status)
                                }
                                isLoading={
                                  addUpdateParticipantMutation.isPending
                                }
                                disabled={
                                  addUpdateParticipantMutation.isPending
                                }
                                aria-label="Guardar cambios"
                              >
                                <Check className="h-4 w-4" />
                              </Button>

                              <Button
                                isIconOnly
                                size="sm"
                                variant="flat"
                                color="danger"
                                onPress={cancelEditParticipant}
                                aria-label="Cancelar edición"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}

                          {!isEditingThis &&
                            canEditParticipant(participant.email) && (
                              <div className="col-span-full">
                                <Button
                                  size="sm"
                                  variant="flat"
                                  className="text-xs"
                                  onPress={() =>
                                    startEditParticipant(participant)
                                  }
                                  aria-label="Editar participante"
                                >
                                  <Edit2 className="h-3 w-3" />
                                  Editar
                                </Button>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="flex min-w-[140px] items-center justify-center self-stretch xl:justify-end">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getParticipantStatusColor(participantStatus)}`}
                      >
                        {getParticipantStatusLabel(participantStatus)}
                      </span>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="rounded-xl border border-default-200 bg-background p-4 text-sm text-default-500">
          No hay miembros en este proyecto aun.
        </p>
      )}
    </StudentDashboardSectionCard>
  );
};
