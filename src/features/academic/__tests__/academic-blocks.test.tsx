import {
  DocumentsBlock,
  JurorEvaluations,
  JuryProgress,
  ProjectResult,
  SemesterHistory,
  StudentList,
  TutorBlock,
} from "../components";

import { rtlRender, screen, userEvent } from "@/testing/test-utils";

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

  it("shows the grade, the position with its tie and the award", () => {
    rtlRender(
      <ProjectResult
        ranking={{
          position: 2,
          tied: true,
          categoryId: 1,
          categoryName: "Ingeniería",
          awardTitle: "Mención de honor",
        }}
        result={{
          finalScore: 4.25,
          maxScore: 5,
          components: [
            {
              component: "Técnico",
              weight: 1,
              criteria: [
                {
                  criterionId: 11,
                  criterion: "Solución",
                  weight: 1,
                  score: 4.25,
                },
              ],
            },
          ],
          comments: [],
          evaluations: [],
        }}
        statusLabel="Oficial"
      />,
    );

    expect(screen.getByText(/\/ 5/)).toHaveTextContent("4.25 / 5");
    expect(
      screen.getByText("Puesto 2 (empate) en Ingeniería"),
    ).toBeInTheDocument();
    expect(screen.getByText("Mención de honor")).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Nota por componente" }),
    ).toHaveTextContent("Técnico");
  });

  it("names each evaluation by letter, with its comment and its breakdown on demand", async () => {
    rtlRender(
      <JurorEvaluations
        evaluations={[
          {
            grade: 4,
            components: [
              {
                component: "Técnico",
                weight: 1,
                criteria: [
                  {
                    criterionId: 11,
                    criterion: "Solución",
                    weight: 1,
                    score: 4,
                  },
                ],
              },
            ],
            comment: "Buen prototipo.",
          },
          { grade: 3.5, components: [], comment: null },
        ]}
        maxScore={5}
      />,
    );

    const [first, second] = screen
      .getByRole("list", { name: "Evaluaciones de los jurados" })
      .querySelectorAll(":scope > li");

    expect(first).toHaveTextContent("Jurado A4 / 5Buen prototipo.");
    expect(second).toHaveTextContent("Jurado B3.5 / 5Sin comentario.");
    expect(screen.getByText("Técnico")).not.toBeVisible();
    await userEvent.click(screen.getByText("Ver desglose"));
    expect(screen.getByText("Técnico")).toBeVisible();
  });

  it("groups the events by semester and links each one to its projects", () => {
    const base = {
      inscriptionDeadline: "2026-01-01T12:00:00",
      active: false,
      evaluationsOpened: false,
      requiresCourse: true,
    };

    rtlRender(
      <SemesterHistory
        events={[
          {
            ...base,
            id: 3,
            name: "Feria 2025-2",
            startDate: "2025-11-20T12:00:00",
            endDate: "2025-11-21T12:00:00",
            resultsPublished: true,
          },
          {
            ...base,
            id: 4,
            name: "Feria 2026-1",
            startDate: "2026-05-20T12:00:00",
            endDate: "2026-05-21T12:00:00",
            resultsPublished: false,
          },
        ]}
        getHref={(eventId) => `/app/teaching/director?event=${eventId}`}
      />,
    );

    const headings = screen.getAllByRole("heading", { level: 2 });

    expect(headings.map((heading) => heading.textContent)).toEqual([
      "Semestre 2026-1",
      "Semestre 2025-2",
    ]);
    expect(screen.getByRole("link", { name: /Feria 2025-2/ })).toHaveAttribute(
      "href",
      "/app/teaching/director?event=3",
    );
    expect(screen.getByText("Resultados publicados")).toBeInTheDocument();
  });
});
