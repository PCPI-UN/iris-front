import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { Course } from "@/types/api";
import { MutationConfig } from "@/lib/react-query";

export const deleteCourse = ({ courseId }: { courseId: number }): Promise<{ data: Course }> => {
  return api.delete(`/events/courses/delete`, { id: courseId });
};

type UseDeleteCourseOptions = {
  mutationConfig?: MutationConfig<typeof deleteCourse>;
};

export const useDeleteCourse = ({
  mutationConfig,
}: UseDeleteCourseOptions = {}) => {
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
    mutationFn: deleteCourse,
  });
};
