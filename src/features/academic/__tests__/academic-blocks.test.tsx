import { JuryProgress, StudentList, TutorBlock } from "../components";

import { rtlRender, screen } from "@/testing/test-utils";

describe("academic blocks", () => {
  it("lists each student with their state", () => {
    rtlRender(
      <StudentList
        students={[
          {
            status: "CONFIRMED",
            userId: 7,
            firstName: "Valentina",
            lastName: "Ortiz",
            email: null,
            studentCode: "000451203",
            semester: "8",
            career: "Ing. de Sistemas",
          },
          {
            status: "INVITED",
            userId: null,
            firstName: "Mariana",
            lastName: "Peña",
            email: "mpena@uninorte.edu.co",
            studentCode: "000449310",
            semester: null,
            career: null,
          },
          {
            status: "PENDING",
            userId: null,
            firstName: null,
            lastName: null,
            email: null,
            studentCode: "000453002",
            semester: null,
            career: null,
          },
        ]}
      />,
    );

    expect(screen.getByText("Valentina Ortiz")).toBeInTheDocument();
    expect(screen.getByText("Confirmado")).toBeInTheDocument();
    expect(screen.getByText("Invitado")).toBeInTheDocument();
    expect(screen.getByText("Código 000453002")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it("shows how many jurors evaluated, or why there are none", () => {
    const { unmount } = rtlRender(
      <JuryProgress assignedJurors={3} completedEvaluations={2} />,
    );

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "2",
    );
    expect(screen.getByText(/de 3 jurados evaluaron/)).toBeInTheDocument();
    unmount();

    rtlRender(
      <JuryProgress
        assignedJurors={0}
        completedEvaluations={0}
        emptyMessage="Los jurados se asignan cuando el proyecto queda aprobado."
      />,
    );
    expect(
      screen.getByText(
        "Los jurados se asignan cuando el proyecto queda aprobado.",
      ),
    ).toBeInTheDocument();
  });

  it("says when the project has no tutor", () => {
    rtlRender(<TutorBlock tutors={[]} />);

    expect(screen.getByText("Sin tutor registrado.")).toBeInTheDocument();
  });
});
