import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";

import { EventsDropdown } from "../events-dropdown";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent } from "@/testing/test-utils";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockPush }),
  useSearchParams: () =>
    new URLSearchParams("event=1&categoryId=3&page=4&state=APPROVED"),
  usePathname: () => "/app/assignments",
}));

const pushedParams = () => {
  const url = String(mockPush.mock.calls.at(-1)?.[0] ?? "");

  return new URLSearchParams(url.split("?")[1] ?? "");
};

beforeEach(() => {
  mockPush.mockReset();
  server.use(
    http.get("*/api/events", () =>
      HttpResponse.json({
        events: [
          { id: 1, name: "Feria 2026" },
          { id: 2, name: "Hackatón 2026" },
        ],
      }),
    ),
    http.get("*/api/events/courses/dropdown/1", () =>
      HttpResponse.json({
        courses: [
          { id: 3, code: "SIS" },
          { id: 4, code: "Civil" },
        ],
      }),
    ),
  );
});

const renderDropdown = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  rtlRender(
    <QueryClientProvider client={queryClient}>
      <EventsDropdown />
    </QueryClientProvider>,
  );
};

describe("EventsDropdown and CategoriesDropdown", () => {
  test("another event drops the previous category and goes back to the first page", async () => {
    const user = userEvent.setup();

    renderDropdown();
    await user.click(screen.getByRole("button", { name: /eventos/i }));
    await user.click(
      await screen.findByRole("option", { name: "Hackatón 2026" }),
    );

    const params = pushedParams();

    expect(params.get("event")).toBe("2");
    expect(params.has("categoryId")).toBe(false);
    expect(params.has("page")).toBe(false);
    // Filters that do not depend on the event stay
    expect(params.get("state")).toBe("APPROVED");
  });

  test("another category keeps the event and goes back to the first page", async () => {
    const user = userEvent.setup();

    renderDropdown();
    await user.click(screen.getByRole("button", { name: /categorías/i }));
    await user.click(await screen.findByRole("option", { name: "Civil" }));

    const params = pushedParams();

    expect(params.get("event")).toBe("1");
    expect(params.get("categoryId")).toBe("4");
    expect(params.has("page")).toBe(false);
  });
});
