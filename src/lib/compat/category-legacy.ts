type CategoryCarrier = {
  categoryId?: unknown;
  courseId?: unknown;
};

type CategoryListCarrier = {
  categoryIds?: unknown;
  courseIds?: unknown;
};

type SearchParamsLike = {
  get: (key: string) => string | null;
};

export const categoryQueryParamKeys = ["categoryId", "courseId"] as const;

export const isCategoryQueryParamKey = (key: string) => {
  return categoryQueryParamKeys.includes(
    key as (typeof categoryQueryParamKeys)[number]
  );
};

export const withLegacyCourseIdParam = (categoryId?: number | string) => {
  return categoryId ? { courseId: categoryId } : {};
};

export const withLegacyCourseIdsParam = (categoryIds?: Array<number | string>) => {
  return categoryIds && categoryIds.length > 0 ? { courseIds: categoryIds } : {};
};

export const normalizeCategoryId = <T extends CategoryCarrier>(entity: T) => {
  return (entity.categoryId ?? entity.courseId) as T["categoryId"];
};

export const normalizeCategoryIds = <T extends CategoryListCarrier>(entity: T) => {
  return (entity.categoryIds ?? entity.courseIds ?? []) as unknown[];
};

export const readCategoryIdFromSearchParams = (searchParams?: SearchParamsLike | null) => {
  if (!searchParams) {
    return null;
  }

  return searchParams.get("categoryId") ?? searchParams.get("courseId");
};

export const appendLegacyCourseIdToFormData = (
  formData: FormData,
  categoryId?: number | string
) => {
  if (!categoryId) {
    return;
  }

  formData.append("courseId", String(categoryId));
};
