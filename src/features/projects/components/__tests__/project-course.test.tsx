import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { describe, expect, test } from "vitest";

import { ProjectCourse } from "../project-course";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen } from "@/testing/test-utils";

const mockApi = (opts: {
  course?: object | null;
  requiresCourse: boolean;
  courseStatus?: number;
}) => {
  server.use(
    http.get("*/api/academic/projects/:id", () =>
      opts.courseStatus
        ? HttpResponse.json(
            { message: "sin acceso" },
            { status: opts.courseStatus },
          )
        : HttpResponse.json({
            id: 5,
            academicCourse: opts.course ?? undefined,
          }),
    ),
    http.get("*/api/events/:id", () =>
      HttpResponse.json({
        event: {
          id: 1,
          name: "Feria",
          requiresCourse: opts.requiresCourse,
          termId: 1,
        },
      }),
    ),
  );
};

const renderCourse = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <ProjectCourse eventId={1} projectId={5} />
    </QueryClientProvider>,
  );
};

describe("ProjectCourse", () => {
  test("shows the NRC, the course and the term of the project", async () => {
    mockApi({
      requiresCourse: true,
      course: {
        id: 7,
        nrc: "1001",
        name: "Proyecto Final - Grupo 1",
        term: "202610",
        departmentName: "Ingeniería de Sistemas",
      },
    });
    renderCourse();

    expect(await screen.findByText("NRC 1001")).toBeInTheDocument();
    expect(
      screen.getByText("Proyecto Final - Grupo 1 · Periodo 202610"),
    ).toBeInTheDocument();
  });

  test("a project of an event that does not require NRC says it does not apply", async () => {
    mockApi({ requiresCourse: false });
    renderCourse();

    expect(await screen.findByText("No aplica")).toBeInTheDocument();
  });

  test("a project from before NRCs existed says it has none, without breaking the view", async () => {
    mockApi({ requiresCourse: true });
    renderCourse();

    expect(await screen.findByText("Sin NRC")).toBeInTheDocument();
  });

  test("when the academic endpoint refuses the caller the view does not break", async () => {
    mockApi({ requiresCourse: true, courseStatus: 403 });
    renderCourse();

    expect(
      await screen.findByText(/Sin NRC|Sin información/),
    ).toBeInTheDocument();
  });
});
