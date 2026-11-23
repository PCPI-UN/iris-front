"use client";

import Link from "next/link";
import { ArrowRight, Calendar, FileCheck, Folder } from "lucide-react";

import { useDashboardStats } from "@/features/dashboard/api/get-dashboard-stats";
import { Spinner } from "@/components/ui/spinner";
import { paths } from "@/config/paths";

/** Compact entry to the administration panel with its main figures */
export const AdminSummaryCard = () => {
  const { data: stats, isLoading } = useDashboardStats();

  const figures = [
    { label: "Eventos activos", value: stats?.activeEvents, icon: Calendar },
    { label: "Proyectos", value: stats?.totalProjects, icon: Folder },
    { label: "Evaluaciones", value: stats?.evaluations, icon: FileCheck },
  ];

  return (
    <section
      aria-labelledby="admin-summary-title"
      className="space-y-3 rounded-2xl border border-white/10 bg-[#0e101a]/70 p-4 backdrop-blur-xl sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className="text-base font-bold tracking-tight text-white sm:text-lg"
          id="admin-summary-title"
        >
          Administración
        </h2>
        <Link
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          href={paths.app.admin.getHref()}
        >
          Ver panel de administración
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex h-12 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <dl className="grid grid-cols-3 gap-3">
          {figures.map(({ label, value, icon: Icon }) => (
            <div key={label} className="min-w-0">
              <dt className="flex items-start gap-1.5 text-xs leading-tight text-slate-400">
                <Icon
                  aria-hidden="true"
                  className="mt-px hidden size-3.5 shrink-0 sm:block"
                />
                {label}
              </dt>
              <dd className="text-xl font-bold text-white">{value ?? "–"}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
};
