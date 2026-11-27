import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { server } from "@/testing/mocks/server";
import { rtlRender, waitFor } from "@/testing/test-utils";

/** Platform permissions of the Dean role (auth-service migrations): read-only access */
export const DEAN_PERMISSIONS = [
  "view:public_events",
  "accept:invitations",
  "manage:own_profile",
  "view:own_data",
  "read:users",
  "read:invitations",
  "read:events",
  "read:grades",
  "read:event-members",
  "read:academic_projects",
  "read_all:academic_projects",
];

/** The write permissions the administration pages ask for, on top of the Dean ones */
export const ADMIN_PERMISSIONS = [
  ...DEAN_PERMISSIONS,
  "manage:events",
  "manage:projects",
  "create:users",
  "create:event-members",
  "delete:event-members",
  "manage:courses",
];

/**
 * Renders `ui` for a session with these platform permissions and waits until
 * the session is loaded, so a hidden action is hidden because of the
 * permissions and not because `/auth/me` has not answered yet.
 */
export const renderWithSession = async (
  ui: ReactNode,
  permissions: string[],
) => {
  server.use(
    http.get("*/api/auth/me", () =>
      HttpResponse.json({
        id: 1,
        firstName: "Ana",
        lastName: "Ruiz",
        email: "ana@unal.edu.co",
        active: true,
        status: "CONFIRMED",
        platformRoles: [],
        platformPermissions: permissions,
      }),
    ),
  );
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const result = rtlRender(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );

  await waitFor(() => expect(queryClient.getQueryData(["user"])).toBeTruthy());

  return { ...result, queryClient };
};
