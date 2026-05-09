"use client";

import { useState } from "react";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Edit2, Hash, Mail, User, Users, Scale, BookOpen, Check, X } from "lucide-react";
import { ProjectParticipant } from "@/types/api";
import { getInitials } from "../../../../features/events/api/student-dashboard.helpers";
import { StudentDashboardSectionCard } from "./student-dashboard-section-card";
import { getSemesterFromParticipant, normalizeCareer } from "@/features/events/api/student-dashboard.helpers";
import { useNotifications } from "@/components/ui/notifications";
import { useAddUpdateParticipant, useCreateInvitation } from "@/features/projects/api/participant-mutations";
import { Input } from "@heroui/input";


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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingParticipantEmail, setEditingParticipantEmail] = useState<string | null>(null);
  const [draftParticipant, setDraftParticipant] = useState<ProjectParticipant | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    ParticipantCode?: string;
    semester?: number | string;                                                                                                         
    career?: string;
  }>({ firstName: "", lastName: "", email: "", ParticipantCode: "", semester: "", career: "" });

  const addUpdateParticipantMutation = useAddUpdateParticipant({
    onSuccess: () => {
      addNotification({
        type: "success",
        title: "Participante actualizado",
        message: "Los cambios se guardaron correctamente, Procede a Enviar cambios.",
      });
      setDraftParticipant(null);
      setEditingParticipantEmail(null);
    },
    onError: (error) => {
      addNotification({
        type: "error",
        title: "Error al actualizar participante",
        message: error.message || "Hubo un error al actualizar.",
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
    // Only allow editing if the participant email matches the current user's email
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

  const handleSaveParticipant = async () => {
    if (!draftParticipant) return;

    try {
      await addUpdateParticipantMutation.mutateAsync({
        projectId,
        firstName: draftParticipant.firstName,
        lastName: draftParticipant.lastName,
        email: draftParticipant.email,
        studentCode: draftParticipant.ParticipantCode || "",
        semester: String(draftParticipant.semester),
        career: draftParticipant.career,
        status: "PENDING",
      });
    } catch (error) {
      console.error("Error updating participant:", error);
    }
  };

  const handleAddMember = async () => {
    if (!newMember.email) {
      addNotification({ type: "error", title: "Email requerido", message: "Ingresa el correo del miembro." });
      return;
    }

    try {
      await addUpdateParticipantMutation.mutateAsync({
        projectId,
        firstName: newMember.firstName,
        lastName: newMember.lastName,
        email: newMember.email,
        studentCode: newMember.ParticipantCode || "",
        semester: String(newMember.semester || ""),
        career: newMember.career || "",
        status: "PENDING",
      });

      // Enviar invitación después de crear/actualizar participante
      try {
        await createInvitationMutation.mutateAsync({
          email: newMember.email,
          eventType: "PROJECT",
          targetType: "PROJECT",
          targetId: projectId,
          firstName: newMember.firstName || undefined,
          lastName: newMember.lastName || undefined,
        });
      } catch (inviteErr) {
        // createInvitationMutation.onError already notifica; log para debug
        console.error("Invitation error:", inviteErr);
      }

      addNotification({ type: "success", title: "Miembro agregado", message: "El miembro fue agregado correctamente." });
      setNewMember({ firstName: "", lastName: "", email: "", ParticipantCode: "", semester: "", career: "" });
      setShowAddForm(false);
    } catch (error) {
      addNotification({ type: "error", title: "Error al agregar miembro", message: (error as any)?.message || "No se pudo agregar el miembro." });
    }
  };
  return (
    <StudentDashboardSectionCard
      title="Miembros del equipo"
      icon={Users}
      className="space-y-5"
      action={
        canEdit ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              size="sm"
              variant="flat"
              className="flex items-center gap-1.5 text-sm bg-sky-200/20 text-sky-300 hover:bg-sky-300/20 dark:hover:text-sky-400"
              onPress={() => {
                setIsEditMode(!isEditMode);
                if (isEditMode) cancelEditParticipant();
              }}
              aria-label="Editar miembros del equipo"
            >
              <Edit2 className="h-3 w-3" />
              {isEditMode ? "Hecho" : "Editar miembros"}
            </Button>
            <Button
              size="sm"
              variant="flat"
              className="flex items-center gap-1.5 text-sm bg-emerald-200/20 text-emerald-600 hover:bg-emerald-300/20"
              onPress={() => setShowAddForm(!showAddForm)}
              aria-label="Agregar miembro"
            >
              + Agregar miembro
            </Button>
          </div>
        ) : null
      }
    >
      {showAddForm && (
        <div className="rounded-xl border border-default-200/60 bg-default-50/50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input size="sm" placeholder="Nombre" value={newMember.firstName} onValueChange={(v) => setNewMember({ ...newMember, firstName: v })} />
            <Input size="sm" placeholder="Apellido" value={newMember.lastName} onValueChange={(v) => setNewMember({ ...newMember, lastName: v })} />
            <Input size="sm" placeholder="Correo" value={newMember.email} onValueChange={(v) => setNewMember({ ...newMember, email: v })} />
            <Input size="sm" placeholder="Codigo estudiantil" value={newMember.ParticipantCode} onValueChange={(v) => setNewMember({ ...newMember, ParticipantCode: v })} />
            <Input size="sm" placeholder="Semestre" value={String(newMember.semester ?? "")} onValueChange={(v) => setNewMember({ ...newMember, semester: v })} />
            <Input size="sm" placeholder="Carrera" value={newMember.career} onValueChange={(v) => setNewMember({ ...newMember, career: v })} />
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" color="success" onPress={handleAddMember} isLoading={addUpdateParticipantMutation.isPending}>Agregar</Button>
            <Button size="sm" variant="flat" color="danger" onPress={() => { setShowAddForm(false); setNewMember({ firstName: "", lastName: "", email: "", ParticipantCode: "", semester: "", career: "" }); }}>Cancelar</Button>
          </div>
        </div>
      )}

      {participants.length > 0 ? (
        <ol className="space-y-4" aria-label="Lista de participantes">
          {participants.map((participant, idx) => (
            <li key={idx}>
              <article
                className="group relative rounded-xl border border-default-200/60 bg-default-50/50 p-5 transition-colors hover:border-primary/40"
                aria-label={`Participante: ${participant.firstName} ${participant.lastName}`}
              >
                <div className="flex items-start gap-4 ">
                  <Avatar
                    name={getInitials(participant.firstName, participant.lastName)}
                    className="bg-primary/20 font-semibold text-primary"
                    radius="full"
                    size="lg"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 w-full grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
                      {isEditMode && editingParticipantEmail === participant.email && draftParticipant ? (
                        <Input
                          size="sm"
                          value={draftParticipant.firstName}
                          onValueChange={(value) =>
                            setDraftParticipant({
                              ...draftParticipant,
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
                      {isEditMode && editingParticipantEmail === participant.email && draftParticipant ? (
                        <Input
                          size="sm"
                          value={draftParticipant.lastName}
                          onValueChange={(value) =>
                            setDraftParticipant({
                              ...draftParticipant,
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
                      {isEditMode && editingParticipantEmail === participant.email && draftParticipant ? (
                        <Input
                          size="sm"
                          value={String(draftParticipant.semester ?? "")}
                          onValueChange={(value) =>
                            setDraftParticipant({
                              ...draftParticipant,
                              semester: Number(value),
                            })
                          }
                          placeholder="Semestre"
                          className="text-sm"
                        />
                      ) : (
                        <div
                          id={`participant-semester-${idx}`}
                          className="text-sm italic text-default-500"
                        >
                          {getSemesterFromParticipant(participant.semester)}
                        </div>
                      )}
                    </div>

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
                      {isEditMode && editingParticipantEmail === participant.email && draftParticipant ? (
                        <Input
                          size="sm"
                          value={draftParticipant.career}
                          onValueChange={(value) =>
                            setDraftParticipant({
                              ...draftParticipant,
                              career: value,
                            })
                          }
                          placeholder="Carrera"
                          className="text-sm"
                        />
                      ) : (
                        <div
                          id={`participant-career-${idx}`}
                          className="text-sm italic text-default-500"
                        >
                          {normalizeCareer(participant.career)}
                        </div>
                      )}
                    </div>

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
                      {isEditMode && editingParticipantEmail === participant.email && draftParticipant ? (
                        <Input
                          size="sm"
                          value={draftParticipant.ParticipantCode || ""}
                          onValueChange={(value) =>
                            setDraftParticipant({
                              ...draftParticipant,
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
                    </div>

                    {isEditMode && editingParticipantEmail === participant.email && draftParticipant && (
                      <div className="col-span-full flex gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          color="success"
                          onPress={handleSaveParticipant}
                          isLoading={addUpdateParticipantMutation.isPending}
                          disabled={addUpdateParticipantMutation.isPending}
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

                    {isEditMode && !draftParticipant && canEditParticipant(participant.email) && (
                      <div className="col-span-full">
                        <Button
                          size="sm"
                          variant="flat"
                          className="text-xs"
                          onPress={() => startEditParticipant(participant)}
                          aria-label="Editar participante"
                        >
                          <Edit2 className="h-3 w-3" />
                          Editar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-xl border border-default-200 bg-background p-4 text-sm text-default-500">
          No hay miembros en este proyecto aun.
        </p>
      )}

    </StudentDashboardSectionCard>
  );
};
