"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpenCheck, FolderKanban } from "lucide-react";

import { ProjectsTab } from "./projects-tab";

import { useAcademicEvents } from "@/features/academic/api/get-academic-events";
import {
  TEACHING_PROFILES,
  teachingProfileFromSlug,
} from "@/features/academic/utils/academic-profiles";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { paths } from "@/config/paths";

type TeachingTab = "projects" | "grades";

const TABS: { id: TeachingTab; label: string }[] = [
  { id: "projects", label: "Proyectos" },
  { id: "grades", label: "Notas" },
];

/**
 * Teaching screen, the same for professor and tutor: only the profile sent to
 * the back changes, and the back limits events and projects to its scope
 * (course sections or tutored projects).
 */
export const TeachingView = ({ profileSlug }: { profileSlug: string }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The gate only renders this view for a teaching profile of the session
  const profile = teachingProfileFromSlug(profileSlug) ?? "PROFESSOR";
  const texts = TEACHING_PROFILES[profile];
  const eventsQuery = useAcademicEvents({ profile });
  const events = eventsQuery.data ?? [];

  const requestedEvent = Number(searchParams?.get("event"));
  // An event outside the list (or none) opens the newest one
  const event = events.find((item) => item.id === requestedEvent) ?? events[0];
  const tab: TeachingTab =
    searchParams?.get("tab") === "grades" ? "grades" : "projects";

  const setParams = (changes: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams?.toString());

    Object.entries(changes).forEach(([key, value]) =>
      value ? params.set(key, value) : params.delete(key),
    );
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="dashboard-page max-w-6xl space-y-6 pb-12">
      <Link
        className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
        href={paths.app.root.getHref()}
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Inicio
      </Link>

      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-cyan-400">
            {texts.label}
          </p>
          <h1 className="break-words text-2xl font-bold tracking-tight md:text-3xl">
            {event?.name ?? "Proyectos académicos"}
          </h1>
          <p className="text-sm text-slate-400">
            {texts.description} en el evento
          </p>
        </div>
        {events.length > 1 && event && (
          <Select
            aria-label="Evento"
            className="w-full md:w-72"
            label="Evento"
            selectedKeys={[String(event.id)]}
            size="sm"
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];

              if (selected !== undefined)
                setParams({ event: String(selected) });
            }}
          >
            {events.map((item) => (
              <SelectItem key={String(item.id)}>{item.name}</SelectItem>
            ))}
          </Select>
        )}
      </header>

      {eventsQuery.isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : eventsQuery.isError ? (
        <div className="rounded-3xl border border-white/10 bg-[#0e101a]/70 p-6 text-center backdrop-blur-xl">
          <p className="text-sm text-slate-300">
            No se pudieron cargar los eventos.
          </p>
          <Button
            className="mt-3 min-h-[44px]"
            variant="flat"
            onPress={() => void eventsQuery.refetch()}
          >
            Reintentar
          </Button>
        </div>
      ) : !event ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/15 p-8 text-center">
          <FolderKanban aria-hidden="true" className="size-8 text-slate-500" />
          <p className="text-sm text-slate-300">
            Aún no hay {texts.description.toLowerCase()} en ningún evento.
          </p>
        </div>
      ) : (
        <>
          <div
            aria-label="Secciones"
            className="flex gap-6 border-b border-white/10"
            role="tablist"
          >
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                aria-controls={`teaching-${id}`}
                aria-selected={tab === id}
                className={`-mb-px min-h-[44px] border-b-2 px-1 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  tab === id
                    ? "border-cyan-400 text-white"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
                id={`teaching-tab-${id}`}
                role="tab"
                type="button"
                onClick={() =>
                  setParams({ tab: id === "projects" ? undefined : id })
                }
              >
                {label}
              </button>
            ))}
          </div>

          <div
            aria-labelledby={`teaching-tab-${tab}`}
            id={`teaching-${tab}`}
            role="tabpanel"
          >
            {tab === "projects" ? (
              // A new event starts with clean filters
              <ProjectsTab
                key={event.id}
                eventId={event.id}
                profile={profile}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/15 p-8 text-center">
                <BookOpenCheck
                  aria-hidden="true"
                  className="size-8 text-slate-500"
                />
                <p className="text-sm font-semibold text-slate-200">
                  Próximamente
                </p>
                <p className="max-w-sm text-xs text-slate-400">
                  Aquí se verán las notas de los proyectos cuando se publiquen
                  los resultados del evento.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
