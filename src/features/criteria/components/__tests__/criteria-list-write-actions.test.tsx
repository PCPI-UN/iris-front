import { CriteriaList } from "../criteria-list";

import {
  ADMIN_PERMISSIONS,
  DEAN_PERMISSIONS,
  renderWithSession,
} from "@/testing/render-with-session";
import { screen, userEvent } from "@/testing/test-utils";

const component = { id: 9, name: "Innovación", description: "", weight: 1 };
const criteria = [
  {
    id: 1,
    name: "Originalidad",
    description: "",
    weight: 1,
    eventId: 1,
    categoryIds: [],
    component,
  },
  // Loose criterion: the page offers to assign it to a component
  {
    id: 2,
    name: "Claridad",
    description: "",
    weight: 1,
    eventId: 1,
    categoryIds: [],
    component: null,
  },
];

vi.mock("@/features/events/api/get-events-dropdown", () => ({
  useEventsDropdown: () => ({
    isLoading: false,
    data: { data: [{ id: 1, name: "Feria" }] },
  }),
}));

vi.mock("@/features/courses/api/get-categories", () => ({
  useCategories: () => ({ isLoading: false, data: { data: [] } }),
}));

vi.mock("@/features/criteria/api/get-criteria", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCriteria: () => ({ isLoading: false, data: { criterions: criteria } }),
}));

vi.mock("@/features/criteria/api/get-components", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useComponents: () => ({
    isLoading: false,
    data: { components: [component] },
  }),
}));

vi.mock(
  "@/features/criteria/api/get-rubric-readiness",
  async (importOriginal) => ({
    ...(await importOriginal<object>()),
    useRubricReadiness: () => ({ isLoading: false, data: undefined }),
  }),
);

const selectEvent = async () => {
  await userEvent.click(
    screen.getByRole("button", { name: /selecciona un evento evento/i }),
  );
  await userEvent.click(await screen.findByRole("option", { name: "Feria" }));
  await screen.findByText("Claridad");
};

describe("Criterios: acciones de escritura", () => {
  test("a read-only session (Dean) sees the rubric but cannot assign, delete or save", async () => {
    await renderWithSession(<CriteriaList />, DEAN_PERMISSIONS);
    await selectEvent();

    expect(screen.getAllByText("Innovación").length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: /^asignar$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /eliminar componente/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /guardar configuración/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /agregar criterio/i }),
    ).not.toBeInTheDocument();
  });

  test("a session with manage:events sees assign, delete component and save", async () => {
    await renderWithSession(<CriteriaList />, ADMIN_PERMISSIONS);
    await selectEvent();

    expect(
      screen.getByRole("button", { name: /^asignar$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /eliminar componente/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /guardar configuración/i }),
    ).toBeInTheDocument();
  });
});
