import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { CategoryCriteriaGroup } from "@/types/api";

export const getCategoryCriteria = async ({
  categoryId,
}: {
  categoryId: string;
}): Promise<CategoryCriteriaGroup[]> => {
  const response = await api.get<any>(`/criterions/course/${categoryId}`);

  // The backend may return different shapes: { categories: [...] } or { criterions: [...] }
  const rawItems: any[] = response?.categories || response?.criterions || response || [];

  if (!Array.isArray(rawItems) || rawItems.length === 0) return [];

  // Detect if items reference a component (either component_id field or a nested component object)
  const hasComponent = rawItems.some((c) => c?.component_id != null || c?.component != null);

  if (!hasComponent) {
    // All criteria belong to a single unnamed section (component-less)
    return [
      {
        category: "",
        weight: rawItems[0]?.weight ?? null,
        criterions: rawItems.map((c: any) => ({
          id: c.id,
          name: c.name,
          component_id: c.component_id ?? null,
        })),
      },
    ];
  }

  // Group by component id (or nested component.id)
  const groupsMap = new Map<string, CategoryCriteriaGroup>();

  rawItems.forEach((c: any) => {
    const comp = c.component || (c.component_id != null ? { id: c.component_id, name: c.component_name, weight: c.component_weight ?? c.weight } : null);
    const key = comp ? String(comp.id) : "__null__";

    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        category: comp?.name ?? "",
        weight: comp?.weight ?? c.weight ?? null,
        criterions: [],
      });
    }

    const group = groupsMap.get(key)!;
    group.criterions.push({ id: c.id, name: c.name, component_id: comp?.id ?? null });
  });

  return Array.from(groupsMap.values());
};

export const getCategoryCriterionQueryOptions = ({
  categoryId,
}: {
  categoryId: string;
}) => {
  return queryOptions({
    queryKey: ["criterions", "category", categoryId],
    queryFn: () => getCategoryCriteria({ categoryId }),
  });
};

type UseCategoryCriteriaOptions = {
  categoryId: string;
  queryConfig?: QueryConfig<typeof getCategoryCriterionQueryOptions>;
};

export const useCategoryCriteria = ({
  categoryId,
  queryConfig,
}: UseCategoryCriteriaOptions) => {
  return useQuery({
    ...getCategoryCriterionQueryOptions({ categoryId }),
    ...queryConfig,
  });
};
