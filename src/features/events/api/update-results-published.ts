import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";

/**
 * Publishes or hides the results of an event (PATCH /events/:id, permission
 * manage:events). Only `resultsPublished` is sent, so the rest of the event
 * does not change. While it is false, students do not see their score,
 * feedback, position or awards.
 */
export const updateResultsPublished = ({
  eventId,
  resultsPublished,
}: {
  eventId: number;
  resultsPublished: boolean;
}) => {
  return api.patch(
    `/events/${eventId}`,
    { resultsPublished },
    // The control shows its own message
    { suppressErrorNotification: true },
  );
};

type UseUpdateResultsPublishedOptions = {
  mutationConfig?: MutationConfig<typeof updateResultsPublished>;
};

export const useUpdateResultsPublished = ({
  mutationConfig,
}: UseUpdateResultsPublishedOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      // Event lists, the event detail and the student dashboard read the flag
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: updateResultsPublished,
  });
};
