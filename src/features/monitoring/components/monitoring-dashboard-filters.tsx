'use client';

import { Select, SelectItem } from '@/components/ui/select/select';
import { type Event } from '@/types/api';

type MonitoringDashboardFiltersProps = {
  events: Event[];
  isEventsLoading: boolean;
  isPastEventMode: boolean;
  selectedEventId?: number;
  selectedEventName?: string;
  selectedCourseId?: number;
  categories: Array<{ id: number; code: string }>;
  categoriesLoading: boolean;
  onEventChange: (value: string) => void;
  onCourseChange: (keys: Set<string>) => void;
};

export const MonitoringDashboardFilters = ({
  events,
  isEventsLoading,
  isPastEventMode,
  selectedEventId,
  selectedEventName,
  selectedCourseId,
  categories,
  categoriesLoading,
  onEventChange,
  onCourseChange,
}: MonitoringDashboardFiltersProps) => {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-4">
      {!isPastEventMode && (
        <div className="flex w-full flex-col gap-3 lg:max-w-[420px]">
          <Select
            label="Evento"
            placeholder="Selecciona un evento"
            selectedKeys={selectedEventId ? [String(selectedEventId)] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];
              if (selected !== undefined) {
                onEventChange(String(selected));
              }
            }}
            isLoading={isEventsLoading}
          >
            {events.map((event) => (
              <SelectItem key={String(event.id)}>
                {event.name}
              </SelectItem>
            ))}
          </Select>
        </div>
      )}

      <div className="flex w-full flex-col gap-3 lg:max-w-[420px]">
        <Select
          label="Categoría"
          placeholder={
            selectedEventId
              ? 'Todas las categorías'
              : 'Selecciona un evento primero'
          }
          selectedKeys={selectedCourseId ? [String(selectedCourseId)] : []}
          onSelectionChange={(keys) => onCourseChange(keys as Set<string>)}
          isDisabled={!selectedEventId}
          isLoading={categoriesLoading}
        >
          {categories.length ? (
            categories.map((category) => (
              <SelectItem key={String(category.id)}>
                {category.code}
              </SelectItem>
            ))
          ) : (
            <SelectItem key="no-categories" isDisabled>
              {selectedEventId ? 'No hay categorías' : 'Selecciona un evento primero'}
            </SelectItem>
          )}
        </Select>
      </div>
    </div>
  );
};