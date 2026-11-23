import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { TermField } from "../term-field";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent, waitFor } from "@/testing/test-utils";

let chosen: number | undefined;

const Harness = ({ errorMessage }: { errorMessage?: string }) => {
  const [value, setValue] = useState<number | undefined>(undefined);

  chosen = value;

  return (
    <TermField
      isOpen
      errorMessage={errorMessage}
      value={value}
      onChange={setValue}
    />
  );
};

const renderField = (props: { errorMessage?: string } = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <Harness {...props} />
    </QueryClientProvider>,
  );
};

const openCreateForm = async () => {
  await userEvent.click(screen.getByRole("button", { name: /crear periodo/i }));
};

describe("TermField", () => {
  beforeEach(() => {
    chosen = undefined;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    server.use(
      http.get("*/api/terms", () =>
        HttpResponse.json([
          { id: 2, year: 2026, period: "30" },
          { id: 1, year: 2026, period: "10" },
        ]),
      ),
    );
  });

  test("picks one of the existing terms", async () => {
    renderField();

    await userEvent.click(
      await screen.findByRole("button", { name: /periodo académico/i }),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: "202610" }),
    );

    expect(chosen).toBe(1);
  });

  test("creates the missing term from the same form and leaves it chosen", async () => {
    let body: unknown;
    let created = false;

    server.use(
      http.get("*/api/terms", () =>
        HttpResponse.json([
          ...(created ? [{ id: 7, year: 2027, period: "10" }] : []),
          { id: 2, year: 2026, period: "30" },
          { id: 1, year: 2026, period: "10" },
        ]),
      ),
      http.post("*/api/terms", async ({ request }) => {
        body = await request.json();
        created = true;

        return HttpResponse.json(
          { id: 7, year: 2027, period: "10" },
          { status: 201 },
        );
      }),
    );
    renderField();

    await openCreateForm();
    await userEvent.type(screen.getByLabelText("Año"), "2027");
    await userEvent.type(screen.getByLabelText("Código del periodo"), "10");
    await userEvent.click(
      screen.getByRole("button", { name: /crear y elegir/i }),
    );

    await waitFor(() => expect(chosen).toBe(7));
    expect(body).toEqual({ year: 2027, period: "10" });
    expect(screen.queryByLabelText("Año")).not.toBeInTheDocument();
  });

  test("shows the error of the backend when the term already exists", async () => {
    server.use(
      http.post("*/api/terms", () =>
        HttpResponse.json(
          { statusCode: 409, message: "El periodo 202610 ya existe" },
          { status: 409 },
        ),
      ),
    );
    renderField();

    await openCreateForm();
    await userEvent.type(screen.getByLabelText("Año"), "2026");
    await userEvent.type(screen.getByLabelText("Código del periodo"), "10");
    await userEvent.click(
      screen.getByRole("button", { name: /crear y elegir/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El periodo 202610 ya existe",
    );
    expect(chosen).toBeUndefined();
  });

  test("does not call the backend with a period code of one digit", async () => {
    let called = false;

    server.use(
      http.post("*/api/terms", () => {
        called = true;

        return HttpResponse.json(
          { id: 8, year: 2026, period: "1" },
          { status: 201 },
        );
      }),
    );
    renderField();

    await openCreateForm();
    await userEvent.type(screen.getByLabelText("Año"), "2026");
    await userEvent.type(screen.getByLabelText("Código del periodo"), "1");
    await userEvent.click(
      screen.getByRole("button", { name: /crear y elegir/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El código del periodo debe tener dos dígitos, como 10 o 30",
    );
    expect(called).toBe(false);
  });

  test("shows the error of the form while no term is chosen", async () => {
    renderField({ errorMessage: "El periodo académico es requerido." });

    expect(
      await screen.findByText("El periodo académico es requerido."),
    ).toBeInTheDocument();
  });

  test("cancelling the creation closes it without choosing anything", async () => {
    renderField();

    await openCreateForm();
    await userEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(screen.queryByLabelText("Año")).not.toBeInTheDocument();
    expect(chosen).toBeUndefined();
  });
});
