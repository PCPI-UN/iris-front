"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Calendar, GraduationCap, Scale } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@heroui/button";
import { Chip } from "@/components/ui/chip";
import { useMyEvents } from "../api/get-my-events";
import dayjs from "dayjs";

export const formatDateShort = (date: string | number) => {
  return {
    day: dayjs(date).format("MMM D, YYYY"),
    time: dayjs(date).format("h:mm A"),
  };
};

export const GetEventsUser = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = searchParams?.get("page") ? Number(searchParams.get("page")) : 1;

  const eventsQuery = useMyEvents({
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

  const handlePageChange = (newPage: number) => {
    router.push(`?page=${newPage}`);
  };

  const getRoleIcon = (role?: "Participant" | "Juror") => {
    if (role === "Juror") return <Scale className="h-4 w-4" />;
    if (role === "Participant") return <GraduationCap className="h-4 w-4" />;
    return null;
  };

  const getRoleColor = (role?: "Participant" | "Juror") => {
    if (role === "Juror") return "warning";
    if (role === "Participant") return "primary";
    return "default";
  };

  const getRoleLabel = (role?: "Participant" | "Juror") => {
    if (role === "Juror") return "Juror";
    if (role === "Participant") return "Participant";
    return "Unknown";
  };

  return (
    <div className="space-y-4">
      <div className="grid p-4 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          const start = formatDateShort(event.startDate);
          const end = formatDateShort(event.endDate);
<<<<<<< feature/CU-86e0d9d4g/Landing-Page-Add-public-event-detail-page
          const eventRoleName = event.role?.name;
=======
          const roleName = event?.role?.name;
>>>>>>> CU-86e0gpfwj/Event-Redesign-Create-Event-Form-new-Figma-fields

          return (
            <Card shadow="sm" key={event.id} className="glass-card">
              <CardBody className="p-6 space-y-4 flex flex-col">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xl font-semibold flex-1">
                      {event.name}
                    </h3>

<<<<<<< feature/CU-86e0d9d4g/Landing-Page-Add-public-event-detail-page
                    {eventRoleName && (
                      <Chip
                        color={getRoleColor(eventRoleName)}
                        variant="flat"
                        size="sm"
                        startContent={getRoleIcon(eventRoleName)}
                      >
                        {getRoleLabel(eventRoleName)}
=======
                    {roleName && (
                      <Chip
                        color={getRoleColor(roleName)}
                        variant="flat"
                        size="sm"
                        startContent={getRoleIcon(roleName)}
                      >
                        {getRoleLabel(roleName)}
>>>>>>> CU-86e0gpfwj/Event-Redesign-Create-Event-Form-new-Figma-fields
                      </Chip>
                    )}
                  </div>

                  <p className="text-sm text-default-500">
                    {event.description}
                  </p>
                </div>

                {/* DATE SECTION FIXED */}
                <div className="flex flex-col gap-2 text-m">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* START */}
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-default-400 mt-1" />
                      <div className="flex flex-col leading-tight">
                        <span className="text-default-400">Start:</span>
                        <span>{start.day}</span>
                        <span className="text-xs text-default-500">
                          {start.time}
                        </span>
                      </div>
                    </div>

                    {/* END */}
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-default-400 mt-1" />
                      <div className="flex flex-col leading-tight">
                        <span className="text-default-400">End:</span>
                        <span>{end.day}</span>
                        <span className="text-xs text-default-500">
                          {end.time}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Evaluations */}
                  <div className="flex items-center justify-between p-1">
                    <span className="text-sm text-default-400">
                      Evaluations:
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        event.evaluationsOpened === true
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {event.evaluationsOpened === true ? "Open" : "Closed"}
                    </span>
                  </div>
                </div>

                {/* BUTTON */}
                <div className="mt-auto pt-2">
                  <Button
                    onPress={() =>
                      router.push(`/app/events/${event.id}/dashboard`)
                    }
                    color={
                      event.evaluationsOpened ? "primary" : "default"
                    }
                    className={`
                      w-full 
                      transition-transform
                      ${
                        event.evaluationsOpened
                          ? "hover:scale-[1.01]"
                          : "opacity-70 cursor-not-allowed bg-default-200 dark:bg-default-100"
                      }
                      md:text-base text-sm
                      md:py-3 py-2
                      rounded-xl
                      font-medium
                    `}
                    isDisabled={!event.evaluationsOpened}
                  >
                    {event.evaluationsOpened
<<<<<<< feature/CU-86e0d9d4g/Landing-Page-Add-public-event-detail-page
                      ? eventRoleName === "Juror"
=======
                      ? roleName === "Juror"
>>>>>>> CU-86e0gpfwj/Event-Redesign-Create-Event-Form-new-Figma-fields
                        ? "View Projects"
                        : "View My Project"
                      : "La feria aún no ha comenzado"}
                  </Button>
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
