"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Search, XCircle } from "lucide-react";

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

import type { JurorImportRow } from "../../types/juror-import";
import {
  getOutcomeMeta,
  getUserStatusMeta,
  isRowWarning,
} from "../../utils/juror-import-helpers";

type FilterOption = "ALL" | "ASSIGN" | "SKIP" | "WARNING" | "ERROR";

type JurorImportRowsTableProps = {
  rows: JurorImportRow[];
  mode: "preview" | "execute";
};

export const JurorImportRowsTable = ({
  rows,
  mode,
}: JurorImportRowsTableProps) => {
  const [filter, setFilter] = useState<FilterOption>("ALL");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    let assign = 0;
    let skip = 0;
    let warning = 0;
    let error = 0;

    for (const row of rows) {
      if (row.outcome === "ASSIGN") assign++;
      if (row.outcome === "SKIP") skip++;
      if (row.outcome === "ERROR") error++;
      if (isRowWarning(row)) warning++;
    }

    return { all: rows.length, assign, skip, warning, error };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (filter === "ASSIGN" && row.outcome !== "ASSIGN") return false;
      if (filter === "SKIP" && row.outcome !== "SKIP") return false;
      if (filter === "ERROR" && row.outcome !== "ERROR") return false;
      if (filter === "WARNING" && !isRowWarning(row)) return false;

      if (!query) return true;

      const haystack = [
        String(row.rowNumber),
        String(row.jurorSlot),
        row.email,
        row.projectName ?? "",
        row.projectId !== null ? String(row.projectId) : "",
        row.message,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [rows, filter, search]);

  const filterButtons: { key: FilterOption; label: string; count: number }[] = [
    { key: "ALL", label: "Todas", count: counts.all },
    {
      key: "ASSIGN",
      label: mode === "preview" ? "Por asignar" : "Asignados",
      count: counts.assign,
    },
    { key: "SKIP", label: "Omitidos", count: counts.skip },
    ...(counts.warning > 0
      ? [{ key: "WARNING" as const, label: "Avisos", count: counts.warning }]
      : []),
    { key: "ERROR", label: "Errores", count: counts.error },
  ];

  return (
    <div className="space-y-4">
      {/* Filtros y búsqueda */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar filas por resultado">
          {filterButtons.map((btn) => (
            <Button
              key={btn.key}
              size="sm"
              variant={filter === btn.key ? "flat" : "bordered"}
              color={
                btn.key === "ERROR" && filter === btn.key
                  ? "danger"
                  : btn.key === "WARNING" && filter === btn.key
                    ? "warning"
                    : btn.key === "ASSIGN" && filter === btn.key
                      ? "success"
                      : "default"
              }
              onPress={() => setFilter(btn.key)}
            >
              {btn.label} ({btn.count})
            </Button>
          ))}
        </div>

        <Input
          isClearable
          size="sm"
          className="w-full lg:max-w-sm"
          placeholder="Buscar por correo, proyecto, fila o mensaje..."
          startContent={<Search className="h-4 w-4 text-default-400" />}
          value={search}
          onClear={() => setSearch("")}
          onValueChange={setSearch}
        />
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <Table
          aria-label={
            mode === "preview"
              ? "Vista previa de asignaciones desde Excel"
              : "Resumen de asignaciones ejecutadas"
          }
          selectionMode="none"
          classNames={{ wrapper: "bg-transparent shadow-none" }}
        >
          <TableHeader>
            <TableColumn className="w-16">Fila</TableColumn>
            <TableColumn>Proyecto</TableColumn>
            <TableColumn className="w-24">Ranura</TableColumn>
            <TableColumn>Correo del jurado</TableColumn>
            <TableColumn className="w-40">Estado usuario</TableColumn>
            <TableColumn className="w-44">Resultado</TableColumn>
            <TableColumn>Detalle / Mensaje</TableColumn>
          </TableHeader>
          <TableBody
            items={filteredRows}
            emptyContent="No hay registros que coincidan con el filtro aplicado."
          >
            {(row) => {
              const outcomeMeta = getOutcomeMeta(row, mode);
              const userStatusMeta = getUserStatusMeta(row.userStatus);
              const rowHasWarning = isRowWarning(row);

              return (
                <TableRow
                  key={`${row.rowNumber}-${row.jurorSlot}-${row.email}-${row.projectId ?? "none"}`}
                >
                  <TableCell className="font-mono text-xs text-default-400">
                    #{row.rowNumber}
                  </TableCell>

                  <TableCell>
                    <div className="min-w-[160px]">
                      <p className="text-sm font-medium text-foreground">
                        {row.projectName || "Sin nombre de proyecto"}
                      </p>
                      {row.projectId !== null && (
                        <p className="text-xs text-default-400">
                          ID Proyecto: {row.projectId}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-sm text-default-300">
                    Jurado {row.jurorSlot}
                  </TableCell>

                  <TableCell className="text-sm text-foreground break-all">
                    {row.email || "—"}
                  </TableCell>

                  <TableCell>
                    <Chip size="sm" variant="flat" color={userStatusMeta.color}>
                      {userStatusMeta.label}
                    </Chip>
                  </TableCell>

                  <TableCell>
                    <Chip size="sm" variant="flat" color={outcomeMeta.color}>
                      {outcomeMeta.label}
                    </Chip>
                  </TableCell>

                  <TableCell>
                    {row.message ? (
                      <div className="flex items-start gap-1.5 text-xs leading-relaxed">
                        {row.outcome === "ERROR" ? (
                          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                        ) : rowHasWarning ? (
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                        ) : (
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-default-400" />
                        )}
                        <span
                          className={
                            row.outcome === "ERROR"
                              ? "text-rose-300"
                              : rowHasWarning
                                ? "text-amber-200"
                                : "text-default-300"
                          }
                        >
                          {row.message}
                        </span>
                      </div>
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

