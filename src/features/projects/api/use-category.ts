import { api } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

export const getCoursesByEvent = async (eventId?: number) => {
  if (!eventId) return { courses: [] };

  return await api.get<{
    courses: any[];
    nextPageToken?: string;
  }>(`/events/courses/event/${eventId}`);
};

export const useCoursesByEvent = (eventId?: number) => {
  return useQuery({
    queryKey: ["courses", eventId],
    queryFn: () => getCoursesByEvent(eventId),
    enabled: !!eventId,
  });
};