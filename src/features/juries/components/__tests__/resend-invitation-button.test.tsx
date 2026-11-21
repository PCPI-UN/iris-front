import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { useNotifications } from "@/components/ui/notifications";
import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent, waitFor } from "@/testing/test-utils";
import type { JuryInvitation } from "@/types/api";

import { ResendInvitationButton } from "../resend-invitation-button";

const invitation = {
  id: "15",
  email: "jurado@uninorte.edu.co",
  status: 0,
} as unknown as JuryInvitation;

test("a resend is reported as registered, not as sent", async () => {
  server.use(
    http.post("*/api/invitations/:id/resend", () =>
      HttpResponse.json({ status: "PENDING" }),
    ),
  );
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  rtlRender(
    <QueryClientProvider client={queryClient}>
      <ResendInvitationButton invitation={invitation} />
    </QueryClientProvider>,
  );

  await userEvent.click(
    screen.getByRole("button", { name: /reenviar invitación/i }),
  );

  await waitFor(() => {
    const notifications = useNotifications.getState().notifications;
    expect(notifications.at(-1)).toMatchObject({
      type: "success",
      title: "Reenvío registrado",
    });
    // Since Iris#199 the email goes out in the background
    expect(notifications.at(-1)?.message).toMatch(/se enviará en unos minutos/);
    expect(notifications.at(-1)?.message).not.toMatch(/se ha reenviado/i);
  });
});
