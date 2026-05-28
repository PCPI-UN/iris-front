"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { Spinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";

import { useMyEvents } from "../api/get-my-events";
import { EventCardCollapsed } from "./get-events-user/event-card-collapsed";
import { EventCardExpanded } from "./get-events-user/event-card-expanded";
import { Button } from "@heroui/button";

export const GetEventsUser = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const page = useMemo(() => {
    const raw = searchParams?.get("page");
    const parsed = raw ? Number(raw) : 1;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }, [searchParams]);

  const eventsQuery = useMyEvents({ page });

  const events = eventsQuery.data?.data ?? [];
  const meta = eventsQuery.data?.meta;

  const filteredEvents = useMemo(() => {
    if (filter === "all") return events;
    if (filter === "jury") return events?.filter((event) => event.role?.name.toLowerCase().includes("juror"));
    if (filter === "participant") return events?.filter((event) => event.role?.name.toLowerCase().includes("participant"));
    return events;
  }, [events, filter]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("page", String(newPage));
    router.push(`?${params.toString()}`);
  };

  const handleToggleEvent = (eventId: string) => {
    setExpandedEventId((prev) => (prev === eventId ? null : eventId));
  };

  const handleGoDashboard = (eventId: string) => {
    router.push(`/app/events/${eventId}/dashboard`);
  };

  const handleFilter = (filter: string) => {
    setFilter(filter);
  };

  if (eventsQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-lg text-default-500">No events found</p>
        <p className="text-sm text-default-400">
          You are not enrolled in any events yet
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <div className="flex space-x-2">
        <Button
          variant={"flat"}
          onClick={() => handleFilter("all")}
          color={filter === "all" ? "primary" : "default"}
        >
          Todos
        </Button>
        <Button
          variant={"flat"}
          onClick={() => handleFilter("jury")}
          color={filter === "jury" ? "primary" : "default"}
        >
          Jurado
        </Button>
        <Button
          variant={"flat"}
          onClick={() => handleFilter("participant")}
          color={filter === "participant" ? "primary" : "default"}
        >
          Participante
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-0">
        {filteredEvents.map((event) => {
          const eventId = String(event.id);
          const isExpanded = expandedEventId === eventId;

          return (
            <div
              key={eventId}
              className={`col-span-1 ${
                isExpanded ? "h-full" : ""
              }`}
            >
              <EventCardCollapsed
                event={event}
                isExpanded={isExpanded}
                onToggle={handleToggleEvent}
              />

              {isExpanded && (
                <EventCardExpanded
                  event={event}
                  isExpanded={isExpanded}
                  onGoDashboard={handleGoDashboard}
                />
              )}
            </div>
          );
        })}
      </div>

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
    </section>
  );
};
