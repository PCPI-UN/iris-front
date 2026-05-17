"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Calendar, Users, Check, Eye } from "lucide-react";
import { Snippet } from "@/components/ui/snippet";
import { Card, CardBody } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { useEvents } from "../api/get-events";

import { DeleteEvent } from "./delete-event";
import { UpdateEvent } from "./update-event";
import dayjs from "dayjs";

export const formatDateShort = (date: string | number) => {
  return dayjs(date).format('MMM D, YYYY');
};

export const GetEventsAdmin = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = searchParams?.get("page") ? Number(searchParams.get("page")) : 1;

  const [filter, setFilter] = useState<"active" | "all" | "drafts" | "past">("active");

  const eventsQuery = useEvents({
    page: page,
    onlyActive: filter === "active" || filter === "past",
  });

  if (eventsQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const events = eventsQuery.data?.data;
  const meta = eventsQuery.data?.meta;

  if (!events) return null;

  const now = Date.now();

  const filteredEvents = useMemo(() => {
    if (filter === "all") return events;
    if (filter === "drafts") return events.filter((e) => e.isPubliclyJoinable === false);
    if (filter === "past") return events.filter((e) => {
      const endTs = e.endDate ? Date.parse(e.endDate) : 0;
      return e.active && endTs > 0 && endTs < now;
    });
    // default: active upcoming => active && startDate in future
    return events.filter((e) => {
      const startTs = e.startDate ? Date.parse(e.startDate) : 0;
      return e.active && startTs > now;
    });
  }, [events, filter, now]);

  const handlePageChange = (newPage: number) => {
    router.push(`?page=${newPage}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button className={`px-3 py-1 rounded ${filter === 'active' ? 'bg-primary-600 text-white' : 'bg-gray-800/30'}`} onClick={() => setFilter('active')}>Activos</button>
        <button className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-800/30'}`} onClick={() => setFilter('all')}>Todos</button>
        <button className={`px-3 py-1 rounded ${filter === 'past' ? 'bg-primary-600 text-white' : 'bg-gray-800/30'}`} onClick={() => setFilter('past')}>Pasados</button>
        <button className={`px-3 py-1 rounded ${filter === 'drafts' ? 'bg-primary-600 text-white' : 'bg-gray-800/30'}`} onClick={() => setFilter('drafts')}>Drafts</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => (
          <Card shadow="sm" key={event.id} className="glass-card">
            <CardBody className="p-6 space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{event.name}</h3>
                <p className="text-sm text-default-500">
                  {event.description?.slice(0, 200)}
                  {event.description?.length > 200 && "..."}
                </p>
              </div>

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center  justify-between">
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
                  <div className="flex items-center gap-1 text-green-600 ">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-medium">Public</span>
                  </div>
                )}
              </Card>

              <div className="flex items-center justify-between p-1">
                <span className="text-sm text-default-400">Evaluations:</span>
                <span
                  className={`text-sm font-medium ${event.evaluationsOpened
                      ? "text-green-600"
                      : "text-gray-400"
                    }`}
                >
                  {event.evaluationsOpened ? "Open" : "Closed"}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <UpdateEvent eventId={event.id} />
                <DeleteEvent id={event.id} />
              </div>
            </CardBody>
          </Card>
        ))}
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
    </div>
  );
};
