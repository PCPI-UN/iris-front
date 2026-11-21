import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { server } from "@/testing/mocks/server";
import {
  rtlRender,
  screen,
  userEvent,
  waitFor,
  within,
} from "@/testing/test-utils";

import { PublicWinnersEvent } from "../../api/get-public-winners";
import { WinnersSection } from "../winners-section";

const feria = (eventId: number, name: string): PublicWinnersEvent => ({
  eventId,
  name,
  startDate: "2026-11-10T13:00:00.000Z",
  endDate: "2026-11-15T23:00:00.000Z",
  categories: [
    {
      categoryId: 1,
      name: "Ingeniería Civil",
      awards: [
        {
          awardId: 2,
          title: "Segundo lugar",
          position: 2,
          coWinners: false,
          winners: [
            {
              winnerId: 3,
              projectId: 30,
              projectName: "Puente modular",
              grade: 4.1,
            },
          ],
        },
        {
          awardId: 1,
          title: "Primer lugar",
          position: 1,
          coWinners: true,
          winners: [
            {
              winnerId: 1,
              projectId: 10,
              projectName: "Agua limpia",
              grade: 4.5,
            },
            { winnerId: 2, projectId: 20, projectName: null, grade: 4.5 },
          ],
        },
      ],
    },
  ],
});

const mockWinners = (pages: PublicWinnersEvent[][]) => {
  server.use(
    http.get("*/api/events/public/winners", ({ request }) => {
      const page = Number(new URL(request.url).searchParams.get("page") ?? 1);
      return HttpResponse.json({
        events: pages[page - 1] ?? [],
        meta: {
          total: pages.flat().length,
          itemsOnCurrentPage: (pages[page - 1] ?? []).length,
          itemsPerPage: 3,
          currentPage: page,
          totalPages: pages.length,
        },
      });
    }),
  );
};

const renderSection = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <WinnersSection />
    </QueryClientProvider>,
  );
};

test("shows the co-winners of an award with the same position", async () => {
  mockWinners([[feria(7, "Feria 2026")]]);
  renderSection();

  expect(await screen.findByText("Feria 2026")).toBeInTheDocument();
  const primer = screen.getByText("Primer lugar").closest("li")!;
  expect(within(primer).getByText("1° Lugar")).toBeInTheDocument();
  expect(within(primer).getByText("Coganadores")).toBeInTheDocument();
  expect(within(primer).getByText("Agua limpia")).toBeInTheDocument();
  // projectName null: the project no longer exists
  expect(
    within(primer).getByText("Proyecto no disponible"),
  ).toBeInTheDocument();

  const segundo = screen.getByText("Segundo lugar").closest("li")!;
  expect(within(segundo).getByText("2° Lugar")).toBeInTheDocument();
  expect(within(segundo).queryByText("Coganadores")).not.toBeInTheDocument();
});

test("orders the awards by position", async () => {
  mockWinners([[feria(7, "Feria 2026")]]);
  renderSection();

  await screen.findByText("Feria 2026");
  const titles = screen.getAllByText(/lugar$/i).map((el) => el.textContent);
  expect(titles).toEqual([
    "1° Lugar",
    "Primer lugar",
    "2° Lugar",
    "Segundo lugar",
  ]);
});

test("never shows the average of the winners, even if the fair shows grades", async () => {
  // The backend sends grade (4.5, 4.1) because this fair shows grades
  mockWinners([[feria(7, "Feria 2026")]]);
  renderSection();

  await screen.findByText("Agua limpia");
  expect(screen.queryByText(/4[.,]50?/)).not.toBeInTheDocument();
  expect(screen.queryByText(/4[.,]10?/)).not.toBeInTheDocument();
});

test("loads more fairs page by page", async () => {
  mockWinners([[feria(7, "Feria nueva")], [feria(6, "Feria anterior")]]);
  renderSection();

  await screen.findByText("Feria nueva");
  expect(screen.queryByText("Feria anterior")).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Ver más ferias" }));

  expect(await screen.findByText("Feria anterior")).toBeInTheDocument();
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Ver más ferias" }),
    ).not.toBeInTheDocument(),
  );
});

test("renders nothing when no fair has published winners", async () => {
  mockWinners([[]]);
  const { container } = renderSection();

  await waitFor(() =>
    expect(container.querySelector("[aria-busy]")).toBeNull(),
  );
  expect(screen.queryByText(/Ganadores/)).not.toBeInTheDocument();
});
