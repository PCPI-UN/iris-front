"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotifications } from "@/components/ui/notifications";

import { Profile } from "../api/get-profile";
import {
  createUpdateProfileInputSchema,
  getChangedProfileFields,
  getUpdateProfileErrorMessage,
  UpdateProfileFormValues,
  UpdateProfileValues,
  useUpdateProfile,
} from "../api/update-profile";

type UpdateProfileProps = {
  profile: Profile;
};

const toFormValues = (profile: Profile): UpdateProfileFormValues => ({
  firstName: profile.firstName ?? "",
  lastName: profile.lastName ?? "",
  phone: profile.phone ?? "",
});

export const UpdateProfile = ({ profile }: UpdateProfileProps) => {
  const { addNotification } = useNotifications();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = useMemo(
    () => createUpdateProfileInputSchema(profile.phone),
    [profile.phone],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileFormValues, unknown, UpdateProfileValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(profile),
    mode: "onTouched",
  });

  // After a save (or a refetch) the saved values become the new baseline
  useEffect(() => {
    reset(toFormValues(profile));
  }, [profile, reset]);

  const updateProfileMutation = useUpdateProfile({
    mutationConfig: {
      onSuccess: () => {
        setSubmitError(null);
        addNotification({
          type: "success",
          title: "Perfil actualizado",
          message: "Tus cambios se guardaron correctamente.",
        });
      },
      onError: (error) => {
        setSubmitError(getUpdateProfileErrorMessage(error));
      },
    },
  });

  const onSubmit = (values: UpdateProfileValues) => {
    const changes = getChangedProfileFields(values, profile);
    if (Object.keys(changes).length === 0) {
      // Only whitespace changed: nothing to save
      reset(toFormValues(profile));
      return;
    }
    setSubmitError(null);
    updateProfileMutation.mutate({ data: changes });
  };

  const isSaving = updateProfileMutation.isPending;

  return (
    <form
      noValidate
      aria-label="Editar perfil"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      {submitError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          {...register("firstName")}
          label="Nombre"
          labelPlacement="outside"
          placeholder="Tu nombre"
          autoComplete="given-name"
          isRequired
          isDisabled={isSaving}
          isInvalid={!!errors.firstName}
          errorMessage={errors.firstName?.message}
        />
        <Input
          {...register("lastName")}
          label="Apellido"
          labelPlacement="outside"
          placeholder="Tu apellido"
          autoComplete="family-name"
          isDisabled={isSaving}
          isInvalid={!!errors.lastName}
          errorMessage={errors.lastName?.message}
        />
        <Input
          {...register("phone")}
          label="Teléfono"
          labelPlacement="outside"
          placeholder="3001234567"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          description="Número colombiano de 10 dígitos"
          isDisabled={isSaving}
          isInvalid={!!errors.phone}
          errorMessage={errors.phone?.message}
        />
        <Input
          label="Correo electrónico"
          labelPlacement="outside"
          value={profile.email}
          isReadOnly
          description="El correo no se puede modificar"
        />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="flat"
          isDisabled={!isDirty || isSaving}
          onPress={() => {
            setSubmitError(null);
            reset(toFormValues(profile));
          }}
        >
          Descartar cambios
        </Button>
        <Button
          type="submit"
          color="primary"
          isLoading={isSaving}
          isDisabled={!isDirty || isSaving}
        >
          Guardar cambios
        </Button>
      </div>
    </form>
  );
};
