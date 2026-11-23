import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { CourseSectionInput } from "../course-section-input";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent } from "@/testing/test-utils";

let chosen = "";

const Harness = () => {
  const [value, setValue] = useState("");

  chosen = value;

  return <CourseSectionInput eventId={1} value={value} onChange={setValue} />;
};

const renderInput = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <Harness />
    </QueryClientProvider>,
  );
};

const sections = {
  sections: [
    {
      id: 7,
      nrc: "1001",
      name: "Proyecto Final - Grupo 1",
      professor: { userId: 12, firstName: "Laura", lastName: "Gómez" },
    },
    { id: 8, nrc: "1002", name: "Proyecto Final - Grupo 2", professor: null },
  ],
  professorsAvailable: true,
};

describe("CourseSectionInput", () => {
  beforeEach(() => {
    chosen = "";
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  test("the student picks the NRC of their course among the ones of the term", async () => {
    let asked = "";

    server.use(
      http.get("*/api/events/:eventId/course-sections", ({ params }) => {
        asked = String(params.eventId);

        return HttpResponse.json(sections);
      }),
    );
    renderInput();

    await userEvent.click(
      await screen.findByRole("button", { name: /nrc del curso/i }),
    );
    await userEvent.click(
      await screen.findByRole("option", {
        name: /1001 - Proyecto Final - Grupo 1/,
      }),
    );

    expect(chosen).toBe("1001");
    expect(asked).toBe("1");
  });

  test("shows the professor of each section when it is known", async () => {
    server.use(
      http.get("*/api/events/:eventId/course-sections", () =>
        HttpResponse.json(sections),
      ),
    );
    renderInput();

    await userEvent.click(
      await screen.findByRole("button", { name: /nrc del curso/i }),
    );

    expect(
      await screen.findByText("Profesor: Laura Gómez"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  test("a term without sections says so and does not let the student pick", async () => {
    server.use(
      http.get("*/api/events/:eventId/course-sections", () =>
        HttpResponse.json({ sections: [], professorsAvailable: true }),
      ),
    );
    renderInput();

    expect(
      await screen.findByText(
        /no tiene NRC cargados\. Comuníquese con la coordinación/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /nrc del curso/i }),
    ).toHaveAttribute("data-disabled", "true");
  });

  test("when the NRC cannot be loaded it offers to retry", async () => {
    let calls = 0;

    server.use(
      http.get("*/api/events/:eventId/course-sections", () => {
        calls += 1;

        return calls === 1
          ? HttpResponse.json({ message: "Error interno" }, { status: 500 })
          : HttpResponse.json(sections);
      }),
    );
    renderInput();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudieron cargar los NRC del periodo del evento.",
    );
    await userEvent.click(screen.getByRole("button", { name: /reintentar/i }));

    expect(
      await screen.findByRole("button", { name: /nrc del curso/i }),
    ).toBeInTheDocument();
    expect(calls).toBe(2);
  });
});
