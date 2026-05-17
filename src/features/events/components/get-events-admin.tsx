"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Calendar,
  Users,
  Check,
  LayoutList,
  Archive,
  FileEdit,
  Zap,
} from "lucide-react";
import { Snippet } from "@/components/ui/snippet";
import { Card, CardBody } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { useEvents } from "../api/get-events";
import { DeleteEvent } from "./delete-event";
import { UpdateEvent } from "./update-event";
import { Event } from "@/types/api";
import dayjs from "dayjs";

export const formatDateShort = (date: string | number) => {
  return dayjs(date).format("MMM D, YYYY");
};

type FilterType = "active" | "all" | "past" | "drafts";

const FILTER_CONFIG: {
  key: FilterType;
  label: string;
  Icon: React.ElementType;
}[] = [
  { key: "active", label: "Activos", Icon: Zap },
  { key: "all", label: "Todos", Icon: LayoutList },
  { key: "past", label: "Pasados", Icon: Archive },
  { key: "drafts", label: "Drafts", Icon: FileEdit },
];

const isEnded = (event: Event): boolean => {
  const endTs = event.endDate ? Date.parse(event.endDate) : 0;
  return endTs > 0 && endTs < Date.now();
};

const isUpcoming = (event: Event): boolean => !isEnded(event);

export const GetEventsAdmin = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = searchParams?.get("page") ? Number(searchParams.get("page")) : 1;

  const [filter, setFilter] = useState<FilterType>("active");

  // Fetch all events (no onlyActive filter) so we can classify client-side
  const eventsQuery = useEvents({ page });

  if (eventsQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const events = eventsQuery.data?.data ?? [];
  const meta = eventsQuery.data?.meta;

  // ── Per-filter counts ──────────────────────────────────────────────────────
  const counts: Record<FilterType, number> = {
    active: events.filter((e) => isUpcoming(e) && e.isPubliclyJoinable).length,
    all: events.length,
    past: events.filter(isEnded).length,
    drafts: events.filter((e) => isUpcoming(e) && !e.isPubliclyJoinable).length,
  };

  // ── Filtered + sorted events ───────────────────────────────────────────────
  const filteredEvents = ((): Event[] => {
    switch (filter) {
      case "all":
        // Newest startDate first
        return [...events].sort(
          (a, b) => Date.parse(b.startDate) - Date.parse(a.startDate)
        );

      case "past":
        // Most recently ended first
        return events
          .filter(isEnded)
          .sort((a, b) => Date.parse(b.endDate) - Date.parse(a.endDate));

      case "drafts":
        // Upcoming + private → soonest start first
        return events
          .filter((e) => isUpcoming(e) && !e.isPubliclyJoinable)
          .sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate));

      case "active":
      default:
        // Upcoming + public → soonest start first
        return events
          .filter((e) => isUpcoming(e) && e.isPubliclyJoinable)
          .sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate));
    }
  })();

  const handlePageChange = (newPage: number) => {
    router.push(`?page=${newPage}`);
  };

  return (
    <div className="space-y-6">
      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_CONFIG.map(({ key, label, Icon }) => {
          const isActive = filter === key;
          return (
            <Button
              key={key}
              variant={isActive ? "flat" : "bordered"}
              size="sm"
              startContent={<Icon className="h-3.5 w-3.5" />}
              endContent={
                <span
                  className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-white/20 text-inherit"
                      : "bg-default-100 text-default-500"
                  }`}
                >
                  {counts[key]}
                </span>
              }
              onPress={() => setFilter(key)}
            >
              {label}
            </Button>
          );
        })}
      </div>

      {/* ── Event grid ───────────────────────────────────────────────────── */}
      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-default-400">
          <Archive className="h-12 w-12 opacity-25" />
          <p className="text-sm">No hay eventos en esta categoría</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <Card shadow="sm" key={event.id} className="glass-card">
              <CardBody className="p-6 space-y-4">
                {/* Name & description */}
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{event.name}</h3>
                  <p className="text-sm text-default-500">
                    {event.description?.slice(0, 200)}
                    {event.description?.length > 200 && "…"}
                  </p>
                </div>

                {/* Dates */}
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-default-400" />
                      <span className="text-default-400">Start:</span>
                      <span>{formatDateShort(event.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-default-400" />
                      <span className="text-default-400">End:</span>
                      <span>{formatDateShort(event.endDate)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-default-400" />
                    <span className="text-default-400">Deadline:</span>
                    <span>{formatDateShort(event.inscriptionDeadline)}</span>
                  </div>
                </div>

                {/* Access code + public badge */}
                <Card className="flex flex-row items-center justify-between p-2 glass-card">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-default-400" />
                    <span className="text-sm">
                      Access code:{" "}
                      <Snippet size="sm" symbol="">
                        {event.accessCode}
                      </Snippet>
                    </span>
                  </div>
                  {event.isPubliclyJoinable && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">Public</span>
                    </div>
                  )}
                </Card>

                {/* Evaluations status */}
                <div className="flex items-center justify-between p-1">
                  <span className="text-sm text-default-400">Evaluations:</span>
                  <span
                    className={`text-sm font-medium ${
                      event.evaluationsOpened
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    {event.evaluationsOpened ? "Open" : "Closed"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <UpdateEvent eventId={event.id} />
                  <DeleteEvent id={event.id} />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            total={meta.totalPages}
            page={page}
            onChange={handlePageChange}
            showControls
          />
        </div>
      )}
    </div>
  );
};
