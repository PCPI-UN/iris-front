"use client";

import { AlertTriangle } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import {
  AdminProjectChanges,
  getCategoryChangeBlockedDetails,
  isProjectChangedMeanwhile,
  isProjectNameTaken,
  useAdminUpdateProject,
} from "../../api/admin-update-project";
import { useCategoriesByEvent } from "../../api/use-category";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotifications } from "@/components/ui/notifications";
import { Select, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const REASON_MAX_LENGTH = 1000;

/** Limits of PATCH /projects/:id/admin */
const LIMITS = { name: 255, projectCode: 50, eventNumber: 150 } as const;

export type AdminInfoProject = {
  id: number;
  eventId: number;
  name: string;
  description?: string | null;
  projectCode?: string | null;
  eventNumber?: string | null;
  courseId?: number | null;
  categoryId?: number | null;
};

type FormValues = {
  name: string;
  description: string;
  projectCode: string;
  eventNumber: string;
  courseId: string;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

const toFormValues = (project: AdminInfoProject): FormValues => ({
  name: project.name ?? "",
  description: project.description ?? "",
  projectCode: project.projectCode ?? "",
  eventNumber: project.eventNumber ?? "",
  courseId: String(project.courseId ?? project.categoryId ?? ""),
});

export const validateInfoForm = (values: FormValues): FieldErrors => {
  const errors: FieldErrors = {};

  if (!values.name.trim()) {
    errors.name = "El nombre del proyecto es obligatorio";
  } else if (values.name.trim().length > LIMITS.name) {
    errors.name = `El nombre no puede superar ${LIMITS.name} caracteres`;
  }
  if (values.projectCode.trim().length > LIMITS.projectCode) {
    errors.projectCode = `El código no puede superar ${LIMITS.projectCode} caracteres`;
  }
  if (values.eventNumber.trim().length > LIMITS.eventNumber) {
    errors.eventNumber = `El número en el evento no puede superar ${LIMITS.eventNumber} caracteres`;
  }
  if (!values.courseId) {
    errors.courseId = "Selecciona la categoría del proyecto";
  }

  return errors;
};

/** Only the fields that differ from the project; an emptied optional field is sent as null (clears it) */
export const buildChanges = (
  initial: FormValues,
  values: FormValues,
): AdminProjectChanges => {
  const changes: AdminProjectChanges = {};
  const name = values.name.trim();

  if (name !== initial.name.trim()) changes.name = name;
  (["description", "projectCode", "eventNumber"] as const).forEach((field) => {
    const value = values[field].trim();

    if (value !== initial[field].trim()) changes[field] = value || null;
  });
  if (values.courseId && values.courseId !== initial.courseId) {
    changes.courseId = Number(values.courseId);
  }

  return changes;
};

type AdminProjectInfoFormProps = {
  project: AdminInfoProject;
};

export const AdminProjectInfoForm = ({
  project,
}: AdminProjectInfoFormProps) => {
  const { addNotification } = useNotifications();
  const updateMutation = useAdminUpdateProject();
  const categoriesQuery = useCategoriesByEvent(project.eventId);

  const initial = useMemo(() => toFormValues(project), [project]);
  const [values, setValues] = useState<FormValues>(initial);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  /** Set when the backend asked to confirm the category change (409 PROJECT_CATEGORY_CHANGE_BLOCKED) */
  const [blocked, setBlocked] = useState<{
    evaluationCount: number;
    message: string;
  } | null>(null);

  const categories = useMemo(() => {
    const items = (categoriesQuery.data?.categories ?? []) as Array<{
      id: number | string;
      code?: string;
      description?: string;
    }>;
    const hasCurrent = items.some(
      (category) => String(category.id) === initial.courseId,
    );

    // The current category may be inactive: keep it selectable so the form shows it
    return hasCurrent || !initial.courseId || !categoriesQuery.isSuccess
      ? items
      : [
          ...items,
          { id: initial.courseId, code: `Categoría #${initial.courseId}` },
        ];
  }, [categoriesQuery.data, categoriesQuery.isSuccess, initial.courseId]);

  const changes = buildChanges(initial, values);
  const hasChanges = Object.keys(changes).length > 0;
  const isPending = updateMutation.isPending;

  const setField = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
    if (field === "courseId") setBlocked(null);
  };

  const submit = (force: boolean) => {
    const validation = validateInfoForm(values);

    setErrors(validation);
    if (Object.keys(validation).length > 0 || !hasChanges) return;

    updateMutation.mutate(
      { projectId: project.id, changes, reason, force },
      {
        onSuccess: () => {
          setBlocked(null);
          setReason("");
          addNotification({
            type: "success",
            title: "Proyecto actualizado",
            message:
              "Los cambios quedaron guardados en el historial del proyecto.",
          });
        },
        onError: (error) => {
          const blockedDetails = getCategoryChangeBlockedDetails(error);

          if (blockedDetails) {
            setBlocked({ ...blockedDetails, message: error.message });

            return;
          }
          if (isProjectNameTaken(error)) {
            setErrors((current) => ({ ...current, name: error.message }));

            return;
          }
          setFormError(
            isProjectChangedMeanwhile(error)
              ? "Otro cambio se guardó antes. Revisa los datos actuales del proyecto y vuelve a intentarlo."
              : error.message || "No se pudieron guardar los cambios",
          );
        },
      },
    );
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(false);
  };

  return (
    <form noValidate className="space-y-3" onSubmit={handleSubmit}>
      <Input
        isRequired
        errorMessage={errors.name}
        isDisabled={isPending}
        isInvalid={Boolean(errors.name)}
        label="Nombre"
        maxLength={LIMITS.name}
        value={values.name}
        onValueChange={(value) => setField("name", value)}
      />
      <Textarea
        isDisabled={isPending}
        label="Descripción"
        rows={4}
        value={values.description}
        onValueChange={(value) => setField("description", value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          errorMessage={errors.projectCode}
          isDisabled={isPending}
          isInvalid={Boolean(errors.projectCode)}
          label="Código"
          maxLength={LIMITS.projectCode}
          value={values.projectCode}
          onValueChange={(value) => setField("projectCode", value)}
        />
        <Input
          errorMessage={errors.eventNumber}
          isDisabled={isPending}
          isInvalid={Boolean(errors.eventNumber)}
          label="Número en el evento"
          maxLength={LIMITS.eventNumber}
          value={values.eventNumber}
          onValueChange={(value) => setField("eventNumber", value)}
        />
      </div>
      <Select
        isRequired
        errorMessage={errors.courseId}
        isDisabled={isPending}
        isInvalid={Boolean(errors.courseId)}
        isLoading={categoriesQuery.isLoading}
        label="Categoría"
        placeholder="Selecciona la categoría"
        selectedKeys={values.courseId ? [values.courseId] : []}
        selectionMode="single"
        onSelectionChange={(keys) => {
          const [key] = Array.from(keys as Set<string>);

          if (key) setField("courseId", String(key));
        }}
      >
        {categories.map((category) => (
          <SelectItem key={String(category.id)}>
            {category.code ?? `Categoría #${category.id}`}
          </SelectItem>
        ))}
      </Select>
      <Textarea
        description="Opcional. Queda en el historial del proyecto."
        isDisabled={isPending}
        label="Motivo"
        maxLength={REASON_MAX_LENGTH}
        placeholder="Explica por qué se corrigen los datos..."
        rows={2}
        value={reason}
        onValueChange={setReason}
      />

      {formError && (
        <p className="text-sm text-danger" role="alert">
          {formError}
        </p>
      )}

      {blocked && (
        <div
          className="space-y-2 rounded-lg border border-warning-400/40 bg-warning-400/10 p-3 text-sm"
          role="alert"
        >
          <div className="flex items-center gap-2 font-semibold text-warning-500">
            <AlertTriangle className="h-4 w-4" />
            <span>El cambio de categoría necesita confirmación</span>
          </div>
          <p>
            {blocked.evaluationCount === 1
              ? "El proyecto ya tiene 1 evaluación de jurados, calificada con las rúbricas de la categoría actual."
              : blocked.evaluationCount > 1
                ? `El proyecto ya tiene ${blocked.evaluationCount} evaluaciones de jurados, calificadas con las rúbricas de la categoría actual.`
                : blocked.message}
          </p>
          <p>
            No se ha cambiado nada. ¿Quieres cambiar la categoría de todas
            formas?
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          isDisabled={isPending || !hasChanges}
          variant="light"
          onPress={() => {
            setValues(initial);
            setErrors({});
            setFormError(null);
            setBlocked(null);
          }}
        >
          Descartar cambios
        </Button>
        {blocked ? (
          <Button
            color="danger"
            isDisabled={isPending || !hasChanges}
            isLoading={isPending}
            onPress={() => submit(true)}
          >
            Cambiar de todas formas
          </Button>
        ) : (
          <Button
            color="primary"
            isDisabled={isPending || !hasChanges}
            isLoading={isPending}
            type="submit"
          >
            Guardar cambios
          </Button>
        )}
      </div>
    </form>
  );
};
