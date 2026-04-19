"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";

import { Spinner } from "@/components/ui/spinner";
import { Card, CardBody } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { useCategories } from "../api/get-courses";
import { Chip } from "@heroui/chip";

import { DeleteCourse } from "./delete-course";
import { UpdateCourse } from "./update-course";

export const CoursesList = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = searchParams?.get("page") ? Number(searchParams.get("page")) : 1;
  const eventId = searchParams?.get("event") || undefined;

  const categoriesQuery = useCategories({
    page: page,
    eventId: eventId ? Number(eventId) : undefined,
  });

  if (categoriesQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const categories = categoriesQuery.data?.data;
  const meta = categoriesQuery.data?.meta;

  if (!categories) return null;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set("page", String(newPage));
    if (eventId) params.set("event", eventId);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((course) => (
          <Card shadow="sm" key={course.id} className="glass-card">
            <CardBody className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base sm:text-xl font-semibold line-clamp-1">{course.code}</h3>
                  <Chip
                    size="sm"
                    color={course.active ? "success" : "default"}
                    variant="flat"
                    className="flex-shrink-0"
                  >
                    {course.active ? "Active" : "Inactive"}
                  </Chip>
                </div>
                <p className="text-xs sm:text-sm text-default-500 line-clamp-2">{course.description}</p>
              </div>

              <div className="space-y-2">
                <div className="text-xs sm:text-sm text-default-400">Event:</div>
                <div className="flex flex-wrap gap-1">
                  {course.eventId ? (
                    <Chip size="sm" variant="bordered" className="max-w-full">
                      <div className="flex flex-col min-w-0">
                      <span className="truncate">Event #{course.eventId}</span>
                    </div>
                    </Chip>
                  ) : (
                    <span className="text-xs sm:text-sm text-default-400">No event assigned</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <UpdateCourse courseId={course.id} />
                <DeleteCourse id={course.id} />
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
