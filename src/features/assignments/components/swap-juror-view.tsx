"use client";

import type { EventJuror } from "@/features/juries/api/get-event-juries";

import { ArrowLeft, ArrowLeftRight, Check, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import {
  type AssignedJuror,
  formatJurorName,
  getAvailableReplacementJurors,
} from "../utils/juror-swap";

type SwapJurorViewProps = {
  projectName: string;
  currentJuror: AssignedJuror;
  assignedJurors: AssignedJuror[];
  eventJurors: EventJuror[];
  isLoadingJurors: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onConfirm: (replacement: EventJuror) => Promise<void> | void;
};

export const SwapJurorView = ({
  projectName,
  currentJuror,
  assignedJurors,
  eventJurors,
  isLoadingJurors,
  isSubmitting,
  onBack,
  onConfirm,
}: SwapJurorViewProps) => {
  const [search, setSearch] = useState("");
  const [selectedJurorId, setSelectedJurorId] = useState<string | null>(null);

  const allAvailableJurors = useMemo(
    () => getAvailableReplacementJurors(eventJurors, assignedJurors),
    [assignedJurors, eventJurors],
  );

  const filteredJurors = useMemo(
    () => getAvailableReplacementJurors(eventJurors, assignedJurors, search),
    [assignedJurors, eventJurors, search],
  );

  const selectedJuror = useMemo(
    () =>
      allAvailableJurors.find(
        (juror) => String(juror.id) === String(selectedJurorId),
      ) ?? null,
    [allAvailableJurors, selectedJurorId],
  );

  const currentJurorName = formatJurorName(currentJuror);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-white/10 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="light"
            isDisabled={isSubmitting}
            onPress={onBack}
            className="min-w-0 px-2"
            aria-label="Volver a detalles del proyecto"
          >
            <ArrowLeft size={16} />
          </Button>
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <ArrowLeftRight className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">Intercambiar jurado</span>
            </h2>
            <p className="truncate text-xs text-muted-foreground">
              {projectName}
            </p>
          </div>
        </div>

        {/* Context banner: outgoing -> incoming */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">Jurado actual</span>
            <span className="truncate font-medium text-foreground">
              {currentJurorName}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-xs">
            <span className="text-muted-foreground">Reemplazo</span>
            <span
              className={`truncate font-medium ${
                selectedJuror ? "text-cyan-300" : "text-muted-foreground italic"
              }`}
            >
              {selectedJuror
                ? formatJurorName(selectedJuror)
                : "Sin seleccionar"}
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            aria-label="Buscar jurado disponible"
            placeholder="Buscar jurado disponible..."
            value={search}
            disabled={isSubmitting}
            onChange={(e) => setSearch(e.target.value)}
            className="flex w-full rounded-xl border border-white/10 bg-white/10 py-2.5 pl-9 pr-8 text-sm outline-none transition focus:border-cyan-400/60"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {!isLoadingJurors && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            {filteredJurors.length} jurado
            {filteredJurors.length === 1 ? "" : "s"} disponible
            {filteredJurors.length === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {/* Available jurors list */}
      <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-2">
        {isLoadingJurors ? (
          <div className="flex min-h-[140px] flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <Spinner size="sm" />
            <span>Cargando jurados disponibles...</span>
          </div>
        ) : allAvailableJurors.length === 0 ? (
          <div className="flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-muted-foreground">
            No hay otros jurados disponibles en este evento para intercambiar.
          </div>
        ) : filteredJurors.length === 0 ? (
          <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-muted-foreground">
            No se encontraron jurados disponibles con ese criterio.
          </div>
        ) : (
          <div
            role="radiogroup"
            aria-label="Jurados disponibles para intercambio"
            className="space-y-2"
          >
            {filteredJurors.map((candidate) => {
              const candidateId = String(candidate.id);
              const isSelected = selectedJurorId === candidateId;
              const candidateName = formatJurorName(candidate);
              const assignedCount = candidate.assignedProjects?.length ?? 0;

              return (
                <button
                  key={candidateId}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={isSubmitting}
                  onClick={() => setSelectedJurorId(candidateId)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    isSelected
                      ? "border-cyan-400 bg-cyan-500/15"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {candidateName}
                      </p>
                      {candidate.email && (
                        <p className="truncate text-xs text-muted-foreground">
                          {candidate.email}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {assignedCount} proyecto
                        {assignedCount === 1 ? "" : "s"} asignado
                        {assignedCount === 1 ? "" : "s"}
                      </p>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium ${
                        isSelected
                          ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
                          : "border-white/15 text-muted-foreground"
                      }`}
                    >
                      {isSelected && <Check size={12} />}
                      {isSelected ? "Seleccionado" : "Disponible"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-2 border-t border-white/10 p-4">
        <Button
          variant="light"
          isDisabled={isSubmitting}
          onPress={onBack}
          className="w-full"
        >
          Cancelar
        </Button>
        <Button
          color="primary"
          isDisabled={!selectedJuror || isSubmitting}
          isLoading={isSubmitting}
          startContent={!isSubmitting ? <ArrowLeftRight size={16} /> : undefined}
          onPress={() => {
            if (selectedJuror) {
              void onConfirm(selectedJuror);
            }
          }}
          className="w-full"
        >
          Intercambiar
        </Button>
      </div>
    </div>
  );
};

