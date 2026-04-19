import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Meta, Category } from "@/types/api";

type GetCategoriesResponse = {
  courses: Category[];
  nextPageToken?: string;
};

type GetCategoriesOptions = {
  page?: number;
  eventId?: number;
};

export const getCategories = async (
  { page, eventId }: { page?: number; eventId?: number } = { page: 1 }
): Promise<{ data: Category[]; meta: Meta }> => {
  
  const response = await api.get<GetCategoriesResponse>(`/events/courses/all`, {
    params: {
      page,
      ...(eventId ? { eventId } : {})
    }
  });

  return {
    data: response.courses ?? [],
    meta: {
      page: page ?? 1,
      total: response.courses?.length ?? 0,
      totalPages: 1,
    }
  };
};

export const getCategoriesQueryOptions = (
  { page = 1, eventId }: GetCategoriesOptions = {}
) => {
  return queryOptions({
    queryKey: ["categories", { page, eventId: eventId ?? null }],
    queryFn: async () => {
      const result = await getCategories({ page, eventId });
      return result;
    },
  });
};

type UseCategoriesOptions = {
  page?: number;
  eventId?: number;
  queryConfig?: QueryConfig<typeof getCategoriesQueryOptions>;
};

export const useCategories = ({ queryConfig, page, eventId }: UseCategoriesOptions) => {
  return useQuery({
    ...getCategoriesQueryOptions({ page, eventId }),
    ...queryConfig,
  });
};
