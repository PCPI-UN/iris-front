"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardBody } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { useCriteria } from "../api/get-criteria";
import { Select, SelectItem } from "@/components/ui/select";
import { Chip } from "@heroui/chip";
import { UpdateCriteria } from "./update-criteria";
import { DeleteCriteria } from "./delete-criteria";
import { useEventsDropdown } from "@/features/events/api/get-events-dropdown";
import { useCategories } from "@/features/courses/api/get-courses";

export const CriteriaList = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = searchParams?.get("page") ? Number(searchParams.get("page")) : 1;

  // Local filter state
  const [selectedEventKey, setSelectedEventKey] = useState<string>("");
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>("");

  // Queries
  const criteriaQuery = useCriteria({
    page,
    limit: 100,
    eventId: selectedEventKey ? Number(selectedEventKey) : undefined,
    categoryId: selectedCategoryKey ? Number(selectedCategoryKey) : undefined,
  });

  const eventsQuery = useEventsDropdown();
  const categoriesQuery = useCategories({
    page: 1,
    eventId: selectedEventKey ? Number(selectedEventKey) : undefined,
    queryConfig: { enabled: !!selectedEventKey },
  });

  const events = eventsQuery.data?.data ?? [];
  const categories = categoriesQuery.data?.data ?? [];

  const isLoading = criteriaQuery.isLoading || eventsQuery.isLoading;

  const criteria = criteriaQuery.data?.criterions ?? [];
  const meta = criteriaQuery.data?.meta;

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams?.toString());
      params.set("page", String(newPage));
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleEventChange = useCallback((keys: any) => {
    const selected = Array.from(keys)[0];
    const eventKey = selected ? String(selected) : "";
    setSelectedEventKey(eventKey);
    setSelectedCategoryKey("");
  }, []);

  const handleCategoryChange = useCallback((keys: any) => {
    const selected = Array.from(keys)[0];
    setSelectedCategoryKey(selected ? String(selected) : "");
  }, []);

  return (
    <div className="space-y-4">
      {/* ======================== SELECT EVENT & COURSE ======================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="w-full sm:w-60">
          <Select
            label="Evento"
            placeholder="Selecciona un evento"
            selectedKeys={selectedEventKey ? [selectedEventKey] : []}
            onSelectionChange={handleEventChange}
            isLoading={eventsQuery.isLoading}
          >
            {events.map((ev) => (
              <SelectItem key={String(ev.id)}>{ev.name}</SelectItem>
            ))}
          </Select>
        </div>

        <div className="w-full sm:flex-1">
          <Select
            label="Categoría"
            placeholder={
              selectedEventKey
                ? "Selecciona una categoría (opcional)"
                : "Selecciona un evento primero"
            }
            selectedKeys={selectedCategoryKey ? [selectedCategoryKey] : []}
            onSelectionChange={handleCategoryChange}
            isDisabled={!selectedEventKey}
            isLoading={!!selectedEventKey && categoriesQuery.isLoading}
          >
            {categories.length > 0 ? (
              categories.map((c) => (
                <SelectItem key={String(c.id)}>{c.code}</SelectItem>
              ))
            ) : (
              <SelectItem key="no-categories" isDisabled>
                {selectedEventKey
                  ? "No hay categorías disponibles"
                  : "Selecciona un evento primero"}
              </SelectItem>
            )}
          </Select>
        </div>
      </div>

      {/* ======================== GRID DE CRITERIOS ======================== */}
      {isLoading ? (
        <div className="flex h-48 w-full items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : !selectedEventKey ? (
        <div className="flex h-48 w-full items-center justify-center text-default-400">
          Selecciona un evento para ver los criterios
        </div>
      ) : criteria.length === 0 ? (
        <div className="flex h-48 w-full items-center justify-center text-default-400">
          No hay criterios para este evento
          {selectedCategoryKey && " y categoría"}
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {criteria.map((criterion) => (
            <Card shadow="sm" key={criterion.id} className="glass-card ">
              <CardBody className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex flex-col justify-between">
                {/* Nombre, descripción y peso */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base sm:text-xl font-semibold line-clamp-2">
                      {criterion.name}
                    </h3>
                    <Chip
                      size="sm"
                      color="primary"
                      variant="flat"
                      className="flex-shrink-0"
                    >
                      {(criterion.weight * 100).toFixed(0)}%
                    </Chip>
                  </div>
                  <p className="text-xs sm:text-sm text-default-500 line-clamp-2">
                    {criterion.description}
                  </p>
                </div>

                {/* Metadata */}
                <div className="space-y-2 text-xs sm:text-sm">
                  {criterion.createdAt && (
                    <div className="text-default-400">
                      Creado:{" "}
                      <span className="font-medium text-default-700">
                        {new Date(criterion.createdAt).toLocaleDateString(
                          "es-CO"
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2 justify-around pt-2">
                  <UpdateCriteria criterionId={criterion.id} />
                  <DeleteCriteria criterionId={criterion.id} />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* ======================== PAGINACIÓN ======================== */}
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
