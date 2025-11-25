import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { Course } from "@/types/api";

import { getCoursesQueryOptions } from "./get-courses";

export const createCourseInputSchema = z.object({
  code: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  eventId: z.number().min(1, "Event is required"),
  status: z.enum(["active", "inactive"]).optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseInputSchema>;

export const createCourse = ({
  data,
}: {
  data: CreateCourseInput;
}): Promise<{ data: Course }> => {
  return api.post("/events/courses", data);
};

type UseCreateCourseOptions = {
  mutationConfig?: MutationConfig<typeof createCourse>;
};

export const useCreateCourse = ({
  mutationConfig,
}: UseCreateCourseOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, variables, ...args) => {
      queryClient.invalidateQueries({
        queryKey: ["courses"],
      });
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: createCourse,
  });
};
