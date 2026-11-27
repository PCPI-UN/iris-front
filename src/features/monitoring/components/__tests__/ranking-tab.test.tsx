import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent, within } from "@/testing/test-utils";

import { RankingTab } from "../ranking-tab";

const project = (
  id: number,
  name: string,
  position: number,
  averageGrade: number,
) => ({
  id,
  name,
  position,
  averageGrade,
  evaluationCount: 3,
  participants: [],
});

const globalProject = (
  projectId: number,
  projectName: string,
  position: number,
  averageGrade: number,
  category: string,
  participantNames: string[] = [],
) => ({
  projectId,
  projectName,
  position,
  averageGrade,
  evaluationCount: 3,
  categoryId: position,
  category,
  participantNames,
});

const mockTopProjects = (items: ReturnType<typeof project>[]) => {
  const limits: string[] = [];
  server.use(
    http.get(
      "*/api/evaluations/courses/:courseId/top-projects",
      ({ request }) => {
        limits.push(new URL(request.url).searchParams.get("limit") ?? "");
        return HttpResponse.json({ items, courseId: 2, eventId: 1 });
      },
    ),
  );
  return limits;
};

const mockGlobalRankings = (items: ReturnType<typeof globalProject>[]) => {
  const requestedUrls: string[] = [];
  server.use(
    http.get("*/api/events/:eventId/rankings", ({ request }) => {
      requestedUrls.push(request.url);
      return HttpResponse.json({
        eventId: 1,
        eventName: "Feria",
        scope: "admin",
        items,
      });
    }),
  );
  return requestedUrls;
};

const renderTab = (
  props: Partial<React.ComponentProps<typeof RankingTab>> = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <RankingTab
        selectedEventId={1}
        selectedCategoryId={2}
        selectedEventName="Feria"
        {...props}
      />
    </QueryClientProvider>,
  );
};

const rowOf = async (name: string) =>
  (await screen.findByText(name)).closest("tr")!;

test("shows the position from the backend: co-winners share it", async () => {
  mockTopProjects([
    project(10, "Alfa", 1, 4.5),
    project(11, "Beta", 1, 4.5),
    project(12, "Gamma", 2, 4.1),
  ]);
  renderTab();

  const alfa = await rowOf("Alfa");
  const beta = await rowOf("Beta");
  const gamma = await rowOf("Gamma");

  // Before, the table numbered by order (1, 2, 3)
  expect(within(alfa).getByText("1")).toBeInTheDocument();
  expect(within(beta).getByText("1")).toBeInTheDocument();
  expect(within(gamma).getByText("2")).toBeInTheDocument();

  expect(within(alfa).getByText("Coganador")).toBeInTheDocument();
  expect(within(beta).getByText("Coganador")).toBeInTheDocument();
  expect(within(gamma).queryByText("Coganador")).not.toBeInTheDocument();
  expect(
    screen.getByText(/son coganadores y comparten la posición/i),
  ).toBeInTheDocument();
});

test("requests the selected number of positions and has no tie-break", async () => {
  const limits = mockTopProjects([project(10, "Alfa", 1, 4.5)]);
  renderTab();

  await screen.findByText("Alfa");
  // Before it requested topN + 1 and cut the list itself
  expect(limits).toEqual(["5"]);
  expect(screen.queryByText(/desempate/i)).not.toBeInTheDocument();
  expect(screen.queryByText("Coganador")).not.toBeInTheDocument();
});

test("loads global ranking across all categories when no category is selected", async () => {
  const requestedUrls = mockGlobalRankings([
    globalProject(10, "EcoVision", 1, 4.9, "Ingeniería de Sistemas", [
      "Ana Pérez",
    ]),
    globalProject(11, "BioPulse", 1, 4.9, "Ingeniería Electrónica", [
      "Luis Ramos",
    ]),
    globalProject(12, "SolarGrid", 2, 4.5, "Ingeniería Mecánica"),
    globalProject(13, "AgroData", 3, 4.3, "Ingeniería Industrial"),
    globalProject(14, "CivicFlow", 4, 4.1, "Ingeniería Civil"),
    globalProject(15, "MedTrack", 5, 3.95, "Ingeniería Biomédica"),
    globalProject(16, "EduBot", 5, 3.95, "Ingeniería de Sistemas"),
    globalProject(17, "OutOfTop5", 6, 3.5, "Arquitectura"),
  ]);

  renderTab({ selectedCategoryId: undefined });

  const ecoVision = await rowOf("EcoVision");
  const bioPulse = await rowOf("BioPulse");
  const medTrack = await rowOf("MedTrack");
  const eduBot = await rowOf("EduBot");

  expect(requestedUrls).toHaveLength(1);
  const url = new URL(requestedUrls[0]);
  expect(url.pathname).toContain("/events/1/rankings");
  expect(url.searchParams.get("format")).toBe("json");
  expect(url.searchParams.get("categoryId")).toBeNull();

  expect(screen.getByText("Feria · Clasificación global")).toBeInTheDocument();
  expect(within(ecoVision).getByText("1")).toBeInTheDocument();
  expect(within(ecoVision).getByText("Ingeniería de Sistemas")).toBeInTheDocument();
  expect(within(ecoVision).getByText("Ana Pérez")).toBeInTheDocument();
  expect(within(ecoVision).getByText("Coganador")).toBeInTheDocument();
  expect(within(bioPulse).getByText("Ingeniería Electrónica")).toBeInTheDocument();
  expect(within(bioPulse).getByText("Coganador")).toBeInTheDocument();

  // Position 5 co-winners are both included while position 6 is filtered out
  expect(within(medTrack).getByText("5")).toBeInTheDocument();
  expect(within(eduBot).getByText("5")).toBeInTheDocument();
  expect(screen.queryByText("OutOfTop5")).not.toBeInTheDocument();
});

test("updates visible positions when Top N changes in global ranking", async () => {
  mockGlobalRankings([
    globalProject(10, "EcoVision", 1, 4.9, "Sistemas"),
    globalProject(11, "BioPulse", 2, 4.7, "Electrónica"),
    globalProject(12, "SolarGrid", 3, 4.5, "Mecánica"),
  ]);

  renderTab({ selectedCategoryId: undefined });

  await screen.findByText("SolarGrid");

  const selectTrigger = screen.getByRole("button", { name: /mostrar/i });
  await userEvent.click(selectTrigger);
  await userEvent.click(await screen.findByRole("option", { name: "Top 2" }));

  expect(screen.getByText("EcoVision")).toBeInTheDocument();
  expect(screen.getByText("BioPulse")).toBeInTheDocument();
  expect(screen.queryByText("SolarGrid")).not.toBeInTheDocument();
});

test("prompts to select an event when no event is selected", () => {
  renderTab({ selectedEventId: undefined, selectedCategoryId: undefined });

  expect(
    screen.getByText("Selecciona un evento para ver la clasificación."),
  ).toBeInTheDocument();
});

test("shows error state when global ranking fails to load", async () => {
  server.use(
    http.get("*/api/events/:eventId/rankings", () =>
      HttpResponse.json(
        { message: "No se encontró la configuración de ranking" },
        { status: 400 },
      ),
    ),
  );

  renderTab({ selectedCategoryId: undefined });

  expect(
    await screen.findByText(
      "No se pudo cargar la clasificación. Intenta nuevamente.",
    ),
  ).toBeInTheDocument();
});
