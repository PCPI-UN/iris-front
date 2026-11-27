import { vi } from "vitest";

import { rtlRender, screen, userEvent } from "@/testing/test-utils";
import type { Event } from "@/types/api";

import { MonitoringDashboardFilters } from "../monitoring-dashboard-filters";

const EVENTS = [
  {
    id: 1,
    name: "Feria 2026-2",
  },
] as unknown as Event[];

const CATEGORIES = [
  { id: 10, code: "Ingeniería de Sistemas" },
  { id: 11, code: "Ingeniería Electrónica" },
];

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

const baseProps = () => ({
  events: EVENTS,
  isEventsLoading: false,
  isPastEventMode: false,
  selectedEventId: 1,
  selectedEventName: "Feria 2026-2",
  selectedCategoryId: undefined as number | undefined,
  categories: CATEGORIES,
  categoriesLoading: false,
  onEventChange: vi.fn(),
  onCategoryChange: vi.fn(),
});

test("shows 'Todas las categorías' by default when all categories are allowed", async () => {
  rtlRender(<MonitoringDashboardFilters {...baseProps()} />);

  const categoryButton = screen.getByRole("button", { name: /categoría/i });
  expect(categoryButton).toHaveTextContent("Todas las categorías");

  await userEvent.click(categoryButton);
  expect(
    await screen.findByRole("option", { name: "Todas las categorías" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("option", { name: "Ingeniería de Sistemas" }),
  ).toBeInTheDocument();
});

test("shows 'Seleccionar categoría' and hides 'Todas las categorías' when allowAllCategories is false (Premios)", async () => {
  const props = baseProps();
  rtlRender(
    <MonitoringDashboardFilters {...props} allowAllCategories={false} />,
  );

  const categoryButton = screen.getByRole("button", { name: /categoría/i });
  expect(categoryButton).toHaveTextContent("Seleccionar categoría");
  expect(categoryButton).not.toHaveTextContent("Todas las categorías");

  await userEvent.click(categoryButton);
  expect(
    screen.queryByRole("option", { name: "Todas las categorías" }),
  ).not.toBeInTheDocument();

  await userEvent.click(
    await screen.findByRole("option", { name: "Ingeniería de Sistemas" }),
  );
  expect(props.onCategoryChange).toHaveBeenCalledTimes(1);
});

test("transitions cleanly from 'Todas las categorías' to 'Seleccionar categoría' when switching to Premios", () => {
  const props = baseProps();
  const { rerender } = rtlRender(
    <MonitoringDashboardFilters {...props} allowAllCategories={true} />,
  );

  expect(
    screen.getByRole("button", { name: /categoría/i }),
  ).toHaveTextContent("Todas las categorías");

  rerender(
    <MonitoringDashboardFilters {...props} allowAllCategories={false} />,
  );

  expect(
    screen.getByRole("button", { name: /categoría/i }),
  ).toHaveTextContent("Seleccionar categoría");
});

