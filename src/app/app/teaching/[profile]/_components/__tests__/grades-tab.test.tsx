import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { GradesTab } from "../grades-tab";

import { server } from "@/testing/mocks/server";
import {
  rtlRender,
  screen,
  userEvent,
  waitFor,
  within,
} from "@/testing/test-utils";

const row = (
  projectId: number,
  projectName: string,
  participantNames: string[],
  finalScore: number | null,
  gradeHidden = false,
) => ({
  projectId,
  projectCode: `PF-0${projectId}`,
  projectName,
  participantNames,
  academicCourse: null,
  gradeStatus: finalScore !== null || gradeHidden ? "OFFICIAL" : "PENDING",
  assignedJurors: 2,
  completedEvaluations: finalScore !== null || gradeHidden ? 2 : 0,
  pendingEvaluations: finalScore !== null || gradeHidden ? 0 : 2,
  finalScore,
  gradeHidden,
});

const mockApi = ({ hidden }: { hidden: boolean }) =>
  server.use(
    http.get("*/api/academic/stats", () =>
      HttpResponse.json({
        eventId: 4,
        eventName: "Feria 2026-2",
        resultsPublished: !hidden,
        statsHidden: hidden,
        maxScore: hidden ? null : 5,
        overall: hidden
          ? null
          : {
              projectCount: 3,
              evaluatedCount: 2,
              components: [
                {
                  id: 1,
                  name: "Técnico",
                  weight: 0.6,
                  average: 4.25,
                  projectCount: 2,
                  criteria: [
                    { id: 11, name: "Solución", weight: 0.6, average: 4.25 },
                  ],
                },
              ],
              distribution: [
                { from: 0, to: 1, count: 0 },
                { from: 1, to: 2, count: 0 },
                { from: 2, to: 3, count: 0 },
                { from: 3, to: 4, count: 1 },
                { from: 4, to: 5, count: 1 },
              ],
            },
      }),
    ),
    http.get("*/api/academic/grades", () =>
      HttpResponse.json({
        eventId: 4,
        eventName: "Feria 2026-2",
        resultsPublished: !hidden,
        gradeVisibility: "PUBLISHED_ONLY",
        projects: [
          row(
            181,
            "Huerta vertical",
            ["Mariana Peña"],
            hidden ? null : 4.3,
            hidden,
          ),
          row(
            190,
            "Simulador de tráfico",
            ["Andrés Gil"],
            hidden ? null : 3.5,
            hidden,
          ),
          row(195, "Robot clasificador", [], null),
        ],
      }),
    ),
  );

const renderTab = (profile: "PROFESSOR" | "DEAN" = "PROFESSOR") =>
  rtlRender(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <GradesTab eventId={4} profile={profile} />
    </QueryClientProvider>,
  );

const course = (departmentName: string) => ({
  id: 1,
  nrc: "12345",
  termId: 1,
  term: "202620",
  name: "Proyecto final",
  departmentName,
});

const block = (projectCount: number, evaluatedCount: number) => ({
  projectCount,
  evaluatedCount,
  components: [
    {
      id: 1,
      name: "Técnico",
      weight: 1,
      average: 4,
      projectCount: evaluatedCount,
      criteria: [{ id: 11, name: "Solución", weight: 1, average: 4 }],
    },
  ],
  distribution: null,
});

/** Dean: numbers per department, and grades of two departments */
const mockDeanApi = (onStats: (url: URL) => void) =>
  server.use(
    http.get("*/api/academic/stats", ({ request }) => {
      onStats(new URL(request.url));

      return HttpResponse.json({
        eventId: 4,
        eventName: "Feria 2026-2",
        resultsPublished: false,
        statsHidden: false,
        maxScore: 5,
        overall: block(2, 2),
        departments: [
          { departmentId: 1, departmentName: "Sistemas", ...block(1, 1) },
          { departmentId: 2, departmentName: "Química", ...block(1, 1) },
        ],
      });
    }),
    http.get("*/api/academic/grades", () =>
      HttpResponse.json({
        eventId: 4,
        eventName: "Feria 2026-2",
        resultsPublished: false,
        gradeVisibility: "ALL",
        projects: [
          {
            ...row(181, "Huerta vertical", ["Mariana Peña"], 4.3),
            academicCourse: course("Química"),
          },
          {
            ...row(190, "Simulador de tráfico", ["Andrés Gil"], 3.5),
            academicCourse: course("Sistemas"),
          },
        ],
      }),
    ),
  );

describe("GradesTab", () => {
  it("shows the averages, the spread and each grade, opening the detail from Notas", async () => {
    mockApi({ hidden: false });
    renderTab();

    const card = await screen.findByRole("link", { name: /Huerta vertical/ });

    expect(card).toHaveAttribute(
      "href",
      "/app/teaching/professor/projects/181?from=grades",
    );
    expect(card).toHaveTextContent("4.3 / 5");
    expect(
      screen.getByRole("link", { name: /Robot clasificador/ }),
    ).toHaveTextContent("Sin nota");
    expect(
      await screen.findByText("2 de 3 proyectos evaluados"),
    ).toBeInTheDocument();
    expect(screen.getByText("Técnico")).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Distribución de notas" }),
    ).toHaveTextContent("4 – 51 proyecto");
  });

  it("finds a project by a student's name without accents", async () => {
    mockApi({ hidden: false });
    renderTab();

    await screen.findByRole("link", { name: /Huerta vertical/ });
    await userEvent.type(screen.getByRole("searchbox"), "pena");

    await waitFor(() =>
      expect(
        screen.queryByRole("link", { name: /Simulador de tráfico/ }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("link", { name: /Huerta vertical/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 de 3 proyectos")).toBeInTheDocument();
  });

  it("gives the dean the numbers of each department and a department filter", async () => {
    const statsUrls: URL[] = [];

    mockDeanApi((url) => statsUrls.push(url));
    renderTab("DEAN");

    const panel = (await screen.findByText("Por departamento")).closest(
      "section",
    ) as HTMLElement;

    expect(statsUrls[0].searchParams.get("groupBy")).toBe("department");
    expect(within(panel).getByText("Sistemas")).toBeInTheDocument();
    expect(within(panel).getByText("Química")).toBeInTheDocument();

    await screen.findByRole("link", { name: /Huerta vertical/ });
    await userEvent.click(screen.getByRole("button", { name: /Departamento/ }));
    await userEvent.click(
      await screen.findByRole("option", { name: "Sistemas" }),
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("link", { name: /Huerta vertical/ }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("link", { name: /Simulador de tráfico/ }),
    ).toHaveAttribute("href", "/app/teaching/dean/projects/190?from=grades");
  });

  it("keeps a professor's tab without departments", async () => {
    const statsUrls: URL[] = [];

    mockDeanApi((url) => statsUrls.push(url));
    renderTab();

    await screen.findByRole("link", { name: /Huerta vertical/ });
    expect(statsUrls[0].searchParams.get("groupBy")).toBeNull();
    expect(screen.queryByText("Por departamento")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Departamento/ }),
    ).not.toBeInTheDocument();
  });

  it("says the numbers come with the publication while they are hidden", async () => {
    mockApi({ hidden: true });
    renderTab();

    expect(
      await screen.findByText(/Los promedios y la distribución se muestran/),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: /Huerta vertical/ }),
    ).toHaveTextContent("Nota oculta");
  });
});
