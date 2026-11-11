import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { useNotifications } from "@/components/ui/notifications";
import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent, waitFor } from "@/testing/test-utils";

import { Profile } from "../../api/get-profile";
import { UpdateProfile } from "../update-profile";

const profile: Profile = {
  id: 1,
  firstName: "Laura",
  lastName: "Gómez",
  email: "laura@uninorte.edu.co",
  phone: "3001234567",
  status: "CONFIRMED",
  roles: ["Participant"],
  academic: { studentCode: null, career: null, semester: null, derived: true },
  projects: [],
  totalProjects: 0,
};

const mockPatch = (
  respond: (body: Record<string, unknown>) => Response,
): (() => Record<string, unknown> | undefined) => {
  let received: Record<string, unknown> | undefined;
  server.use(
    http.patch("*/profile/me", async ({ request }) => {
      received = (await request.json()) as Record<string, unknown>;
      return respond(received);
    }),
    // The mutation refreshes the session user
    http.get("*/auth/me", () => HttpResponse.json({}, { status: 401 })),
  );
  return () => received;
};

const renderForm = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <UpdateProfile profile={profile} />
    </QueryClientProvider>,
  );
};

const saveButton = () =>
  screen.getByRole("button", { name: /guardar cambios/i });

test("shows the current values and keeps the email read only", () => {
  renderForm();

  expect(screen.getByRole("textbox", { name: /nombre/i })).toHaveValue("Laura");
  expect(screen.getByRole("textbox", { name: /apellido/i })).toHaveValue(
    "Gómez",
  );
  expect(screen.getByRole("textbox", { name: /teléfono/i })).toHaveValue(
    "3001234567",
  );
  expect(
    screen.getByRole("textbox", { name: /correo electrónico/i }),
  ).toHaveAttribute("readonly");
  expect(saveButton()).toBeDisabled();
});

test("shows a validation message and does not call the API", async () => {
  const getBody = mockPatch(() => HttpResponse.json(profile));
  renderForm();

  const phone = screen.getByRole("textbox", { name: /teléfono/i });
  await userEvent.clear(phone);
  await userEvent.type(phone, "12345");
  await userEvent.click(saveButton());

  expect(
    await screen.findByText(/número colombiano de 10 dígitos/i),
  ).toBeInTheDocument();
  expect(getBody()).toBeUndefined();
});

test("sends only the changed fields and shows a success message", async () => {
  const getBody = mockPatch((body) =>
    HttpResponse.json({ ...profile, ...body }),
  );
  renderForm();

  const firstName = screen.getByRole("textbox", { name: /nombre/i });
  await userEvent.clear(firstName);
  await userEvent.type(firstName, "  Ana  ");
  await userEvent.click(saveButton());

  await waitFor(() => expect(getBody()).toEqual({ firstName: "Ana" }));
  await waitFor(() =>
    expect(useNotifications.getState().notifications).toContainEqual(
      expect.objectContaining({ type: "success", title: "Perfil actualizado" }),
    ),
  );
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("shows a clear message when the phone is already taken", async () => {
  mockPatch(() =>
    HttpResponse.json(
      { message: "Another user with this phone number already exists" },
      { status: 409 },
    ),
  );
  renderForm();

  const phone = screen.getByRole("textbox", { name: /teléfono/i });
  await userEvent.clear(phone);
  await userEvent.type(phone, "3109876543");
  await userEvent.click(saveButton());

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Ese número de teléfono ya está registrado por otro usuario.",
  );
  // The user keeps what they typed so they can fix it
  expect(phone).toHaveValue("3109876543");
});

test("discard restores the saved values", async () => {
  renderForm();

  const lastName = screen.getByRole("textbox", { name: /apellido/i });
  await userEvent.clear(lastName);
  await userEvent.type(lastName, "Otro");
  await userEvent.click(screen.getByRole("button", { name: /descartar/i }));

  expect(lastName).toHaveValue("Gómez");
  expect(saveButton()).toBeDisabled();
});
