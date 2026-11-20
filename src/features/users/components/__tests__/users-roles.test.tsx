import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";

import { server } from "@/testing/mocks/server";
import {
  rtlRender,
  screen,
  userEvent,
  waitFor,
  within,
} from "@/testing/test-utils";

import { UsersRoles } from "../users-roles";

const ROLES = [
  { id: 1, name: "Admin", description: "Administrador", scope: "PLATFORM" },
  { id: 3, name: "User", description: "Usuario", scope: "PLATFORM" },
  { id: 4, name: "Juror", description: "Jurado", scope: "EVENT" },
  { id: 6, name: "FacultyAdmin", description: "Decanatura", scope: "PLATFORM" },
  { id: 9, name: "Professor", description: "Profesor", scope: "PLATFORM" },
];

const USERS = [
  {
    id: 1,
    firstName: "Admin",
    lastName: "System",
    email: "admin@iris.local",
    active: true,
    status: "CONFIRMED",
  },
  {
    id: 2,
    firstName: "Laura",
    lastName: "Gómez",
    email: "laura@uninorte.edu.co",
    active: true,
    status: "CONFIRMED",
  },
];

const mockApi = ({
  sessionPermissions,
  putStatus = 200,
}: {
  sessionPermissions: string[];
  putStatus?: number;
}) => {
  const puts: unknown[] = [];
  server.use(
    http.get("*/api/auth/me", () =>
      HttpResponse.json({
        id: 1,
        firstName: "Admin",
        lastName: "System",
        email: "admin@iris.local",
        active: true,
        status: "CONFIRMED",
        platformRoles: [],
        platformPermissions: sessionPermissions,
      }),
    ),
    http.get("*/api/users/roles", () => HttpResponse.json({ roles: ROLES })),
    http.get("*/api/users", () =>
      HttpResponse.json({
        users: USERS,
        meta: {
          totalItems: 2,
          itemsOnPage: 2,
          itemsPerPage: 10,
          totalPages: 1,
        },
      }),
    ),
    http.put("*/api/users/:id/roles", async ({ request, params }) => {
      const body = (await request.json()) as { roleIds: number[] };
      puts.push({ userId: params.id, body });
      if (putStatus !== 200) {
        return HttpResponse.json({ message: "error" }, { status: putStatus });
      }
      return HttpResponse.json({
        roles: ROLES.filter((r) => body.roleIds.includes(r.id)),
      });
    }),
  );
  return puts;
};

beforeEach(() => {
  // The global mock in setup-tests cannot be used with `new`
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

const renderScreen = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <UsersRoles />
    </QueryClientProvider>,
  );
};

const rowOf = async (email: string) =>
  (await screen.findByText(email)).closest("tr")!;

test("lists only the platform roles and the users", async () => {
  mockApi({ sessionPermissions: ["read:users"] });
  renderScreen();

  expect(await screen.findByText("Professor")).toBeInTheDocument();
  // Event roles are not assigned here
  expect(screen.queryByText("Juror")).not.toBeInTheDocument();
  expect(await screen.findByText("laura@uninorte.edu.co")).toBeInTheDocument();
});

test("a read-only session does not see the change roles action", async () => {
  mockApi({ sessionPermissions: ["read:users"] });
  renderScreen();

  await screen.findByText("laura@uninorte.edu.co");
  expect(
    screen.queryByRole("button", { name: "Cambiar roles" }),
  ).not.toBeInTheDocument();
});

test("replaces the roles of a user and shows the ones it now holds", async () => {
  const puts = mockApi({
    sessionPermissions: ["read:users", "manage:user_roles"],
  });
  renderScreen();

  const row = await rowOf("laura@uninorte.edu.co");
  await userEvent.click(
    await within(row).findByRole("button", { name: "Cambiar roles" }),
  );
  await userEvent.click(
    await screen.findByRole("switch", { name: "Professor" }),
  );
  await userEvent.click(screen.getByRole("button", { name: "Guardar roles" }));

  await waitFor(() =>
    expect(puts).toEqual([{ userId: "2", body: { roleIds: [9] } }]),
  );
  expect(
    await within(await rowOf("laura@uninorte.edu.co")).findByText("Professor"),
  ).toBeInTheDocument();
});

test("nobody can change their own roles", async () => {
  mockApi({ sessionPermissions: ["read:users", "manage:user_roles"] });
  renderScreen();

  const row = await rowOf("admin@iris.local");
  expect(
    await within(row).findByRole("button", { name: "Cambiar roles" }),
  ).toBeDisabled();
});

test("without manage:admins the Admin and FacultyAdmin roles are locked", async () => {
  mockApi({ sessionPermissions: ["read:users", "manage:user_roles"] });
  renderScreen();

  const row = await rowOf("laura@uninorte.edu.co");
  await userEvent.click(
    await within(row).findByRole("button", { name: "Cambiar roles" }),
  );

  expect(await screen.findByRole("switch", { name: "Admin" })).toBeDisabled();
  expect(screen.getByRole("switch", { name: "FacultyAdmin" })).toBeDisabled();
  expect(screen.getByRole("switch", { name: "Professor" })).toBeEnabled();
});

test("explains the backend rules when the change is rejected", async () => {
  mockApi({
    sessionPermissions: ["read:users", "manage:user_roles", "manage:admins"],
    putStatus: 400,
  });
  renderScreen();

  const row = await rowOf("laura@uninorte.edu.co");
  await userEvent.click(
    await within(row).findByRole("button", { name: "Cambiar roles" }),
  );
  await userEvent.click(await screen.findByRole("switch", { name: "User" }));
  await userEvent.click(screen.getByRole("button", { name: "Guardar roles" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    /debe conservar al menos un Admin activo/,
  );
});
