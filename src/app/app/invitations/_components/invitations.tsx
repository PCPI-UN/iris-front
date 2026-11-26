"use client";

import { Button } from "@heroui/button";
import { Calendar, MapPin, Clock } from "lucide-react";
import dayjs from "dayjs";

import { useInvitations } from "@/features/invitations/api/get-invitations";
import { useAcceptInvitation } from "@/features/invitations/api/accept-invitation";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardBody } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { useNotifications } from "@/components/ui/notifications";

import "dayjs/locale/es";

export const formatDateShort = (date: string | number) => {
  return {
    day: dayjs(date).locale("es").format("D [de] MMM, YYYY"),
    time: dayjs(date).locale("es").format("h:mm A"),
  };
};

const ROLE_LABELS: Record<string, string> = {
  Juror: "Jurado",
  Admin: "Administrador",
  User: "Estudiante",
  Participant: "Participante",
  Tutor: "Tutor",
};

/**
 * A PROJECT_TUTOR invitation (Iris#187) has no event: the gateway does not fill event or
 * project for it, so it is recognised by its type or by the Tutor role.
 */
export const isTutorInvitation = (invitation: {
  targetType?: string | null;
  event?: unknown;
  roles?: { name: string }[];
}) =>
  invitation.targetType === "PROJECT_TUTOR" ||
  (!invitation.event &&
    Boolean(invitation.roles?.some((role) => role.name === "Tutor")));

export const Invitations = () => {
  const { data, isLoading, error } = useInvitations({ status: "PENDING" });
  const acceptMutation = useAcceptInvitation();
  const { addNotification } = useNotifications();

  const handleAccept = async (invitation: any) => {
    try {
      await acceptMutation.mutateAsync({ token: invitation.token });

      addNotification({
        type: "success",
        title: "Invitación aceptada",
        message: "Has aceptado la invitación exitosamente",
      });
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error?.message || "No se pudo aceptar la invitación",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data || !data.invitations) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-lg text-default-500">
          Error al cargar las invitaciones
        </p>
        <p className="text-sm text-default-400">
          Por favor, intenta nuevamente más tarde
        </p>
      </div>
    );
  }

  const invitations = data.invitations;

  if (invitations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-lg text-default-500">
          No tienes invitaciones pendientes
        </p>
        <p className="text-sm text-default-400">
          Las invitaciones a eventos aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid p-4 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {invitations.map((invitation) => {
          if (isTutorInvitation(invitation)) {
            const expiresAt = formatDateShort(invitation.expiresAt);

            return (
              <Card key={invitation.id} className="glass-card" shadow="sm">
                <CardBody className="p-6 space-y-4 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xl font-semibold flex-1">
                      Tutor de un proyecto
                    </h3>
                    <Chip color="secondary" size="sm" variant="flat">
                      Tutor
                    </Chip>
                  </div>
                  <p className="text-sm text-default-500">
                    Te indicaron como tutor de un proyecto. Al aceptar quedas
                    vinculado a él y recibes el rol de tutor.
                  </p>
                  <div className="flex items-center gap-2 p-1">
                    <Clock className="h-4 w-4 text-default-400" />
                    <div className="flex flex-col leading-tight">
                      <span className="text-default-400 text-sm">Expira:</span>
                      <span className="text-sm">{expiresAt.day}</span>
                    </div>
                  </div>
                  <div className="mt-auto pt-2">
                    <Button
                      className="w-full transition-transform hover:scale-[1.01] md:text-base text-sm md:py-3 py-2 rounded-xl font-medium"
                      color="primary"
                      isDisabled={acceptMutation.isPending}
                      isLoading={acceptMutation.isPending}
                      onPress={() => handleAccept(invitation)}
                    >
                      Aceptar invitación
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          }

          if (!invitation.event) return null;

          const start = formatDateShort(invitation.event.startDate);
          const end = formatDateShort(invitation.event.endDate);
          const expires = formatDateShort(invitation.expiresAt);

          return (
            <Card key={invitation.id} className="glass-card" shadow="sm">
              <CardBody className="p-6 space-y-4 flex flex-col">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xl font-semibold flex-1">
                      {invitation.event.name}
                    </h3>

                    {invitation.roles && invitation.roles.length > 0 && (
                      <Chip
                        color={
                          invitation.roles[0].name === "Juror"
                            ? "warning"
                            : "primary"
                        }
                        size="sm"
                        variant="flat"
                      >
                        {ROLE_LABELS[invitation.roles[0].name] ??
                          invitation.roles[0].name}
                      </Chip>
                    )}
                  </div>

                  {invitation.event.description && (
                    <p className="text-sm text-default-500">
                      {invitation.event.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 text-m">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-default-400 mt-1" />
                      <div className="flex flex-col leading-tight">
                        <span className="text-default-400">Inicio:</span>
                        <span>{start.day}</span>
                        <span className="text-xs text-default-500">
                          {start.time}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-default-400 mt-1" />
                      <div className="flex flex-col leading-tight">
                        <span className="text-default-400">Fin:</span>
                        <span>{end.day}</span>
                        <span className="text-xs text-default-500">
                          {end.time}
                        </span>
                      </div>
                    </div>
                  </div>

                  {invitation.event.location && (
                    <div className="flex items-center gap-2 p-1">
                      <MapPin className="h-4 w-4 text-default-400" />
                      <span className="text-sm text-default-500">
                        {invitation.event.location}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-1">
                    <Clock className="h-4 w-4 text-default-400" />
                    <div className="flex flex-col leading-tight">
                      <span className="text-default-400 text-sm">Expira:</span>
                      <span className="text-sm">{expires.day}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-2">
                  <Button
                    className="w-full transition-transform hover:scale-[1.01] md:text-base text-sm md:py-3 py-2 rounded-xl font-medium"
                    color="primary"
                    isDisabled={acceptMutation.isPending}
                    isLoading={acceptMutation.isPending}
                    onPress={() => handleAccept(invitation)}
                  >
                    Aceptar invitación
                  </Button>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
