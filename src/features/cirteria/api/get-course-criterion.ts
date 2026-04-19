import {
  getCategoryCriteria,
  getCategoryCriterionQueryOptions,
  useCategoryCriteria,
} from "./get-category-criterion";
import { QueryConfig } from "@/lib/react-query";

export {
  getCategoryCriteria,
  getCategoryCriterionQueryOptions,
  useCategoryCriteria,
};

export const getCourseCriteria = ({
  courseId,
}: {
  courseId: string;
}) => getCategoryCriteria({ categoryId: courseId });

export const getCourseCriterionQueryOptions = ({
  courseId,
}: {
  courseId: string;
}) => getCategoryCriterionQueryOptions({ categoryId: courseId });

type UseCourseCriteriaOptions = {
  courseId: string;
  queryConfig?: QueryConfig<typeof getCourseCriterionQueryOptions>;
};

export const useCourseCriteria = ({
  courseId,
  queryConfig,
}: UseCourseCriteriaOptions) => {
  return useCategoryCriteria({
    categoryId: courseId,
    queryConfig,
  });
};
