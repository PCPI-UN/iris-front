"use client";

import type { ProjectImportRow } from "../../types/project-import";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import {
  ADMIN_INITIAL_STATE_LABELS,
  AdminInitialProjectState,
  getFailedEffectLabel,
} from "../../api/create-project-admin";
import { OUTCOME_META } from "../../utils/project-import-helpers";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Filter = "ALL" | "CREATE" | "SKIP" | "ERROR";

type ProjectImportRowsTableProps = {
  rows: ProjectImportRow[];
  mode: "preview" | "execute";
};

const isCreateRow = (row: ProjectImportRow) =>
  row.outcome === "CREATE" || row.outcome === "CREATED";

const stateLabel = (state: string | null) =>
  state
    ? (ADMIN_INITIAL_STATE_LABELS[state as AdminInitialProjectState] ?? state)
    : ADMIN_INITIAL_STATE_LABELS.APPROVED;

export const ProjectImportRowsTable = ({
  rows,
  mode,
}: ProjectImportRowsTableProps) => {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");

  const counts = useMemo(
    () => ({
      ALL: rows.length,
      CREATE: rows.filter(isCreateRow).length,
      SKIP: rows.filter((row) => row.outcome === "SKIP").length,
      ERROR: rows.filter((row) => row.outcome === "ERROR").length,
    }),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (filter === "CREATE" && !isCreateRow(row)) return false;
      if (filter === "SKIP" && row.outcome !== "SKIP") return false;
      if (filter === "ERROR" && row.outcome !== "ERROR") return false;
      if (!query) return true;

      return [
        String(row.rowNumber),
        row.projectName,
        row.categoryName ?? "",
        ...row.messages,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [rows, filter, search]);

  const filters: { key: Filter; label: string }[] = [
    { key: "ALL", label: "Todas" },
    { key: "CREATE", label: mode === "preview" ? "Por crear" : "Creados" },
    { key: "SKIP", label: "Omitidos" },
    { key: "ERROR", label: "Errores" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          aria-label="Filtrar filas por resultado"
          className="flex flex-wrap gap-2"
          role="group"
        >
          {filters.map((item) => (
            <Button
              key={item.key}
              color={
                filter !== item.key
                  ? "default"
                  : item.key === "ERROR"
                    ? "danger"
                    : item.key === "CREATE"
                      ? "success"
                      : "default"
              }
              size="sm"
              variant={filter === item.key ? "flat" : "bordered"}
              onPress={() => setFilter(item.key)}
            >
              {item.label} ({counts[item.key]})
            </Button>
          ))}
        </div>
        <Input
          isClearable
          className="w-full lg:max-w-sm"
          placeholder="Buscar por nombre, categoría, NRC, fila o mensaje..."
          size="sm"
          startContent={<Search className="h-4 w-4 text-default-400" />}
          value={search}
          onClear={() => setSearch("")}
          onValueChange={setSearch}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <Table
          aria-label={
            mode === "preview"
              ? "Vista previa de la carga de proyectos"
              : "Resumen de la carga de proyectos"
          }
          classNames={{ wrapper: "bg-transparent shadow-none" }}
          selectionMode="none"
        >
          <TableHeader>
            <TableColumn className="w-16">Fila</TableColumn>
            <TableColumn>Proyecto</TableColumn>
            <TableColumn>Categoría / NRC</TableColumn>
            <TableColumn className="w-32">Estado inicial</TableColumn>
            <TableColumn className="w-28">Integrantes</TableColumn>
            <TableColumn className="w-32">Resultado</TableColumn>
            <TableColumn>Detalle</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent="No hay filas que coincidan con el filtro aplicado."
            items={filteredRows}
          >
            {(row) => {
              const meta = OUTCOME_META[row.outcome];
              const details = [
                ...row.messages,
                ...row.failedEffects.map(getFailedEffectLabel),
              ];

              return (
                <TableRow key={`${row.rowNumber}-${row.projectName}`}>
                  <TableCell className="font-mono text-xs text-default-400">
                    #{row.rowNumber}
                  </TableCell>
                  <TableCell>
                    <p className="min-w-[160px] text-sm font-medium text-foreground">
                      {row.projectName || "Sin nombre"}
                    </p>
                    {row.projectId !== null && (
                      <p className="text-xs text-default-400">
                        ID proyecto: {row.projectId}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-default-300">
                    {row.categoryName ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-default-300">
                    {stateLabel(row.state)}
                  </TableCell>
                  <TableCell className="text-sm text-default-300">
                    {row.participantsCount}
                  </TableCell>
                  <TableCell>
                    <Chip color={meta.color} size="sm" variant="flat">
                      {meta.label}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {details.length > 0 ? (
                      <ul
                        className={`space-y-0.5 text-xs ${
                          row.outcome === "ERROR"
                            ? "text-rose-300"
                            : row.failedEffects.length > 0
                              ? "text-amber-200"
                              : "text-default-300"
                        }`}
                      >
                        {details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-default-500">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            }}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
