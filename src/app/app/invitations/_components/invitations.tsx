"use client";

import { useInvitations } from "@/features/invitations/api/get-invitations";
import { useAcceptInvitation } from "@/features/invitations/api/accept-invitation";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@heroui/button";
import { Calendar, MapPin, Clock } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { useNotifications } from "@/components/ui/notifications";
import { useUser } from "@/lib/auth";
import dayjs from "dayjs";

export const formatDateShort = (date: string | number) => {
  return {
    day: dayjs(date).format("MMM D, YYYY"),
    time: dayjs(date).format("h:mm A"),
  };
};

export const Invitations = () => {
  const { data, isLoading, error } = useInvitations({ status: "PENDING" });
  const acceptMutation = useAcceptInvitation();
  const { addNotification } = useNotifications();
  const user = useUser();
  const studentCode = user.data?.studentCode;

  const handleAccept = async (invitation: any) => {
    const needsStudentCode = invitation?.targetType === "PROJECT";

    if (needsStudentCode && !studentCode) {
      addNotification({
        type: "error",
        title: "Falta código estudiantil",
        message:
          "Por favor agrega tu código estudiantil en tu perfil antes de aceptar la invitación",
      });
      return;
    }

    try {
      const payload = needsStudentCode
        ? { token: invitation.token, studentCode }
        : { token: invitation.token };

      await acceptMutation.mutateAsync(payload);

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
          if (!invitation.event) return null;

          const start = formatDateShort(invitation.event.startDate);
          const end = formatDateShort(invitation.event.endDate);
          const expires = formatDateShort(invitation.expiresAt);

          return (
            <Card shadow="sm" key={invitation.id} className="glass-card">
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
                        variant="flat"
                        size="sm"
                      >
                        {invitation.roles[0].name}
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
                        <span className="text-default-400">Start:</span>
                        <span>{start.day}</span>
                        <span className="text-xs text-default-500">
                          {start.time}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-default-400 mt-1" />
                      <div className="flex flex-col leading-tight">
                        <span className="text-default-400">End:</span>
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
                    onPress={() => handleAccept(invitation)}
                    color="primary"
                    className="w-full transition-transform hover:scale-[1.01] md:text-base text-sm md:py-3 py-2 rounded-xl font-medium"
                    isLoading={acceptMutation.isPending}
                    isDisabled={acceptMutation.isPending}
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
