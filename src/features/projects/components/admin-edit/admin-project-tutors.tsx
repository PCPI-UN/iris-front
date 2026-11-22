"use client";

import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";

import {
  PendingTutorInput,
  ProjectTutor,
  TUTOR_SEARCH_MIN_LENGTH,
  useSetProjectTutors,
  useTutorCandidates,
} from "../../api/project-tutors";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotifications } from "@/components/ui/notifications";

type TutorRow =
  | { kind: "linked"; userId: number; name: string }
  | { kind: "pending"; tutor: PendingTutorInput; name: string };

const tutorName = (tutor: {
  firstName?: string | null;
  lastName?: string | null;
}) => `${tutor.firstName ?? ""} ${tutor.lastName ?? ""}`.trim() || "Sin nombre";

const rowKey = (row: TutorRow) =>
  row.kind === "linked"
    ? `user-${row.userId}`
    : `pending-${row.tutor.email.toLowerCase()}`;

const toRows = (tutors: ProjectTutor[]): TutorRow[] =>
  tutors.flatMap<TutorRow>((tutor) => {
    if (!tutor.pending && tutor.userId) {
      return [{ kind: "linked", userId: tutor.userId, name: tutorName(tutor) }];
    }
    if (tutor.pending && tutor.email) {
      return [
        {
          kind: "pending",
          name: tutorName(tutor),
          tutor: {
            firstName: tutor.firstName,
            lastName: tutor.lastName ?? undefined,
            email: tutor.email,
          },
        },
      ];
    }

    return [];
  });

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY_PENDING: PendingTutorInput = {
  firstName: "",
  lastName: "",
  email: "",
};

type AdminProjectTutorsProps = {
  projectId: number;
  tutors: ProjectTutor[];
};

/**
 * Tutors of the project, replaced as a whole with PUT /projects/:id/tutors: users with
 * the Tutor or Professor role found by name, or tutors typed in by name and email.
 */
export const AdminProjectTutors = ({
  projectId,
  tutors,
}: AdminProjectTutorsProps) => {
  const { addNotification } = useNotifications();
  const setTutorsMutation = useSetProjectTutors();

  const initialRows = useMemo(() => toRows(tutors), [tutors]);
  const [rows, setRows] = useState<TutorRow[]>(initialRows);
  const [search, setSearch] = useState("");
  const [pendingDraft, setPendingDraft] =
    useState<PendingTutorInput>(EMPTY_PENDING);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const candidatesQuery = useTutorCandidates(search);
  const selectedUserIds = new Set(
    rows.flatMap((row) => (row.kind === "linked" ? [row.userId] : [])),
  );
  const candidates = (candidatesQuery.data ?? []).filter(
    (candidate) => !selectedUserIds.has(candidate.id),
  );

  const initialKeys = initialRows.map(rowKey).sort().join("|");
  const currentKeys = rows.map(rowKey).sort().join("|");
  const hasChanges = initialKeys !== currentKeys;
  const isPending = setTutorsMutation.isPending;

  const addRow = (row: TutorRow) => {
    setError(null);
    setRows((current) =>
      current.some((item) => rowKey(item) === rowKey(row))
        ? current
        : [...current, row],
    );
  };

  const addPending = () => {
    const firstName = pendingDraft.firstName.trim();
    const email = pendingDraft.email.trim();

    if (!firstName || !EMAIL_PATTERN.test(email)) {
      setPendingError("Escribe el nombre y un correo válido del tutor");

      return;
    }
    setPendingError(null);
    addRow({
      kind: "pending",
      name: tutorName(pendingDraft),
      tutor: { firstName, lastName: pendingDraft.lastName?.trim(), email },
    });
    setPendingDraft(EMPTY_PENDING);
  };

  const save = () => {
    setError(null);
    setTutorsMutation.mutate(
      {
        projectId,
        userIds: rows.flatMap((row) =>
          row.kind === "linked" ? [row.userId] : [],
        ),
        pending: rows.flatMap((row) =>
          row.kind === "pending" ? [row.tutor] : [],
        ),
        reason,
      },
      {
        onSuccess: (response) => {
          if (response?.tutors) setRows(toRows(response.tutors));
          setReason("");
          addNotification({
            type: "success",
            title: "Tutores actualizados",
            message: "Los tutores del proyecto quedaron guardados.",
          });
        },
        onError: (mutationError) =>
          setError(
            mutationError.message || "No se pudieron guardar los tutores",
          ),
      },
    );
  };

  return (
    <div className="space-y-4">
      <section aria-label="Tutores del proyecto" className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-default-500">
            El proyecto no tiene tutores.
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={rowKey(row)}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/10 p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-default-500">
                    {row.kind === "linked"
                      ? "Usuario registrado"
                      : `Pendiente · ${row.tutor.email}`}
                  </p>
                </div>
                <Button
                  isIconOnly
                  aria-label={`Quitar tutor ${row.name}`}
                  isDisabled={isPending}
                  size="sm"
                  variant="light"
                  onPress={() =>
                    setRows((current) =>
                      current.filter((item) => rowKey(item) !== rowKey(row)),
                    )
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="space-y-2">
        <Input
          description={`Escribe al menos ${TUTOR_SEARCH_MIN_LENGTH} letras del nombre o el apellido.`}
          isDisabled={isPending}
          label="Buscar tutor registrado"
          value={search}
          onValueChange={setSearch}
        />
        {search.trim().length >= TUTOR_SEARCH_MIN_LENGTH && (
          <ul aria-label="Resultados de la búsqueda" className="space-y-1">
            {candidatesQuery.isLoading ? (
              <li className="text-xs text-default-500">Buscando...</li>
            ) : candidates.length === 0 ? (
              <li className="text-xs text-default-500">
                No hay tutores con ese nombre.
              </li>
            ) : (
              candidates.map((candidate) => (
                <li key={candidate.id}>
                  <Button
                    className="w-full justify-start"
                    size="sm"
                    startContent={<Plus className="h-4 w-4" />}
                    variant="flat"
                    onPress={() => {
                      addRow({
                        kind: "linked",
                        userId: candidate.id,
                        name: tutorName(candidate),
                      });
                      setSearch("");
                    }}
                  >
                    {tutorName(candidate)}
                  </Button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <div className="space-y-2 rounded-lg border border-white/10 p-3">
        <h3 className="text-sm font-semibold">Tutor sin cuenta</h3>
        <p className="text-xs text-default-500">
          Recibe la invitación por correo cuando el proyecto esté aprobado.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            isDisabled={isPending}
            label="Nombre del tutor"
            value={pendingDraft.firstName}
            onValueChange={(value) =>
              setPendingDraft((d) => ({ ...d, firstName: value }))
            }
          />
          <Input
            isDisabled={isPending}
            label="Apellido del tutor"
            value={pendingDraft.lastName}
            onValueChange={(value) =>
              setPendingDraft((d) => ({ ...d, lastName: value }))
            }
          />
          <Input
            isDisabled={isPending}
            label="Correo del tutor"
            type="email"
            value={pendingDraft.email}
            onValueChange={(value) =>
              setPendingDraft((d) => ({ ...d, email: value }))
            }
          />
        </div>
        {pendingError && (
          <p className="text-sm text-danger" role="alert">
            {pendingError}
          </p>
        )}
        <div className="flex justify-end">
          <Button
            isDisabled={isPending}
            size="sm"
            variant="flat"
            onPress={addPending}
          >
            Agregar a la lista
          </Button>
        </div>
      </div>

      <Input
        description="Opcional. Queda en el historial del proyecto."
        isDisabled={isPending}
        label="Motivo"
        maxLength={1000}
        value={reason}
        onValueChange={setReason}
      />
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button
          isDisabled={isPending || !hasChanges}
          variant="light"
          onPress={() => setRows(initialRows)}
        >
          Descartar cambios
        </Button>
        <Button
          color="primary"
          isDisabled={!hasChanges}
          isLoading={isPending}
          onPress={save}
        >
          Guardar tutores
        </Button>
      </div>
    </div>
  );
};
