import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { Category } from "@/types/api";

export const createCategoryInputSchema = z.object({
  code: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  eventId: z.number().min(1, "Event is required"),
  status: z.enum(["active", "inactive"]).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const createCategory = ({
  data,
}: {
  data: CreateCategoryInput;
}): Promise<{ data: Category }> => {
  return api.post("/events/courses", data);
};

type UseCreateCategoryOptions = {
  mutationConfig?: MutationConfig<typeof createCategory>;
};

export const useCreateCategory = ({
  mutationConfig,
}: UseCreateCategoryOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, variables, ...args) => {
      queryClient.invalidateQueries({
        queryKey: ["categories"],
      });
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: createCategory,
  });
};
