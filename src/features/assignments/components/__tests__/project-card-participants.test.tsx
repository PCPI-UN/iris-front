import { vi } from "vitest";

import { AssignmentProjects } from "../../hooks/use-assignment-projects";
import { ProjectsCard } from "../project-card";

import { rtlRender, screen } from "@/testing/test-utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("event=1"),
  usePathname: () => "/app/assignments",
}));

const assignmentWith = (projects: unknown[]) =>
  ({
    projects,
    isLoading: false,
    page: 1,
    meta: undefined,
    nameTerm: "",
    setNameTerm: vi.fn(),
    setPage: vi.fn(),
    jurorSearch: {
      jurorTerm: "",
      setJurorTerm: vi.fn(),
      isActive: false,
      isLoading: false,
      projects: [],
    },
  }) as unknown as AssignmentProjects;

describe("ProjectsCard participants", () => {
  test("renders enrolled participants that come without a name (with-jurors listing)", () => {
    rtlRender(
      <ProjectsCard
        assignment={assignmentWith([
          {
            id: 1,
            name: "Agua limpia",
            state: "APPROVED",
            // The listing only sends userId and studentCode for enrolled participants
            participants: [
              { userId: 9, projectId: 1, studentCode: "200099777" },
            ],
            pendingParticipants: [],
          },
          {
            id: 2,
            name: "Huerta solar",
            state: "APPROVED",
            participants: [],
            pendingParticipants: [
              {
                pendingId: 1,
                projectId: 2,
                firstName: "Ana",
                lastName: "Ruiz",
              },
            ],
          },
        ])}
      />,
    );

    expect(screen.getByText("Agua limpia")).toBeInTheDocument();
    expect(screen.getByText("Código 200099777")).toBeInTheDocument();
    expect(screen.getByText("Ana Ruiz")).toBeInTheDocument();
    expect(screen.getByText("AR")).toBeInTheDocument();
  });
});
