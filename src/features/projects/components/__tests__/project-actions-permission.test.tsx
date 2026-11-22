import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { ProjectActions } from "../columns-project-table";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent } from "@/testing/test-utils";
import { Project } from "@/types/api";

const mockSession = (permissions: string[]) => {
  server.use(
    http.get("*/api/auth/me", () =>
      HttpResponse.json({
        id: 1,
        firstName: "Ana",
        lastName: "Ruiz",
        email: "ana@uninorte.edu.co",
        active: true,
        status: "CONFIRMED",
        platformRoles: [],
        platformPermissions: permissions,
      }),
    ),
  );
};

const project = {
  id: 7,
  name: "Robot clasificador",
  state: "UNDER_REVIEW",
  reason: null,
} as unknown as Project;

const renderActions = () => {
  const onChangeState = vi.fn();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  rtlRender(
    <QueryClientProvider client={queryClient}>
      <ProjectActions
        project={project}
        onApprove={vi.fn()}
        onChangeState={onChangeState}
        onReject={vi.fn()}
        onRequest={vi.fn()}
      />
    </QueryClientProvider>,
  );

  return { onChangeState };
};

const openMenu = async () => {
  const user = userEvent.setup();

  await user.click(screen.getByRole("button"));

  return user;
};

describe("ProjectActions: Cambiar estado", () => {
  test("is shown to a session with manage:projects and opens the modal", async () => {
    mockSession(["manage:events", "manage:projects"]);
    const { onChangeState } = renderActions();
    const user = await openMenu();

    await user.click(
      await screen.findByRole("menuitem", { name: "Cambiar estado" }),
    );
    expect(onChangeState).toHaveBeenCalledWith(7);
  });

  test("is hidden from a session without manage:projects", async () => {
    mockSession(["manage:events"]);
    renderActions();
    const user = await openMenu();

    // "Aprobar" needs the session loaded, so the menu reflects its permissions
    expect(
      await screen.findByRole("menuitem", { name: "Aprobar" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Cambiar estado" }),
    ).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
  });
});
