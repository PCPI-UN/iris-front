import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";

export type AddUpdateParticipantInput = {
  projectId: number;
  firstName: string;
  lastName: string;
  email: string;
  studentCode: string;
  semester?: string;
  career?: string;
  status: 1 | 2 | 3 // 1: PENDING, 2: INVITED, 3: JOINED
};

export type CreateInvitationInput = {
  email: string;
  eventType: "EVENT" | "PROJECT";
  targetType: "EVENT" | "PROJECT";
  targetId: number;
  roleIds?: number[];
  firstName?: string;
  lastName?: string;
};

// Hook para agregar o actualizar participante en un proyecto
export const useAddUpdateParticipant = (
  mutationConfig?: MutationConfig<typeof addUpdateParticipant>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addUpdateParticipant,
    onSuccess: (data, variables, ...args) => {
      // Invalidar queries de proyectos para refetch
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
      mutationConfig?.onSuccess?.(data, variables, ...args);
    },
    ...mutationConfig,
  });
};

// Hook para crear invitación
export const useCreateInvitation = (
  mutationConfig?: MutationConfig<typeof createInvitation>
) => {
  return useMutation({
    mutationFn: createInvitation,
    onSuccess: mutationConfig?.onSuccess,
    ...mutationConfig,
  });
};

async function addUpdateParticipant(
  input: AddUpdateParticipantInput
): Promise<{ data: any }> {
  const { projectId, ...participantData } = input;
  const statusToNumber = (status: AddUpdateParticipantInput['status']) => {
    if (typeof status === 'number') return status;
    const normalized = String(status || '').trim().toUpperCase();
    if (normalized === 'PENDING' || normalized === '1') return 1;
    if (normalized === 'INVITED' || normalized === '2') return 2;
    if (normalized === 'JOINED' || normalized === '3') return 3;
    return 1;
  };

  const numericStatus = statusToNumber(participantData.status as any);

  return api.post<{ data: any }>(`/projects/add-update-participants`, {
    projectId,
    firstName: participantData.firstName,
    lastName: participantData.lastName,
    email: participantData.email,
    studentCode: participantData.studentCode,
    semester: participantData.semester,
    career: participantData.career,
    status: numericStatus,
  });
}

async function createInvitation(
  input: CreateInvitationInput
): Promise<{ data: any }> {
  return api.post(`/invitations`, input);
}
