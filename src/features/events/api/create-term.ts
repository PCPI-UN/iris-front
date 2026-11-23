import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { Term } from "@/types/api";

/** POST /terms: the year between 2000 and 2100 and a two digit period code (2026 + "10" is 202610) */
export const createTermInputSchema = z.object({
  year: z.coerce
    .number({ message: "Ingrese el año del periodo" })
    .int("El año debe ser un número entero")
    .min(2000, "El año debe estar entre 2000 y 2100")
    .max(2100, "El año debe estar entre 2000 y 2100"),
  period: z
    .string()
    .trim()
    .regex(
      /^\d{2}$/,
      "El código del periodo debe tener dos dígitos, como 10 o 30",
    ),
});

export type CreateTermInput = z.infer<typeof createTermInputSchema>;

export const createTerm = ({
  data,
}: {
  data: CreateTermInput;
}): Promise<Term> => {
  // The error is shown next to the term field, not as a notification
  return api.post<Term>("/terms", data, { suppressErrorNotification: true });
};

type UseCreateTermOptions = {
  mutationConfig?: MutationConfig<typeof createTerm>;
};

export const useCreateTerm = ({
  mutationConfig,
}: UseCreateTermOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (term, variables, ...args) => {
      // The new term is chosen right away: it has to be in the list before the refetch ends
      queryClient.setQueryData<Term[]>(["terms"], (terms) =>
        terms?.some((candidate) => candidate.id === term.id)
          ? terms
          : [term, ...(terms ?? [])],
      );
      queryClient.invalidateQueries({ queryKey: ["terms"] });
      onSuccess?.(term, variables, ...args);
    },
    ...restConfig,
    mutationFn: createTerm,
  });
};
