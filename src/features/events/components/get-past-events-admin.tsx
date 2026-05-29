"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { BarChart3, Calendar } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useEvents } from "../api/get-events";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import PastEventDashboard from '@/features/events/components/past-event-dashboard';

export const formatDateShort = (date: string | number) => {
  return dayjs(date).format('MMM D, YYYY');
};

export const GetPastEventsAdmin = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = searchParams?.get("page") ? Number(searchParams.get("page")) : 1;
  const activeEventId = searchParams?.get("eventId") ? Number(searchParams.get("eventId")) : null;

  const eventsQuery = useEvents({ page });
  const events = eventsQuery.data?.data ?? [];

  if (eventsQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (activeEventId !== null) {
    const selectedEvent = events.find(e => e.id === activeEventId);
    if (!selectedEvent) return null;
    return <PastEventDashboard event={selectedEvent} onBack={() => router.push('/app/events/past')} />;
  }

  const pastEvents = events.filter((e) => dayjs(e.endDate).isBefore(dayjs()));

  if (!pastEvents.length) {
    return <p>No hay eventos pasados en esta página.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pastEvents.map((event) => (
          <Card shadow="sm" key={event.id} className="glass-card">
            <CardBody className="p-6 space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{event.name}</h3>
                <p className="text-sm text-default-500 line-clamp-4">{event.description}</p>
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
              <Button
                color="primary"
                variant="shadow"
                size="lg"
                startContent={<BarChart3 className="h-4 w-4" />}
                className="mt-2 w-full font-semibold"
                onClick={() => router.push(`/app/events/past?eventId=${event.id}`)}
              >
                Ver estadísticas
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GetPastEventsAdmin;
