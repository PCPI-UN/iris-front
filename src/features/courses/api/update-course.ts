import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { Course } from "@/types/api";

import { getCategoryQueryOptions } from "./get-course";

export const updateCourseInputSchema = z.object({
  id: z.number().min(1, "ID is required"),
  code: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  active: z.boolean(),
});

export type UpdateCourseInput = z.infer<typeof updateCourseInputSchema>;

export const updateCategory = ({
  data
}: {
  data: UpdateCourseInput;
}): Promise<{ data: Course }> => {
  return api.patch(`/events/courses/update`, data);
};

export const updateCourse = updateCategory;

type UseUpdateCourseOptions = {
  mutationConfig?: MutationConfig<typeof updateCategory>;
};

export const useUpdateCategory = ({
  mutationConfig,
}: UseUpdateCourseOptions = {}) => {
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
      queryClient.refetchQueries({
        queryKey: getCategoryQueryOptions(data.data.id).queryKey,
      });
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: updateCategory,
  });
};

export const useUpdateCourse = useUpdateCategory;
