import type { CategoryAward } from "../types";

import { z } from "zod";

/** Raw values of the award form, as the inputs hold them */
export type AwardFormDraft = {
  title: string;
  description: string;
  value: string;
  position: string;
};

export const awardFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "El nombre del premio es obligatorio")
    .max(255, "El nombre no puede superar 255 caracteres"),
  description: z.string().trim().optional(),
  value: z
    .string()
    .trim()
    .optional()
    .transform((raw, ctx) => {
      if (!raw) return undefined;
      // Pesos without decimals: "3000000", "3.000.000", "3,000,000" and "$3 000 000" are the same
      // value. Separators only count as thousands separators (groups of 3 digits, all the same
      // separator), so "12,5" or "1.500,50" are rejected instead of read as 125 or 150050.
      const isWholePesos = /^\$?\s*(\d+|\d{1,3}([.,\s])\d{3}(\2\d{3})*)$/.test(
        raw,
      );
      const parsed = isWholePesos ? Number(raw.replace(/[$.,\s]/g, "")) : NaN;

      if (!Number.isFinite(parsed)) {
        ctx.addIssue({
          code: "custom",
          message: "El valor debe ser un monto en pesos, sin decimales",
        });

        return z.NEVER;
      }

      return parsed;
    }),
  position: z
    .string()
    .trim()
    .min(1, "La posición es obligatoria")
    .transform((raw, ctx) => {
      const parsed = Number(raw);

      if (!Number.isInteger(parsed) || parsed < 1) {
        ctx.addIssue({
          code: "custom",
          message: "La posición debe ser un número entero mayor o igual a 1",
        });

        return z.NEVER;
      }

      return parsed;
    }),
});

export type AwardFormValues = z.output<typeof awardFormSchema>;

export type AwardFormErrors = Partial<Record<keyof AwardFormDraft, string>>;

/** Validates the draft: the values to send, or the message of each invalid field */
export const parseAwardForm = (
  draft: AwardFormDraft,
):
  | { values: AwardFormValues; errors?: undefined }
  | { values?: undefined; errors: AwardFormErrors } => {
  const result = awardFormSchema.safeParse(draft);

  if (result.success) return { values: result.data };

  const errors: AwardFormErrors = {};

  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof AwardFormDraft;

    errors[field] ??= issue.message;
  }

  return { errors };
};

/** Next free position after the existing awards of the category */
export const getNextAwardPosition = (
  awards: Pick<CategoryAward, "position">[],
) => awards.reduce((max, award) => Math.max(max, award.position), 0) + 1;

export const emptyAwardDraft = (position: number): AwardFormDraft => ({
  title: "",
  description: "",
  value: "",
  position: String(position),
});

export const awardToDraft = (award: CategoryAward): AwardFormDraft => ({
  title: award.title ?? "",
  description: award.description ?? "",
  value: award.value > 0 ? String(award.value) : "",
  position: String(award.position),
});
