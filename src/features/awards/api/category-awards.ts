import type { CategoryAward, PaginationMeta } from "../types";
import type { AwardFormValues } from "../utils/award-form";

import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getAwardWinners } from "./award-winners";
import { AWARDS_PAGE_LIMIT } from "./constants";

import { api } from "@/lib/api-client";
import { MutationConfig, QueryConfig } from "@/lib/react-query";

type ListCategoryAwardsResponse = {
  awards?: CategoryAward[];
  meta?: PaginationMeta;
};

const byPosition = (left: CategoryAward, right: CategoryAward) =>
  left.position - right.position || left.id - right.id;

export const getCategoryAwards = async ({
  categoryId,
}: {
  categoryId: number;
}): Promise<CategoryAward[]> => {
  const response = await api.get<ListCategoryAwardsResponse>(
    "/events/category-awards",
    { params: { categoryId, page: 1, limit: AWARDS_PAGE_LIMIT } },
  );

  return [...(response?.awards ?? [])].sort(byPosition);
};

export const categoryAwardsQueryKey = (categoryId?: number) =>
  ["category-awards", { categoryId: categoryId ?? null }] as const;

export const getCategoryAwardsQueryOptions = (categoryId: number) =>
  queryOptions({
    queryKey: categoryAwardsQueryKey(categoryId),
    queryFn: () => getCategoryAwards({ categoryId }),
  });

type UseCategoryAwardsOptions = {
  categoryId?: number;
  queryConfig?: QueryConfig<typeof getCategoryAwardsQueryOptions>;
};

export const useCategoryAwards = ({
  categoryId,
  queryConfig,
}: UseCategoryAwardsOptions) =>
  useQuery({
    ...getCategoryAwardsQueryOptions(categoryId ?? 0),
    enabled: Boolean(categoryId),
    ...queryConfig,
  });

/** Body of POST /events/category-awards and PATCH /events/category-awards/:id */
const toAwardBody = (values: AwardFormValues) => ({
  title: values.title.trim(),
  description: values.description?.trim() ?? "",
  // The backend has no way to clear the value on PATCH: 0 means "no monetary value"
  value: values.value ?? 0,
  position: values.position,
});

export const createCategoryAward = ({
  categoryId,
  values,
}: {
  categoryId: number;
  values: AwardFormValues;
}): Promise<{ award: CategoryAward }> =>
  api.post("/events/category-awards", { categoryId, ...toAwardBody(values) });

export const updateCategoryAward = ({
  awardId,
  values,
}: {
  awardId: number;
  categoryId: number;
  values: AwardFormValues;
}): Promise<{ award: CategoryAward }> =>
  // UpdateCategoryAwardDTO validates `id` in the body too, not only in the path
  api.patch(`/events/category-awards/${awardId}`, {
    id: awardId,
    ...toAwardBody(values),
  });

/**
 * Removes the winners and then the award: the database does not delete the
 * winners of an award in cascade, so deleting an award that has winners fails.
 */
export const deleteCategoryAward = async ({
  awardId,
}: {
  awardId: number;
  categoryId: number;
}): Promise<{ ok: boolean }> => {
  const winners = await getAwardWinners({ awardId });

  for (const winner of winners) {
    await api.delete(`/events/award-winners/${winner.id}`);
  }

  return api.delete(`/events/category-awards/${awardId}`);
};

const useInvalidateAwards = () => {
  const queryClient = useQueryClient();

  return (categoryId: number) =>
    queryClient.invalidateQueries({
      queryKey: categoryAwardsQueryKey(categoryId),
    });
};

export const useCreateCategoryAward = ({
  mutationConfig,
}: { mutationConfig?: MutationConfig<typeof createCategoryAward> } = {}) => {
  const invalidate = useInvalidateAwards();
  const { onSuccess, ...rest } = mutationConfig ?? {};

  return useMutation({
    ...rest,
    onSuccess: async (data, variables, ...args) => {
      await invalidate(variables.categoryId);
      await onSuccess?.(data, variables, ...args);
    },
    mutationFn: createCategoryAward,
  });
};

export const useUpdateCategoryAward = ({
  mutationConfig,
}: { mutationConfig?: MutationConfig<typeof updateCategoryAward> } = {}) => {
  const invalidate = useInvalidateAwards();
  const { onSuccess, ...rest } = mutationConfig ?? {};

  return useMutation({
    ...rest,
    onSuccess: async (data, variables, ...args) => {
      await invalidate(variables.categoryId);
      await onSuccess?.(data, variables, ...args);
    },
    mutationFn: updateCategoryAward,
  });
};

export const useDeleteCategoryAward = ({
  mutationConfig,
}: { mutationConfig?: MutationConfig<typeof deleteCategoryAward> } = {}) => {
  const invalidate = useInvalidateAwards();
  const { onSuccess, ...rest } = mutationConfig ?? {};

  return useMutation({
    ...rest,
    onSuccess: async (data, variables, ...args) => {
      await invalidate(variables.categoryId);
      await onSuccess?.(data, variables, ...args);
    },
    mutationFn: deleteCategoryAward,
  });
};
