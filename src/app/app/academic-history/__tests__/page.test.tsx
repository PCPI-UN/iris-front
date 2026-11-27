import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { HttpResponse, http } from "msw";
import { beforeEach, expect, it } from "vitest";

import AcademicHistoryPage from "../page";

import { db } from "@/testing/mocks/db";
import { server } from "@/testing/mocks/server";
import { AUTH_COOKIE, encode, sanitizeUser } from "@/testing/mocks/utils";

/**
 * La trayectoria del estudiante tiene ruta propia desde que /app es el panel
 * único: aquí se ve el historial con la nota de cada evento, distinguiendo la
 * participación en curso de las ediciones terminadas.
 */

const dashboard = {
  profile: {
    id: 2,
    firstName: "Aki",
    lastName: "Hayakawa",
    email: "aki@iris.local",
    studentCode: "200145892",
    career: "Ingeniería de Sistemas y Computación",
    semester: 8,
  },
  kpis: { totalFairs: 2, totalProjects: 2, totalAwards: 1 },
  currentProject: {
    id: 9,
    eventId: 4,
    eventName: "Feria de Proyectos 2026-30",
    semester: "2026-30",
    projectCode: "PROY-2026-101",
    name: "Plataforma de trazabilidad de residuos",
    description: "Seguimiento de residuos reciclables.",
    categoryName: "Ingeniería de Sistemas",
    enrollmentStatus: "APPROVED",
    canEdit: false,
    participantsCount: 3,
    documentsCount: 2,
  },
  evaluation: { resultsPublished: false, finalScore: null },
  trajectory: [
    {
      id: 9,
      eventId: 4,
      semester: "2026-30",
      eventName: "Feria de Proyectos 2026-30",
      courseName: "Ingeniería de Sistemas",
      projectName: "Plataforma de trazabilidad de residuos",
      finalScore: null,
      award: null,
      isCurrent: true,
      diplomaAvailable: false,
    },
    {
      id: 1,
      eventId: 1,
      semester: "2025-10",
      eventName: "Feria de Proyectos 2025-10",
      courseName: "Ingeniería de Sistemas",
      projectName: "Sistema de riego inteligente",
      finalScore: 81,
      award: "Primer puesto",
      isCurrent: false,
      diplomaAvailable: false,
    },
  ],
  bySemester: [],
};

const authenticateStudent = () => {
  const email = "aki@iris.local";
  let user = db.user.findFirst({ where: { email: { equals: email } } });

  if (!user) {
    user = db.user.create({
      id: `test-${email}`,
      firstName: "Aki",
      lastName: "Hayakawa",
      email,
      role: "USER",
      active: true,
      status: "ACTIVE",
      platformRoles: [{ id: 3, name: "User", scope: "platform" }],
      platformPermissions: [],
    } as any);
  }
  Cookies.set(AUTH_COOKIE, encode(sanitizeUser(user)));
};

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AcademicHistoryPage />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  Cookies.remove(AUTH_COOKIE);
  authenticateStudent();
});

it("muestra la trayectoria con la nota de los eventos terminados y la participación en curso aparte", async () => {
  server.use(
    http.get("*/api/students/me/dashboard", () =>
      HttpResponse.json(dashboard as any),
    ),
  );
  renderPage();

  expect(
    await screen.findByText("Trayectoria e Historial de Participaciones"),
  ).toBeInTheDocument();
  expect(screen.getByText("Sistema de riego inteligente")).toBeInTheDocument();
  expect(screen.getByText(/Calificación:\s*81$/)).toBeInTheDocument();
  expect(
    screen.getByText("Distinción obtenida: Primer puesto"),
  ).toBeInTheDocument();
  // La edición en curso no muestra nota hasta que se publiquen los resultados
  expect(screen.getByText("Edición en Curso")).toBeInTheDocument();
  expect(screen.getByText("Participación en curso")).toBeInTheDocument();
  expect(screen.getAllByText(/Calificación:/)).toHaveLength(1);
});

it("muestra un error con reintento si el dashboard no se puede cargar", async () => {
  server.use(
    http.get("*/api/students/me/dashboard", () =>
      HttpResponse.json({ message: "Error" }, { status: 500 }),
    ),
  );
  renderPage();

  expect(
    await screen.findByRole("button", { name: /reintentar/i }),
  ).toBeInTheDocument();
});
