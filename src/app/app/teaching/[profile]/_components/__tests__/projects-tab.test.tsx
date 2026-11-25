import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { ProjectsTab } from "../projects-tab";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent, waitFor } from "@/testing/test-utils";

const course = {
  id: 2,
  nrc: "2051",
  termId: 1,
  term: "202610",
  name: "Proyecto Final I",
  departmentName: "Sistemas",
};

const project = (id: number, name: string, state: string) => ({
  id,
  eventId: 4,
  name,
  projectCode: `PF-0${id}`,
  state,
  academicCourse: course,
});

const mockApi = () => {
  const requests: URLSearchParams[] = [];

  server.use(
    http.get("*/api/academic/registrations", () =>
      HttpResponse.json({
        eventId: 4,
        eventName: "Feria 2026-2",
        totals: {
          projects: 2,
          byState: {
            UNDER_REVIEW: 1,
            APPROVED: 1,
            REJECTED: 0,
            REQUEST_CHANGES: 0,
          },
          confirmedStudents: 3,
          pendingStudents: 1,
        },
        projects: [
          {
            projectId: 181,
            projectCode: "PF-0181",
            projectName: "Huerta vertical",
            state: "UNDER_REVIEW",
            reason: null,
            academicCourse: course,
            tutors: ["Laura Méndez"],
            students: [
              { status: "CONFIRMED", studentCode: "1" },
              { status: "PENDING", studentCode: "2" },
            ],
          },
        ],
      }),
    ),
    http.get("*/api/academic/projects", ({ request }) => {
      const params = new URL(request.url).searchParams;

      requests.push(params);
      const items = [
        project(181, "Huerta vertical", "UNDER_REVIEW"),
        project(190, "Simulador de tráfico", "APPROVED"),
      ].filter(
        (item) => !params.get("state") || item.state === params.get("state"),
      );

      return HttpResponse.json({
        items,
        total: items.length,
        currentPage: 1,
        totalPages: 1,
      });
    }),
  );

  return requests;
};

const renderTab = () =>
  rtlRender(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ProjectsTab eventId={4} profile="TUTOR" />
    </QueryClientProvider>,
  );

describe("ProjectsTab", () => {
  it("shows the totals and one card per project with its students", async () => {
    mockApi();
    renderTab();

    expect(
      await screen.findByRole("link", { name: /Huerta vertical/ }),
    ).toHaveAttribute("href", "/app/teaching/tutor/projects/181");
    expect(screen.getByText("2 estudiantes · 1 pendiente")).toBeInTheDocument();
    expect(screen.getByText("Laura Méndez")).toBeInTheDocument();
    expect(screen.getByText("Estudiantes confirmados")).toBeInTheDocument();
  });

  it("asks the back for the state picked in the filters", async () => {
    const requests = mockApi();

    renderTab();

    await screen.findByRole("link", { name: /Simulador de tráfico/ });
    await userEvent.click(
      screen.getAllByRole("button", { name: /Aprobado/ })[0],
    );

    await waitFor(() => expect(requests.at(-1)?.get("state")).toBe("APPROVED"));
    expect(requests.at(-1)?.get("eventId")).toBe("4");
    expect(requests.at(-1)?.get("profile")).toBe("TUTOR");
    await waitFor(() =>
      expect(
        screen.queryByRole("link", { name: /Huerta vertical/ }),
      ).not.toBeInTheDocument(),
    );
  });
});
