import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { Course } from "@/types/api";

export const createCourseInputSchema = z.object({
  code: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  eventId: z.number().min(1, "Event is required"),
  status: z.enum(["active", "inactive"]).optional(),
});

export const createCategoryInputSchema = createCourseInputSchema;

export type CreateCourseInput = z.infer<typeof createCourseInputSchema>;
export type CreateCategoryInput = CreateCourseInput;

export const createCategory = ({
  data,
}: {
  data: CreateCourseInput;
}): Promise<{ data: Course }> => {
  return api.post("/events/courses", data);
};

type UseCreateCourseOptions = {
  mutationConfig?: MutationConfig<typeof createCategory>;
};

type UseCreateCategoryOptions = UseCreateCourseOptions;

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
      queryClient.invalidateQueries({
        queryKey: ["courses"],
      });
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: createCategory,
  });
};
