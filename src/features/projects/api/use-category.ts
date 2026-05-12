import { api } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

export const getCategoriesByEvent = async (eventId?: number) => {
  if (!eventId) return { categories: [] };

  const response = await api.get<{
    courses: any[];
    nextPageToken?: string;
  }>(`/events/courses/event/${eventId}`);

  return {
    ...response,
    categories: response.courses || [],
  };
};

export const useCategoriesByEvent = (eventId?: number) => {
  return useQuery({
    queryKey: ["categories", eventId],
    queryFn: async () => {
      const response = await getCategoriesByEvent(eventId);
      return response;
    },
    enabled: !!eventId,
  });
};

export const getCoursesByEvent = getCategoriesByEvent;
export const useCoursesByEvent = useCategoriesByEvent;