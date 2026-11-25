import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { DashboardInfo } from "../dashboard-info";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent, waitFor } from "@/testing/test-utils";

let permissions: string[] = [];

vi.mock("@/lib/auth", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");

  return {
    ...actual,
    useUser: () => ({
      data: {
        id: "u1",
        firstName: "Laura",
        email: "laura@iris.local",
        platformRoles: [],
        platformPermissions: permissions,
      },
      isLoading: false,
    }),
  };
});

const meEvent = (
  id: number,
  name: string,
  roles: string[],
  status = "AVAILABLE",
) => ({
  id,
  name,
  startDate: "2026-11-20T08:00:00.000Z",
  endDate: "2026-11-21T18:00:00.000Z",
  eventType: 1,
  statusName: status,
  roles,
});

const mockApi = ({
  current = [],
  past = [],
  pendingInvitations = 0,
}: {
  current?: unknown[];
  past?: unknown[];
  pendingInvitations?: number;
}) => {
  const requests: URLSearchParams[] = [];

  server.use(
    http.get("*/api/me/events", ({ request }) => {
      const params = new URL(request.url).searchParams;
      const list = params.get("status") === "past" ? past : current;

      requests.push(params);

      return HttpResponse.json({
        events: list,
        meta: { total: list.length, currentPage: 1, totalPages: 1 },
      });
    }),
    http.get("*/api/invitations/me", () =>
      HttpResponse.json({
        invitations: [],
        meta: {
          total: pendingInvitations,
          itemsOnCurrentPage: 0,
          itemsPerPage: 1,
          currentPage: 1,
          totalPages: 1,
        },
      }),
    ),
    http.get("*/api/dashboard/stats", () =>
      HttpResponse.json({
        activeEvents: 3,
        totalProjects: 12,
        juryMembers: 5,
        evaluations: 40,
      }),
    ),
  );

  return requests;
};

const renderPanel = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <DashboardInfo />
    </QueryClientProvider>,
  );
};

describe("DashboardInfo", () => {
  beforeEach(() => {
    permissions = [];
  });

  it("Laura: juror and tutor in one event, participant in another; one link per role", async () => {
    mockApi({
      current: [
        meEvent(5, "Feria de Ingeniería", ["JURY", "TUTOR"]),
        meEvent(4, "Feria 2026-30", ["PARTICIPANT"], "UPCOMING"),
      ],
    });
    renderPanel();

    expect(
      await screen.findByRole("link", {
        name: "Abrir Feria de Ingeniería como jurado",
      }),
    ).toHaveAttribute("href", "/app/events/5/dashboard?rol=jurado");
    expect(
      screen.getByRole("link", {
        name: "Abrir Feria de Ingeniería como tutor",
      }),
    ).toHaveAttribute("href", "/app/events/5/dashboard?rol=tutor");
    expect(
      screen.getByRole("link", {
        name: "Abrir Feria 2026-30 como participante",
      }),
    ).toHaveAttribute("href", "/app/events/4/dashboard?rol=participante");
    expect(screen.getByText("Hola, Laura")).toBeInTheDocument();
    expect(screen.getByText("Inscripciones abiertas")).toBeInTheDocument();
    expect(screen.queryByText("Administración")).not.toBeInTheDocument();
  });

  it("Diana: administrator and juror sees the administration card and her events", async () => {
    permissions = ["read:events"];
    mockApi({ current: [meEvent(5, "Feria de Ingeniería", ["JURY"])] });
    renderPanel();

    expect(await screen.findByText("Administración")).toBeInTheDocument();
    expect(await screen.findByText("12")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir panel/i })).toHaveAttribute(
      "href",
      "/app/admin",
    );
    expect(
      await screen.findByRole("link", { name: /como jurado/i }),
    ).toBeInTheDocument();
  });

  it("the dean: administration only, no events", async () => {
    permissions = ["read:events"];
    mockApi({});
    renderPanel();

    expect(await screen.findByText("Administración")).toBeInTheDocument();
    expect(
      await screen.findByText(/No tienes eventos en curso/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Abrir panel/i }),
    ).toBeInTheDocument();
  });

  it("Ana: professor and tutor sees the event once, with one entry per role", async () => {
    mockApi({
      current: [meEvent(5, "Feria de Ingeniería", ["PROFESSOR", "TUTOR"])],
    });
    renderPanel();

    expect(
      await screen.findByRole("link", {
        name: "Abrir Feria de Ingeniería como profesor",
      }),
    ).toHaveAttribute("href", "/app/events/5/dashboard?rol=profesor");
    expect(
      screen.getByRole("link", {
        name: "Abrir Feria de Ingeniería como tutor",
      }),
    ).toHaveAttribute("href", "/app/events/5/dashboard?rol=tutor");
    expect(screen.getByText("Proyectos de tus cursos")).toBeInTheDocument();
    // No tile per academic profile repeats the event
    expect(screen.getAllByText("Feria de Ingeniería")).toHaveLength(1);
  });

  it("Sofía: no events and no administration explains how to join one", async () => {
    mockApi({});
    renderPanel();

    expect(
      await screen.findByText(/No tienes eventos en curso/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/inscribirte a un evento/i)).toBeInTheDocument();
    expect(screen.queryByText("Administración")).not.toBeInTheDocument();
  });

  it("pending invitations show a notice that opens the invitations page", async () => {
    mockApi({ pendingInvitations: 2 });
    renderPanel();

    expect(
      await screen.findByRole("link", {
        name: /Tienes 2 invitaciones pendientes/i,
      }),
    ).toHaveAttribute("href", "/app/invitations");
  });

  it("no pending invitations, no notice", async () => {
    mockApi({ current: [meEvent(5, "Feria de Ingeniería", ["JURY"])] });
    renderPanel();

    await screen.findByRole("link", { name: /como jurado/i });
    expect(screen.queryByText(/invitaci/i)).not.toBeInTheDocument();
  });

  it("the history only asks for past events when it is opened", async () => {
    const requests = mockApi({
      current: [],
      past: [meEvent(2, "Feria 2025", ["PARTICIPANT"], "CLOSED")],
    });

    renderPanel();

    await screen.findByText(/No tienes eventos en curso/i);
    expect(requests.map((params) => params.get("status"))).toEqual(["current"]);

    await userEvent.click(screen.getByRole("button", { name: /Historial/i }));

    expect(
      await screen.findByRole("link", {
        name: /Feria 2025 como participante/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Feria 2025")).toBeInTheDocument();
    expect(requests.map((params) => params.get("status"))).toEqual([
      "current",
      "past",
    ]);
  });

  it("a role the front does not know does not break the card", async () => {
    mockApi({ current: [meEvent(5, "Feria", ["JURY", "ALUMNI"])] });
    renderPanel();

    expect(
      await screen.findByRole("link", { name: /Feria como jurado/i }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText(/alumni/i)).not.toBeInTheDocument(),
    );
  });

  it("offers a retry when the events fail to load", async () => {
    server.use(
      http.get("*/api/me/events", () =>
        HttpResponse.json({ message: "boom" }, { status: 500 }),
      ),
    );
    renderPanel();

    expect(
      await screen.findByText(/No se pudieron cargar tus eventos/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Reintentar/i }),
    ).toBeInTheDocument();
  });
});
