"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";

import { useEvents } from "../api/get-events";
import { Button } from "@heroui/button";
import { paths } from '@/config/paths';
import { hasInscriptionDeadlinePassed } from '../utils/inscription-deadline';

export const GetEventsLanding = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = searchParams?.get("page") ? Number(searchParams.get("page")) : 1;

  const eventsQuery = useEvents({
    page: page,
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

  const handlePageChange = (newPage: number) => {
    router.push(`?page=${newPage}`);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          const isInscriptionClosed = hasInscriptionDeadlinePassed(event.inscriptionDeadline);

          return (
            <Card shadow="sm" key={event.id}>
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
                    <span>{event.startDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-default-400" />
                    <span className="text-default-400">End:</span>
                    <span>{event.endDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-default-400" />
                  <span className="text-default-400">Deadline:</span>
                  <span>{event.inscriptionDeadline}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  id={event.id}
                  variant="bordered"
                  onPress={() =>
                    router.push(
                      paths.public.event.getHref({
                        id: event.id,
                        name: event.name,
                      }),
                    )
                  }
                >
                  Ver más
                </Button>

                {!isInscriptionClosed && (
                  <Button
                    onPress={() => router.push(paths.public.project.getHref(event.id))}
                  >
                    Registrarse
                  </Button>
                )}
              </div>
              </CardBody>
            </Card>
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
    </div>
  );
};
