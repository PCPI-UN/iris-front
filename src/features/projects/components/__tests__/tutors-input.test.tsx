import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { EMPTY_TUTORS, TutorsValue } from "../../utils/tutors";
import { TutorsInput } from "../tutors-input";

import { server } from "@/testing/mocks/server";
import {
  act,
  rtlRender,
  screen,
  userEvent,
  waitFor,
} from "@/testing/test-utils";

let latest: TutorsValue = EMPTY_TUTORS;

const Harness = () => {
  const [value, setValue] = useState<TutorsValue>(EMPTY_TUTORS);

  latest = value;

  return <TutorsInput value={value} onChange={setValue} />;
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

describe("TutorsInput", () => {
  beforeEach(() => {
    latest = EMPTY_TUTORS;
  });

  test("does not search before 3 letters", async () => {
    const requests: string[] = [];

    server.use(
      http.get("*/api/projects/tutor-candidates", ({ request }) => {
        requests.push(request.url);

        return HttpResponse.json([]);
      }),
    );
    renderInput();

    await userEvent.type(screen.getByLabelText(/buscar tutor/i), "la");
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 450));
    });

    expect(requests).toHaveLength(0);
  });

  test("picks a registered tutor from the search", async () => {
    server.use(
      http.get("*/api/projects/tutor-candidates", ({ request }) => {
        expect(new URL(request.url).searchParams.get("search")).toBe("lau");

        return HttpResponse.json([
          { id: 12, firstName: "Laura", lastName: "Gómez" },
        ]);
      }),
    );
    renderInput();

    await userEvent.type(screen.getByLabelText(/buscar tutor/i), "lau");
    await userEvent.click(
      await screen.findByRole("button", { name: "Laura Gómez" }),
    );

    expect(latest.linked).toEqual([
      { id: 12, firstName: "Laura", lastName: "Gómez" },
    ]);
    expect(
      screen.getByRole("button", { name: /quitar a laura gómez/i }),
    ).toBeInTheDocument();
  });

  test("adds a pending tutor by name and email", async () => {
    renderInput();

    await userEvent.click(
      screen.getByRole("button", { name: /no encuentro al tutor/i }),
    );
    await userEvent.type(screen.getByLabelText(/nombre\(s\)/i), "Laura");
    await userEvent.type(
      screen.getByLabelText(/correo del tutor/i),
      "laura@uni.edu",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /agregar tutor/i }),
    );

    await waitFor(() =>
      expect(latest.pending).toEqual([
        { firstName: "Laura", lastName: "", email: "laura@uni.edu" },
      ]),
    );
    expect(screen.getByText(/laura@uni\.edu · pendiente/i)).toBeInTheDocument();
  });

  test("rejects an invalid email for a pending tutor", async () => {
    renderInput();

    await userEvent.click(
      screen.getByRole("button", { name: /no encuentro al tutor/i }),
    );
    await userEvent.type(screen.getByLabelText(/nombre\(s\)/i), "Laura");
    await userEvent.type(
      screen.getByLabelText(/correo del tutor/i),
      "no-es-correo",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /agregar tutor/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(/no es válido/i);
    expect(latest.pending).toHaveLength(0);
  });

  test("removes a chosen tutor", async () => {
    renderInput();

    await userEvent.click(
      screen.getByRole("button", { name: /no encuentro al tutor/i }),
    );
    await userEvent.type(screen.getByLabelText(/nombre\(s\)/i), "Laura");
    await userEvent.type(
      screen.getByLabelText(/correo del tutor/i),
      "laura@uni.edu",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /agregar tutor/i }),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: /quitar a laura/i }),
    );

    expect(latest.pending).toHaveLength(0);
  });
});
