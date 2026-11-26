"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Plus } from "lucide-react";

import { createTermInputSchema, useCreateTerm } from "../api/create-term";
import { formatTermCode, useTerms } from "../api/get-terms";

import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";

type TermFieldProps = {
  /** Id of the chosen term; "" or undefined while there is none */
  value: string | number | undefined;
  onChange: (termId: number) => void;
  /** Loads the terms only while the form is open */
  isOpen: boolean;
  errorMessage?: string;
  /** Shown under the select while there is no error */
  description?: string;
  placeholder?: string;
  isRequired?: boolean;
};

/**
 * Academic term of an event: picks one of the existing terms, or creates the one that is missing
 * (year and period code, such as 2026 and 10) without leaving the form. The new term is chosen
 * right away; if it already exists, the backend error is shown.
 */
export function TermField({
  value,
  onChange,
  isOpen,
  errorMessage,
  description,
  placeholder,
  isRequired,
}: TermFieldProps) {
  const termsQuery = useTerms({ queryConfig: { enabled: isOpen } });
  const terms = termsQuery.data ?? [];

  const [showCreate, setShowCreate] = useState(false);
  const [year, setYear] = useState("");
  const [period, setPeriod] = useState("");
  const [createError, setCreateError] = useState<string | undefined>();

  const createTermMutation = useCreateTerm({
    mutationConfig: {
      onSuccess: (term) => {
        onChange(term.id);
        setYear("");
        setPeriod("");
        setCreateError(undefined);
        setShowCreate(false);
      },
      onError: (error: unknown) => {
        setCreateError(
          (error as Error)?.message ||
            "No se pudo crear el periodo. Intente nuevamente.",
        );
      },
    },
  });

  const handleCreate = () => {
    const parsed = createTermInputSchema.safeParse({ year, period });

    if (!parsed.success) {
      setCreateError(parsed.error.issues[0]?.message);

      return;
    }
    setCreateError(undefined);
    createTermMutation.mutate({ data: parsed.data });
  };

  const hasValue = value !== undefined && value !== "" && Number(value) > 0;

  return (
    <div className="flex flex-1 flex-col gap-2">
      <Select
        description={
          !termsQuery.isLoading && terms.length === 0
            ? "No hay periodos académicos creados. Cree el que necesita."
            : description
        }
        errorMessage={errorMessage}
        isInvalid={Boolean(errorMessage)}
        isLoading={termsQuery.isLoading}
        isRequired={isRequired}
        label="Periodo Académico"
        name="termId"
        placeholder={
          termsQuery.isLoading
            ? "Cargando periodos..."
            : (placeholder ?? "Seleccione el periodo del evento")
        }
        selectedKeys={hasValue ? new Set([String(value)]) : new Set([])}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0];

          if (selected !== undefined) {
            onChange(Number(selected));
          }
        }}
      >
        {terms.map((term) => (
          <SelectItem key={String(term.id)}>{formatTermCode(term)}</SelectItem>
        ))}
      </Select>

      {!showCreate ? (
        <Button
          className="self-start"
          size="sm"
          startContent={<Plus className="h-4 w-4" />}
          type="button"
          variant="light"
          onPress={() => setShowCreate(true)}
        >
          Crear periodo
        </Button>
      ) : (
        <div className="space-y-3 rounded-lg border border-default-200 p-3">
          <p className="text-sm text-default-500">
            Ingrese el año y el código del periodo; por ejemplo 2026 y 10 es el
            periodo 202610.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              inputMode="numeric"
              label="Año"
              name="newTermYear"
              placeholder="Ej: 2026"
              value={year}
              onValueChange={(next) => {
                setYear(next.replace(/\D/g, "").slice(0, 4));
                setCreateError(undefined);
              }}
            />
            <Input
              inputMode="numeric"
              label="Código del periodo"
              name="newTermPeriod"
              placeholder="Ej: 10"
              value={period}
              onValueChange={(next) => {
                setPeriod(next.replace(/\D/g, "").slice(0, 2));
                setCreateError(undefined);
              }}
            />
          </div>
          {createError && (
            <p className="text-sm text-danger" role="alert">
              {createError}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              color="primary"
              isLoading={createTermMutation.isPending}
              size="sm"
              type="button"
              onPress={handleCreate}
            >
              Crear y elegir
            </Button>
            <Button
              size="sm"
              type="button"
              variant="light"
              onPress={() => {
                setShowCreate(false);
                setYear("");
                setPeriod("");
                setCreateError(undefined);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
