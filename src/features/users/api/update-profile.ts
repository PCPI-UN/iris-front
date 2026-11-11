import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api, ApiError } from "@/lib/api-client";
import { getUserQueryOptions } from "@/lib/auth";
import { MutationConfig } from "@/lib/react-query";

import { Profile, profileQueryKey } from "./get-profile";

// Same rules as OwnProfileFieldsDto in the gateway: values are trimmed, firstName
// 2-100 chars, lastName up to 100, phone a 10-digit Colombian number (mobile 3xx
// or landline 60x). The backend stays the source of truth.
const PHONE_REGEX = /^(3\d{9}|60\d{8})$/;

export const createUpdateProfileInputSchema = (currentPhone = "") =>
  z.object({
    firstName: z
      .string()
      .trim()
      .min(1, "El nombre es obligatorio")
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100, "El nombre no puede superar 100 caracteres"),
    lastName: z
      .string()
      .trim()
      .max(100, "El apellido no puede superar 100 caracteres"),
    phone: z
      .string()
      // Users often type spaces or dashes: "300 123 4567"
      .transform((value) => value.replace(/[\s-]/g, ""))
      // The API cannot clear a phone: an empty value is only valid if there was none
      .refine((value) => value !== "" || currentPhone.trim() === "", {
        message: "El teléfono no se puede dejar vacío",
      })
      .refine((value) => value === "" || PHONE_REGEX.test(value), {
        message: "Ingresa un número colombiano de 10 dígitos (ej. 3001234567)",
      }),
  });

export type UpdateProfileFormValues = z.input<
  ReturnType<typeof createUpdateProfileInputSchema>
>;
export type UpdateProfileValues = z.output<
  ReturnType<typeof createUpdateProfileInputSchema>
>;

/** Body of PATCH /profile/me: only the fields the user can edit. */
export type UpdateProfileInput = Partial<UpdateProfileValues>;

/**
 * Only the fields that changed are sent, so an untouched empty phone is never
 * sent as "" (the backend rejects it).
 */
export const getChangedProfileFields = (
  values: UpdateProfileValues,
  profile: Pick<Profile, "firstName" | "lastName" | "phone">,
): UpdateProfileInput => {
  const changes: UpdateProfileInput = {};
  if (values.firstName !== (profile.firstName ?? "").trim()) {
    changes.firstName = values.firstName;
  }
  if (values.lastName !== (profile.lastName ?? "").trim()) {
    changes.lastName = values.lastName;
  }
  if (values.phone !== (profile.phone ?? "").trim()) {
    changes.phone = values.phone;
  }
  return changes;
};

/** Turns an API error into a message the user can act on. */
export const getUpdateProfileErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return "Algunos datos no son válidos. Revisa los campos e intenta de nuevo.";
      case 403:
        return "Tu cuenta no está activa, por eso no puedes editar tu perfil.";
      case 409:
        return "Ese número de teléfono ya está registrado por otro usuario.";
    }
  }
  return "No pudimos guardar los cambios. Intenta de nuevo en unos minutos.";
};

export const updateProfile = ({
  data,
}: {
  data: UpdateProfileInput;
}): Promise<Profile> => {
  // The screen shows its own error messages
  return api.patch<Profile>("/profile/me", data, {
    suppressErrorNotification: true,
  });
};

type UseUpdateProfileOptions = {
  mutationConfig?: MutationConfig<typeof updateProfile>;
};

export const useUpdateProfile = ({
  mutationConfig,
}: UseUpdateProfileOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.setQueryData(profileQueryKey, args[0]);
      // The session user (navbar greeting) also shows the name
      queryClient.invalidateQueries({
        queryKey: getUserQueryOptions().queryKey,
      });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: updateProfile,
  });
};
