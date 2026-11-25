import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { TeachingProfileGate } from "../teaching-profile-gate";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen, waitFor } from "@/testing/test-utils";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const renderGate = (slug: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <TeachingProfileGate profileSlug={slug}>
        <p>Pantalla de docencia</p>
      </TeachingProfileGate>
    </QueryClientProvider>,
  );
};

describe("TeachingProfileGate", () => {
  beforeEach(() => replace.mockClear());

  test("opens the screen of a profile the session holds", async () => {
    server.use(
      http.get("*/api/academic/profiles", () =>
        HttpResponse.json(["PROFESSOR"]),
      ),
    );
    renderGate("professor");

    expect(await screen.findByText("Pantalla de docencia")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  test("sends to the home page a profile the session does not hold", async () => {
    server.use(
      http.get("*/api/academic/profiles", () => HttpResponse.json(["TUTOR"])),
    );
    renderGate("professor");

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/app"));
  });

  test("offers a retry instead of leaving when the profiles fail to load", async () => {
    server.use(
      http.get("*/api/academic/profiles", () =>
        HttpResponse.json({ message: "boom" }, { status: 502 }),
      ),
    );
    renderGate("professor");

    expect(
      await screen.findByRole("button", { name: /Reintentar/i }),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
