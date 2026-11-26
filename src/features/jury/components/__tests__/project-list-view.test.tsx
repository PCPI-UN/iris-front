import { ProjectListView } from "../project-list-view";

import { rtlRender, screen, userEvent } from "@/testing/test-utils";

const { mockProjects } = vi.hoisted(() => ({ mockProjects: vi.fn() }));

vi.mock("@/features/projects-public/api/get-jury-project", () => ({
  useJuryAssignedProjects: () => ({ data: mockProjects(), isLoading: false }),
}));

vi.mock("../../hooks/use-juror-event", () => ({
  useJurorEvent: () => ({ gradingScale: undefined }),
  maxGradeOf: () => undefined,
}));

const projectsToEvaluate = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `Proyecto ${index + 1}`,
    participants: [],
    documents: [],
    evaluated: false,
  }));

describe("ProjectListView", () => {
  test("shows 10 projects per page and moves to the next page", async () => {
    mockProjects.mockReturnValue(projectsToEvaluate(12));
    await rtlRender(<ProjectListView eventId="3" />);

    expect(screen.getByText("Proyecto 10")).toBeInTheDocument();
    expect(screen.queryByText("Proyecto 11")).not.toBeInTheDocument();
    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(screen.getByText("Proyecto 11")).toBeInTheDocument();
    expect(screen.queryByText("Proyecto 1")).not.toBeInTheDocument();
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();
  });

  test("ten projects or fewer show no pagination", async () => {
    mockProjects.mockReturnValue(projectsToEvaluate(10));
    await rtlRender(<ProjectListView eventId="3" />);

    expect(screen.getByText("Proyecto 10")).toBeInTheDocument();
    expect(screen.queryByText(/Página/)).not.toBeInTheDocument();
  });
});
