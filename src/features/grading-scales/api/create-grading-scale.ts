import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";

import {
  GradingScale,
  GradingScaleInput,
  normalizeGradingScale,
} from "../utils/grading-scale";
import { getGradingScalesQueryOptions } from "./get-grading-scales";

/**
 * Crea una escala en el catálogo (`POST /grading-scales`). El evento se crea o edita después con
 * su `gradingScaleId`: el backend no recibe la escala nueva dentro del evento.
 */
export const createGradingScale = async ({
  data,
}: {
  data: GradingScaleInput;
}): Promise<GradingScale> => {
  const response = await api.post<Record<string, any>>("/grading-scales", data);
  const scale = normalizeGradingScale(response?.data ?? response);
  if (!scale) {
    throw new Error("El backend no devolvió la escala creada.");
  }
  return scale;
};

type UseCreateGradingScaleOptions = {
  mutationConfig?: MutationConfig<typeof createGradingScale>;
};

export const useCreateGradingScale = ({ mutationConfig }: UseCreateGradingScaleOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: getGradingScalesQueryOptions().queryKey });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: createGradingScale,
  });
};
