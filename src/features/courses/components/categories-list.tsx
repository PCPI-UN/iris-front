"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Chip } from "@heroui/chip";

import { useCategories } from "../api/get-categories";

import { DeleteCategory } from "./delete-category";
import { UpdateCategory } from "./update-category";

import { Spinner } from "@/components/ui/spinner";
import { Card, CardBody } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { useEvents } from "@/features/events/api/get-events";

export const CategoriesList = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = searchParams?.get("page") ? Number(searchParams.get("page")) : 1;
  const eventId = searchParams?.get("event") || undefined;

  const categoriesQuery = useCategories({
    page: page,
    eventId: eventId ? Number(eventId) : undefined,
  });

  const eventsQuery = useEvents({ page: 1 });
  const events = eventsQuery.data?.data || [];

  const eventNameMap = events.reduce(
    (acc, event) => {
      acc[event.id] = event.name;

      return acc;
    },
    {} as Record<number, string>,
  );

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
        {categories.map((category) => (
          <Card key={category.id} className="glass-card" shadow="sm">
            <CardBody className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base sm:text-xl font-semibold line-clamp-1">
                    {category.code}
                  </h3>
                  <Chip
                    className="flex-shrink-0"
                    color={category.active ? "success" : "default"}
                    size="sm"
                    variant="flat"
                  >
                    {category.active ? "Activa" : "Inactiva"}
                  </Chip>
                </div>
                <p className="text-xs sm:text-sm text-default-500 line-clamp-2">
                  {category.description}
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs sm:text-sm text-default-400">
                  Evento:
                </div>
                <div className="flex flex-wrap gap-1">
                  {category.eventId ? (
                    <Chip className="max-w-full" size="sm" variant="bordered">
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">
                          {eventNameMap[category.eventId] ||
                            `Evento #${category.eventId}`}
                        </span>
                      </div>
                    </Chip>
                  ) : (
                    <span className="text-xs sm:text-sm text-default-400">
                      Sin evento asignado
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <UpdateCategory categoryId={category.id} />
                <DeleteCategory
                  eventId={category.eventId}
                  id={category.id}
                  totalCategoriesPerEvent={
                    categories.filter((c) => c.eventId === category.eventId)
                      .length
                  }
                />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            showControls
            page={page}
            total={meta.totalPages}
            onChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};
