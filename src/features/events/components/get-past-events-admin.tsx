"use client";

import { useSearchParams } from "next/navigation";
import { Calendar, Users, Check } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useEvents } from "../api/get-events";
import dayjs from "dayjs";
import { Snippet } from "@/components/ui/snippet";

export const formatDateShort = (date: string | number) => {
  return dayjs(date).format('MMM D, YYYY');
};

export const GetPastEventsAdmin = () => {
  const searchParams = useSearchParams();
  const page = searchParams?.get("page") ? Number(searchParams.get("page")) : 1;

  const eventsQuery = useEvents({ page });

  if (eventsQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const events = eventsQuery.data?.data ?? [];

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
                <p className="text-sm text-default-500">{event.description}</p>
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
                    Access code: {" "}
                    <Snippet size="sm" symbol="">{event.accessCode}</Snippet>
                  </span>
                </div>
                {event.isPubliclyJoinable && (
                  <div className="flex items-center gap-1 text-green-600 ">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-medium">Public</span>
                  </div>
                )}
              </Card>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GetPastEventsAdmin;
