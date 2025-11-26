import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { Course } from "@/types/api";

import { getCourseQueryOptions } from "./get-course";

export const updateCourseInputSchema = z.object({
  code: z.string().min(1, "Required").optional(),
  description: z.string().min(1, "Required").optional(),
  eventIds: z.array(z.string()).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export type UpdateCourseInput = z.infer<typeof updateCourseInputSchema>;

export const updateCourse = ({
  data,
  courseId,
}: {
  data: UpdateCourseInput;
  courseId: number;
}): Promise<{ data: Course }> => {
  return api.patch(`/events/courses/update`, data);
};

type UseUpdateCourseOptions = {
  mutationConfig?: MutationConfig<typeof updateCourse>;
};

export const useUpdateCourse = ({
  mutationConfig,
}: UseUpdateCourseOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, variables, ...args) => {
      queryClient.invalidateQueries({
        queryKey: ["courses"],
      });
      queryClient.refetchQueries({
        queryKey: getCourseQueryOptions(data.data.id).queryKey,
      });
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: updateCourse,
  });
};
