import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { normalizeRubricReadiness } from "../../api/get-rubric-readiness";
import { RubricReadiness } from "../rubric-readiness";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen } from "@/testing/test-utils";

// The permission check is covered by its own tests
vi.mock("@/components/auth/can", () => ({
  Can: ({ children }: { children: ReactNode }) => children,
}));

const components = [
  { id: 1, name: "Innovación" },
  { id: 2, name: "Comunicación oral" },
];
const categories = [
  { id: 5, code: "IST-101" },
  { id: 6, code: "IST-202" },
];

const renderPanel = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <RubricReadiness
        categories={categories}
        components={components}
        eventId={7}
      />
    </QueryClientProvider>,
  );
};

test("the fields the gateway leaves out are read as false, 0 and empty lists", () => {
  expect(
    normalizeRubricReadiness({ categories: [{ courseId: 5 }] }, 7),
  ).toEqual({
    eventId: 7,
    componentsWeight: 0,
    componentsLocked: false,
    categories: [
      {
        courseId: 5,
        ready: false,
        criteriaCount: 0,
        missingComponentIds: [],
        criteriaWithoutComponent: [],
        locked: false,
      },
    ],
  });
});

test("each category says whether it is ready and what it lacks", async () => {
  server.use(
    http.get("*/api/criterions/readiness", () =>
      HttpResponse.json({
        eventId: 7,
        componentsWeight: 1,
        categories: [
          { courseId: 5, ready: true, criteriaCount: 4 },
          {
            courseId: 6,
            criteriaCount: 2,
            missingComponentIds: [2],
            criteriaWithoutComponent: [40],
          },
        ],
      }),
    ),
  );
  renderPanel();

  expect(await screen.findByText(/lista · 4 criterio/i)).toBeInTheDocument();
  expect(
    screen.getByText(
      "Faltan criterios en: Comunicación oral. 1 criterio(s) sin componente.",
    ),
  ).toBeInTheDocument();
  expect(screen.queryByText(/ninguna categoría está lista/i)).toBeNull();
});

test("components that do not add up to 100 % block every category", async () => {
  server.use(
    http.get("*/api/criterions/readiness", () =>
      HttpResponse.json({
        eventId: 7,
        componentsWeight: 0.7,
        categories: [{ courseId: 5, criteriaCount: 3 }],
      }),
    ),
  );
  renderPanel();

  expect(
    await screen.findByText(
      /ninguna categoría está lista mientras los componentes sumen 70 %/i,
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Los componentes deben sumar 100 %."),
  ).toBeInTheDocument();
});
