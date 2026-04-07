import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Edit2, Hash, Mail, User, Users } from "lucide-react";
import { ProjectParticipant } from "@/types/api";
import { getInitials } from "./student-dashboard.helpers";
import { StudentDashboardSectionCard } from "./student-dashboard-section-card";

type StudentDashboardTeamSectionProps = {
  participants: ProjectParticipant[];
  pendingParticipants: ProjectParticipant[];
  canEdit: boolean;
  onEdit: () => void;
};

export const StudentDashboardTeamSection = ({
  participants,
  pendingParticipants,
  canEdit,
  onEdit,
}: StudentDashboardTeamSectionProps) => {
  return (
    <StudentDashboardSectionCard
      title="Miembros del equipo"
      icon={Users}
      className="space-y-5"
      action={
        canEdit ? (
          <Button
            size="sm"
            variant="flat"
            className="gap-1"
            onClick={onEdit}
            aria-label="Editar miembros del equipo"
          >
            <Edit2 className="h-3 w-3" />
            Editar miembros
          </Button>
        ) : null
      }
    >
      {participants.length > 0 ? (
        <ol className="space-y-4" aria-label="Lista de participantes">
          {participants.map((participant, idx) => (
            <li key={idx}>
              <article
                className="group relative rounded-xl border border-default-200/60 bg-default-50/50 p-5 transition-colors hover:border-primary/40"
                aria-label={`Participante: ${participant.firstName} ${participant.lastName}`}
              >
                <div className="flex items-start gap-4">
                  <Avatar
                    name={getInitials(participant.firstName, participant.lastName)}
                    className="bg-primary/20 font-semibold text-primary"
                    radius="full"
                    size="lg"
                    aria-hidden="true"
                  />
                  <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 md:grid-cols-3">
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
                      <div
                        id={`participant-name-${idx}`}
                        className="truncate text-sm font-medium md:text-base"
                      >
                        {participant.firstName} {participant.lastName}
                      </div>
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
                        className="break-all text-sm"
                      >
                        {participant.email}
                      </div>
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
                      <div
                        id={`participant-code-${idx}`}
                        className="text-sm italic text-default-500"
                      >
                        {participant.ParticipantCode || "Sin codigo"}
                      </div>
                    </div>
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

      {pendingParticipants.length > 0 && (
        <aside
          className="space-y-3 border-t border-default-200/60 pt-4"
          aria-label="Participantes con invitacion pendiente"
        >
          <p className="text-sm font-semibold text-warning">
            Participantes pendientes
          </p>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {pendingParticipants.map((participant, idx) => (
              <li key={idx}>
                <article className="space-y-2 rounded-xl border border-warning/30 bg-warning/10 p-4">
                  <p className="text-sm font-medium">
                    {participant.firstName} {participant.lastName}
                  </p>
                  <p className="break-all text-sm text-default-600">
                    {participant.email}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </StudentDashboardSectionCard>
  );
};
