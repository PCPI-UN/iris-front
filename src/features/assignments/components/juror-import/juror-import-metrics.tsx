"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Mail,
  MailCheck,
  SkipForward,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

import { Card, CardBody } from "@/components/ui/card";

import type { JurorImportTotals } from "../../types/juror-import";

type JurorImportMetricsProps = {
  totals: JurorImportTotals;
  mode: "preview" | "execute";
};

export const JurorImportMetrics = ({
  totals,
  mode,
}: JurorImportMetricsProps) => {
  const isPreview = mode === "preview";

  const cards = [
    {
      key: "rows",
      label: isPreview ? "Filas analizadas" : "Filas procesadas",
      value: totals.rows,
      icon: FileSpreadsheet,
      accent: "text-sky-400 border-sky-500/20 bg-sky-500/5",
    },
    {
      key: "assigned",
      label: isPreview ? "Por asignar" : "Asignados",
      value: totals.assigned,
      icon: CheckCircle2,
      accent: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    },
    {
      key: "skipped",
      label: isPreview ? "Ya asignados (omitidos)" : "Omitidos",
      value: totals.skipped,
      icon: SkipForward,
      accent: "text-slate-300 border-white/10 bg-white/5",
    },
    {
      key: "errors",
      label: "Errores",
      value: totals.errors,
      icon: XCircle,
      accent:
        totals.errors > 0
          ? "text-rose-400 border-rose-500/30 bg-rose-500/10"
          : "text-slate-400 border-white/10 bg-white/5",
    },
    ...(totals.warnings > 0
      ? [
          {
            key: "warnings",
            label: "Avisos (no bloqueantes)",
            value: totals.warnings,
            icon: AlertTriangle,
            accent: "text-amber-300 border-amber-500/30 bg-amber-500/10",
          },
        ]
      : []),
    {
      key: "jurors",
      label: "Jurados únicos",
      value: totals.jurors,
      icon: Users,
      accent: "text-indigo-300 border-indigo-500/20 bg-indigo-500/5",
    },
    {
      key: "invitationsSent",
      label: isPreview ? "Invitaciones por enviar" : "Invitaciones enviadas",
      value: totals.invitationsSent,
      icon: Mail,
      accent: "text-cyan-300 border-cyan-500/20 bg-cyan-500/5",
    },
    {
      key: "invitationsReused",
      label: "Invitaciones reutilizadas",
      value: totals.invitationsReused,
      icon: MailCheck,
      accent: "text-teal-300 border-teal-500/20 bg-teal-500/5",
    },
    {
      key: "newUsers",
      label: isPreview ? "Usuarios nuevos a crear" : "Usuarios nuevos creados",
      value: totals.newUsers,
      icon: UserPlus,
      accent: "text-violet-300 border-violet-500/20 bg-violet-500/5",
    },
  ];

  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      aria-label={isPreview ? "Resumen de vista previa" : "Resumen de ejecución"}
    >
      {cards.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.key}
            className={`glass-card border ${item.accent}`}
            shadow="none"
          >
            <CardBody className="p-3.5 sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-default-400">
                  {item.label}
                </span>
                <Icon className="h-4 w-4 shrink-0 opacity-85" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                {item.value}
              </p>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
};

