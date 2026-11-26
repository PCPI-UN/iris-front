import { InvitationEmailStatus } from "@/types/api";

type EmailStatusView = {
  label: string;
  color: "success" | "warning" | "danger" | "default";
  description: string;
};

const EMAIL_STATUS: Record<InvitationEmailStatus, EmailStatusView> = {
  SENT: {
    label: "Enviado",
    color: "success",
    description:
      "El correo de la invitación se entregó al proveedor de correo.",
  },
  PENDING: {
    label: "Pendiente",
    color: "warning",
    description:
      "El correo está registrado y se enviará en segundo plano (o espera un reintento).",
  },
  FAILED: {
    label: "Falló",
    color: "danger",
    description:
      "Fallaron todos los intentos de envío. Puedes reenviar la invitación.",
  },
};

// The backend omits emailStatus when it is unknown: the invitation is older than
// the delivery log, or the email service could not be queried
const UNKNOWN: EmailStatusView = {
  label: "Sin información",
  color: "default",
  description:
    "No se conoce el estado del correo: la invitación es anterior al registro de envíos o no se pudo consultar el servicio de correo.",
};

/** Label, color and explanation of the email delivery of an invitation */
export const getEmailStatusView = (status?: string | null): EmailStatusView =>
  status && status in EMAIL_STATUS
    ? EMAIL_STATUS[status as InvitationEmailStatus]
    : UNKNOWN;
