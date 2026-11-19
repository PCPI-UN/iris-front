import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { Administrator } from "@/types/api";

export const createAdministratorInputSchema = z.object({
  email: z
    .string()
    .min(1, "Este campo es obligatorio")
    .email("Correo electrónico inválido"),
});

export type CreateAdministratorInput = z.infer<
  typeof createAdministratorInputSchema
>;

export const createAdministrator = ({
  data,
}: {
  data: CreateAdministratorInput;
}): Promise<{ data: Administrator }> => {
  return api.post("/administrators", data);
};

type UseCreateAdministratorOptions = {
  mutationConfig?: MutationConfig<typeof createAdministrator>;
};

export const useCreateAdministrator = ({
  mutationConfig,
}: UseCreateAdministratorOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, variables, ...args) => {
      queryClient.invalidateQueries({
        queryKey: ["administrators"],
      });
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: createAdministrator,
  });
};
