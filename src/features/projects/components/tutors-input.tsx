"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Search, UserPlus, X } from "lucide-react";

import { useTutorCandidates } from "../api/get-tutor-candidates";
import {
  isSearchLongEnough,
  pendingTutorSchema,
  TutorCandidate,
  tutorFullName,
  TutorsValue,
} from "../utils/tutors";

import { Input } from "@/components/ui/input";

type TutorsInputProps = {
  value: TutorsValue;
  onChange: (value: TutorsValue) => void;
  isDisabled?: boolean;
};

const TutorPill = ({
  label,
  name,
  tone,
  onRemove,
}: {
  label: string;
  name?: string;
  tone: "linked" | "pending";
  onRemove?: () => void;
}) => (
  <li
    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ${
      tone === "pending"
        ? "bg-warning/15 text-warning-600"
        : "bg-primary/15 text-primary"
    }`}
  >
    <span>{label}</span>
    {onRemove && (
      <button
        aria-label={`Quitar a ${name ?? label}`}
        className="rounded-full p-0.5 hover:bg-black/10"
        type="button"
        onClick={onRemove}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    )}
  </li>
);

const EMPTY_PENDING = { firstName: "", lastName: "", email: "" };

/**
 * Tutors of a project: search among the registered tutors and professors and, when the tutor
 * does not appear, type their name and email so they are invited once the project is approved.
 */
export function TutorsInput({ value, onChange, isDisabled }: TutorsInputProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showPendingForm, setShowPendingForm] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(EMPTY_PENDING);
  const [pendingError, setPendingError] = useState<string | undefined>();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);

    return () => clearTimeout(timer);
  }, [search]);

  const canSearch = isSearchLongEnough(debouncedSearch);
  const candidatesQuery = useTutorCandidates({ search: debouncedSearch });
  const selectedIds = new Set(value.linked.map((tutor) => tutor.id));
  const results = (candidatesQuery.data ?? []).filter(
    (candidate) => !selectedIds.has(candidate.id),
  );

  const addLinked = (candidate: TutorCandidate) => {
    onChange({ ...value, linked: [...value.linked, candidate] });
    setSearch("");
    setDebouncedSearch("");
  };

  const removeLinked = (id: number) => {
    onChange({
      ...value,
      linked: value.linked.filter((tutor) => tutor.id !== id),
    });
  };

  const removePending = (email: string) => {
    onChange({
      ...value,
      pending: value.pending.filter((tutor) => tutor.email !== email),
    });
  };

  const addPending = () => {
    const parsed = pendingTutorSchema.safeParse(pendingDraft);

    if (!parsed.success) {
      setPendingError(parsed.error.issues[0]?.message);

      return;
    }

    const email = parsed.data.email.toLowerCase();

    if (value.pending.some((tutor) => tutor.email.toLowerCase() === email)) {
      setPendingError("Ese correo ya está en la lista de tutores");

      return;
    }

    onChange({
      ...value,
      pending: [...value.pending, { ...parsed.data, email }],
    });
    setPendingDraft(EMPTY_PENDING);
    setPendingError(undefined);
    setShowPendingForm(false);
  };

  const hasSelection = value.linked.length + value.pending.length > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Input
          autoComplete="off"
          description="Profesores y tutores registrados en Iris."
          isDisabled={isDisabled}
          label="Buscar tutor"
          placeholder="Escriba al menos 3 letras del nombre o apellido"
          startContent={<Search className="h-4 w-4 text-default-400" />}
          value={search}
          onValueChange={setSearch}
        />

        {canSearch && (
          <ul
            aria-label="Resultados de la búsqueda de tutores"
            className="divide-y divide-default-200 rounded-lg border border-default-200"
          >
            {candidatesQuery.isLoading && (
              <li className="p-3 text-sm text-default-500">Buscando...</li>
            )}
            {!candidatesQuery.isLoading && results.length === 0 && (
              <li className="p-3 text-sm text-default-500">
                No encontramos tutores con ese nombre. Si no aparece, agréguelo
                con su nombre y correo.
              </li>
            )}
            {results.map((candidate) => (
              <li key={candidate.id}>
                <button
                  className="w-full p-3 text-left text-sm transition-colors hover:bg-default-100"
                  disabled={isDisabled}
                  type="button"
                  onClick={() => addLinked(candidate)}
                >
                  {tutorFullName(candidate)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!showPendingForm ? (
        <Button
          isDisabled={isDisabled}
          size="sm"
          startContent={<UserPlus className="h-4 w-4" />}
          type="button"
          variant="light"
          onPress={() => setShowPendingForm(true)}
        >
          No encuentro al tutor
        </Button>
      ) : (
        <div className="space-y-3 rounded-lg border border-default-200 p-4">
          <p className="text-sm text-default-500">
            El tutor quedará pendiente y recibirá una invitación por correo
            cuando el proyecto sea aprobado.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              isRequired
              label="Nombre(s)"
              value={pendingDraft.firstName}
              onValueChange={(firstName) =>
                setPendingDraft((prev) => ({ ...prev, firstName }))
              }
            />
            <Input
              label="Apellido(s)"
              value={pendingDraft.lastName}
              onValueChange={(lastName) =>
                setPendingDraft((prev) => ({ ...prev, lastName }))
              }
            />
          </div>
          <Input
            isRequired
            label="Correo del tutor"
            type="email"
            value={pendingDraft.email}
            onValueChange={(email) =>
              setPendingDraft((prev) => ({ ...prev, email }))
            }
          />
          {pendingError && (
            <p className="text-sm text-danger" role="alert">
              {pendingError}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              color="primary"
              size="sm"
              type="button"
              onPress={addPending}
            >
              Agregar tutor
            </Button>
            <Button
              size="sm"
              type="button"
              variant="light"
              onPress={() => {
                setShowPendingForm(false);
                setPendingDraft(EMPTY_PENDING);
                setPendingError(undefined);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {hasSelection && (
        <ul aria-label="Tutores del proyecto" className="flex flex-wrap gap-2">
          {value.linked.map((tutor) => (
            <TutorPill
              key={`linked-${tutor.id}`}
              label={tutorFullName(tutor)}
              tone="linked"
              onRemove={isDisabled ? undefined : () => removeLinked(tutor.id)}
            />
          ))}
          {value.pending.map((tutor) => (
            <TutorPill
              key={`pending-${tutor.email}`}
              label={`${tutorFullName(tutor)} · ${tutor.email} · Pendiente`}
              name={tutorFullName(tutor)}
              tone="pending"
              onRemove={
                isDisabled ? undefined : () => removePending(tutor.email)
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}
