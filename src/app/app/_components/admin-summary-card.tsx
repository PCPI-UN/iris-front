"use client";

import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";

import { useDashboardStats } from "@/features/dashboard/api/get-dashboard-stats";
import { Spinner } from "@/components/ui/spinner";
import { paths } from "@/config/paths";

/** Square entry to the administration panel with its main figures, the first tile of the grid */
export const AdminSummaryCard = () => {
  const { data: stats, isLoading } = useDashboardStats();

  const figures = [
    { label: "Eventos activos", value: stats?.activeEvents },
    { label: "Proyectos", value: stats?.totalProjects },
    { label: "Evaluaciones", value: stats?.evaluations },
  ];

  return (
    <Link
      className="group relative flex w-full flex-col gap-5 overflow-hidden rounded-3xl border border-pink-500/25 bg-gradient-to-br from-pink-500/15 via-[#0e101a]/80 to-[#0e101a]/80 p-5 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-pink-400/50 hover:shadow-lg hover:shadow-pink-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 sm:min-h-72 [&>*]:shrink-0"
      href={paths.app.admin.getHref()}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-14 -top-14 size-44 rounded-full bg-pink-500/20 blur-3xl"
      />

      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-pink-400/30 bg-pink-500/15">
          <Shield aria-hidden="true" className="size-5 text-pink-300" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold leading-tight text-white">
            Administración
          </h2>
          <p className="text-xs text-slate-400">Toda la plataforma</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <dl className="grid flex-1 grid-cols-3 items-start content-center gap-2">
          {figures.map(({ label, value }) => (
            <div
              key={label}
              className="flex min-w-0 flex-col-reverse justify-end"
            >
              <dt className="text-[11px] leading-tight text-slate-400">
                {label}
              </dt>
              <dd className="text-3xl font-bold tabular-nums text-white">
                {value ?? "–"}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <span className="mt-auto flex min-h-[44px] items-center justify-between gap-2 rounded-xl border border-pink-500/40 bg-pink-500/10 px-4 text-sm font-semibold text-pink-200 transition-colors group-hover:bg-pink-500/20">
        Abrir panel
        <ArrowRight
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
};
