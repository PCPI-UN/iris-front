import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { describe, expect, test } from "vitest";

import { ProjectCourse } from "../project-course";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen } from "@/testing/test-utils";
import { ProjectAcademicCourse } from "@/types/api";

const mockEvent = (requiresCourse: boolean) => {
  server.use(
    http.get("*/api/events/:id", () =>
      HttpResponse.json({
        event: { id: 1, name: "Feria", requiresCourse, termId: 1 },
      }),
    ),
  );
};

const renderCourse = (course?: ProjectAcademicCourse | null) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <ProjectCourse course={course} eventId={1} />
    </QueryClientProvider>,
  );
};

describe("ProjectCourse", () => {
  test("shows the NRC, the course and the term of the project", async () => {
    mockEvent(true);
    renderCourse({
      id: 7,
      nrc: "1001",
      name: "Proyecto Final - Grupo 1",
      term: "202610",
      departmentName: "Ingeniería de Sistemas",
    });

    expect(await screen.findByText("NRC 1001")).toBeInTheDocument();
    expect(
      screen.getByText("Proyecto Final - Grupo 1 · Periodo 202610"),
    ).toBeInTheDocument();
  });

  test("a project of an event that does not require NRC says it does not apply", async () => {
    mockEvent(false);
    renderCourse(undefined);

    expect(await screen.findByText("No aplica")).toBeInTheDocument();
  });

  test("a project from before NRCs existed says it has none, without breaking the view", async () => {
    mockEvent(true);
    renderCourse(null);

    expect(await screen.findByText("Sin NRC")).toBeInTheDocument();
  });

  test("does not call the academic endpoints, which need an academic profile", async () => {
    const academicCalls: string[] = [];

    server.use(
      http.get("*/api/academic/*", ({ request }) => {
        academicCalls.push(request.url);

        return HttpResponse.json({}, { status: 400 });
      }),
    );
    mockEvent(true);
    renderCourse({ nrc: "1001", name: "Grupo 1", term: null });

    expect(await screen.findByText("NRC 1001")).toBeInTheDocument();
    expect(academicCalls).toEqual([]);
  });
});
