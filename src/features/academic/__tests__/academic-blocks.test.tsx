import {
  DocumentsBlock,
  JuryProgress,
  StudentList,
  TutorBlock,
} from "../components";

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

  it("lists the jurors with who evaluated, or says why there are none", () => {
    const { unmount } = rtlRender(
      <JuryProgress
        jurors={[
          { userId: 22, name: "Carla Ruiz", evaluated: false },
          { userId: 23, name: "Ana Pérez", evaluated: true },
          { userId: 21, name: null, evaluated: true },
        ]}
      />,
    );

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "2",
    );
    expect(screen.getByText(/de 3 jurados evaluaron/)).toBeInTheDocument();
    const rows = screen.getAllByRole("listitem");

    expect(rows[0]).toHaveTextContent("Carla RuizPendiente");
    expect(rows[1]).toHaveTextContent("Ana PérezEvaluó");
    expect(rows[2]).toHaveTextContent("Jurado sin nombreEvaluó");
    unmount();

    const { unmount: unmountEmpty } = rtlRender(
      <JuryProgress
        emptyMessage="Los jurados se asignan cuando el proyecto queda aprobado."
        jurors={[]}
      />,
    );

    expect(
      screen.getByText(
        "Los jurados se asignan cuando el proyecto queda aprobado.",
      ),
    ).toBeInTheDocument();
    unmountEmpty();

    rtlRender(<JuryProgress jurors={null} />);
    expect(
      screen.getByText("No se pudo cargar el avance de la evaluación."),
    ).toBeInTheDocument();
  });

  it("says when the project has no tutor", () => {
    rtlRender(<TutorBlock tutors={[]} />);

    expect(screen.getByText("Sin tutor registrado.")).toBeInTheDocument();
  });

  it("links each document to its stable open route", () => {
    rtlRender(
      <DocumentsBlock
        documents={[
          { id: 31, projectId: 5, type: "POSTER" },
          { id: 32, projectId: 5, type: 3 },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: /Póster/ })).toHaveAttribute(
      "href",
      "/api/projects/5/documents/31/open",
    );
    expect(
      screen.getByRole("link", { name: /Documento de soporte/ }),
    ).toHaveAttribute("href", "/api/projects/5/documents/32/open");
  });

  it("says when the project has no documents", () => {
    rtlRender(<DocumentsBlock documents={[]} />);

    expect(screen.getByText("Sin documentos cargados.")).toBeInTheDocument();
  });
});
