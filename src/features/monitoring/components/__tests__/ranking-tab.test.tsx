import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen, within } from "@/testing/test-utils";

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

const renderTab = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <RankingTab
        selectedEventId={1}
        selectedCategoryId={2}
        selectedEventName="Feria"
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
