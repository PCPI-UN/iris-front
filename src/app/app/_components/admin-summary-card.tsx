"use client";

import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";

import { useDashboardStats } from "@/features/dashboard/api/get-dashboard-stats";
import { Spinner } from "@/components/ui/spinner";
import { paths } from "@/config/paths";

/** Entry to the administration panel with its main figures; read-only staff (the dean) is marked */
export const AdminSummaryCard = () => {
  const { data: stats, isLoading } = useDashboardStats();

  const figures = [
    { label: "eventos activos", value: stats?.activeEvents },
    { label: "proyectos", value: stats?.totalProjects },
    { label: "evaluaciones", value: stats?.evaluations },
  ];

  return (
    <section aria-labelledby="admin-summary-title" className="space-y-3">
      <h2
        className="flex items-center gap-2 text-base font-bold tracking-tight text-white sm:text-lg"
        id="admin-summary-title"
      >
        <Shield aria-hidden="true" className="size-4.5 text-pink-400" />
        <span>Administración</span>
      </h2>
      <Link
        className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0e101a]/70 p-4 backdrop-blur-xl transition-colors hover:border-pink-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 sm:p-5 md:flex-row md:items-center md:justify-between"
        href={paths.app.admin.getHref()}
      >
        {isLoading ? (
          <div className="flex h-12 items-center">
            <Spinner />
          </div>
        ) : (
          <dl className="grid grid-cols-3 gap-2 md:gap-6">
            {figures.map(({ label, value }) => (
              <div key={label} className="min-w-0">
                <dd className="text-xl font-bold text-white">{value ?? "–"}</dd>
                <dt className="text-[11px] uppercase leading-tight tracking-wide text-slate-400">
                  {label}
                </dt>
              </div>
            ))}
          </dl>
        )}
        <span className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-pink-500/40 bg-pink-500/10 px-4 text-sm font-semibold text-pink-300">
          Abrir panel de administración
          <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
        </span>
      </Link>
    </section>
  );
};
