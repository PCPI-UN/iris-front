import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen, waitFor } from "@/testing/test-utils";

import { Can } from "../can";
import { PermissionGuard } from "../permission-guard";

const mockSession = (
  permissions: string[] | null,
  roleNames: string[] = [],
) => {
  server.use(
    http.get("*/api/auth/me", () =>
      permissions === null
        ? HttpResponse.json({ message: "Unauthorized" }, { status: 401 })
        : HttpResponse.json({
            id: 1,
            firstName: "Ana",
            lastName: "Ruiz",
            email: "ana@uninorte.edu.co",
            active: true,
            status: "CONFIRMED",
            platformRoles: roleNames.map((name, i) => ({
              id: i + 1,
              name,
              scope: "PLATFORM",
            })),
            platformPermissions: permissions,
          }),
    ),
  );
};

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return rtlRender(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

describe("PermissionGuard", () => {
  test("shows the view to a session with the permission, whatever its role name", async () => {
    mockSession(["read:events"], ["Dean"]);
    renderWithClient(
      <PermissionGuard permissions={["read:events"]}>
        <p>Vista de eventos</p>
      </PermissionGuard>,
    );
    expect(await screen.findByText("Vista de eventos")).toBeInTheDocument();
  });

  test("hides the view from a session without the permission", async () => {
    mockSession(["view:public_events"], ["Admin"]);
    renderWithClient(
      <PermissionGuard permissions={["read:events"]}>
        <p>Vista de eventos</p>
      </PermissionGuard>,
    );
    await waitFor(() =>
      expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument(),
    );
    expect(screen.queryByText("Vista de eventos")).not.toBeInTheDocument();
  });

  test("an empty list only requires a session", async () => {
    mockSession([], ["User"]);
    renderWithClient(
      <PermissionGuard permissions={[]}>
        <p>Mi evento</p>
      </PermissionGuard>,
    );
    expect(await screen.findByText("Mi evento")).toBeInTheDocument();
  });

  test("without a session the view is hidden", async () => {
    mockSession(null);
    renderWithClient(
      <PermissionGuard permissions={[]}>
        <p>Mi evento</p>
      </PermissionGuard>,
    );
    await waitFor(() =>
      expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument(),
    );
    expect(screen.queryByText("Mi evento")).not.toBeInTheDocument();
  });
});

describe("Can", () => {
  test("shows the action only with the permission", async () => {
    mockSession(["read:events"], ["Dean"]);
    renderWithClient(
      <>
        <Can permission="read:events">
          <button>Ver</button>
        </Can>
        <Can permission="manage:events" fallback={<span>Solo lectura</span>}>
          <button>Editar</button>
        </Can>
      </>,
    );
    expect(
      await screen.findByRole("button", { name: "Ver" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Solo lectura")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Editar" }),
    ).not.toBeInTheDocument();
  });
});
