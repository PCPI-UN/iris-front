import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { ChangeProjectStateModal } from "../change-state-modal";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent, waitFor } from "@/testing/test-utils";

type SentBody = {
  state: string;
  reason: string;
  notify: boolean;
  force: boolean;
};

const blockedResponse = () =>
  HttpResponse.json(
    {
      statusCode: 409,
      message:
        "No se cambió el estado porque el proyecto ya tiene 2 evaluaciones de jurados.",
      code: "PROJECT_STATE_CHANGE_BLOCKED",
      details: {
        hasEvaluations: true,
        evaluationCount: 2,
        resultsPublished: false,
        leavesApproved: true,
      },
      timestamp: "2026-11-21T15:00:00.000Z",
    },
    { status: 409 },
  );

const okResponse = (state: string) =>
  HttpResponse.json({
    project: { id: 7, state },
    failedEffects: [],
    warning: null,
  });

/** Records every body sent to the endpoint and answers with the given responses in order */
const mockAdminState = (...responses: Array<(body: SentBody) => Response>) => {
  const bodies: SentBody[] = [];

  server.use(
    http.patch("*/api/projects/:projectId/admin/state", async ({ request }) => {
      const body = (await request.json()) as SentBody;

      bodies.push(body);
      const respond =
        responses[Math.min(bodies.length - 1, responses.length - 1)];

      return respond(body);
    }),
  );

  return bodies;
};

const renderModal = (state: "APPROVED" | "UNDER_REVIEW" = "APPROVED") => {
  const onOpenChange = vi.fn();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  rtlRender(
    <QueryClientProvider client={queryClient}>
      <ChangeProjectStateModal
        isOpen
        project={{ id: 7, name: "Robot clasificador", state }}
        onOpenChange={onOpenChange}
      />
    </QueryClientProvider>,
  );

  return { onOpenChange };
};

const confirmButton = () =>
  screen.getByRole("button", { name: "Cambiar estado" });

const fillForm = async (stateLabel: string, reason: string) => {
  const user = userEvent.setup();

  await user.click(await screen.findByRole("radio", { name: stateLabel }));
  if (reason) {
    await user.type(screen.getByRole("textbox", { name: /motivo/i }), reason);
  }

  return user;
};

describe("ChangeProjectStateModal", () => {
  test("does not offer the current state of the project", async () => {
    renderModal("APPROVED");
    expect(
      await screen.findByRole("radio", { name: "En revisión" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "Rechazado" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "Cambios solicitados" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("radio", { name: "Aprobado" }),
    ).not.toBeInTheDocument();
  });

  test("keeps the confirmation disabled while the reason is empty or blank", async () => {
    renderModal();
    const user = await fillForm("En revisión", "");

    expect(confirmButton()).toBeDisabled();

    const reason = screen.getByRole("textbox", { name: /motivo/i });

    await user.type(reason, "   ");
    expect(confirmButton()).toBeDisabled();

    await user.type(reason, "Se aprobó por error");
    expect(confirmButton()).toBeEnabled();
  });

  test("does not notify the participants unless the box is checked", async () => {
    const bodies = mockAdminState(() => okResponse("UNDER_REVIEW"));
    const { onOpenChange } = renderModal();
    const user = await fillForm("En revisión", "Se aprobó por error");

    expect(
      screen.getByRole("checkbox", { name: "Notificar a los integrantes" }),
    ).not.toBeChecked();
    await user.click(confirmButton());

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(bodies).toEqual([
      {
        state: "UNDER_REVIEW",
        reason: "Se aprobó por error",
        notify: false,
        force: false,
      },
    ]);
  });

  test("sends notify when the box is checked", async () => {
    const bodies = mockAdminState(() => okResponse("REJECTED"));
    const { onOpenChange } = renderModal();
    const user = await fillForm("Rechazado", "No cumple los requisitos");

    await user.click(
      screen.getByRole("checkbox", { name: "Notificar a los integrantes" }),
    );
    await user.click(confirmButton());

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(bodies[0]).toMatchObject({
      state: "REJECTED",
      notify: true,
      force: false,
    });
  });

  test("explains a 409 by evaluations and resends with force after the confirmation", async () => {
    const bodies = mockAdminState(blockedResponse, () =>
      okResponse("UNDER_REVIEW"),
    );
    const { onOpenChange } = renderModal();
    const user = await fillForm("En revisión", "Se aprobó por error");

    await user.click(confirmButton());

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent(
      "El proyecto ya tiene 2 evaluaciones de jurados.",
    );
    expect(alert).toHaveTextContent(
      "sale del ranking y de la plantilla e importación de jurados",
    );
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(bodies).toHaveLength(1);

    await user.click(
      screen.getByRole("button", { name: "Cambiar de todas formas" }),
    );

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(bodies).toHaveLength(2);
    expect(bodies[1]).toEqual({
      state: "UNDER_REVIEW",
      reason: "Se aprobó por error",
      notify: false,
      force: true,
    });
  });

  test("asks again without force when the form changes after a 409", async () => {
    mockAdminState(blockedResponse);
    renderModal();
    const user = await fillForm("En revisión", "Se aprobó por error");

    await user.click(confirmButton());
    await screen.findByRole("alert");

    await user.click(screen.getByRole("radio", { name: "Rechazado" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(confirmButton()).toBeEnabled();
  });
});
