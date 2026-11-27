import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { ReactNode } from "react";
import { vi } from "vitest";

import { useAssignJurors, useDeleteJuror } from "../assign-jurors";

import { server } from "@/testing/mocks/server";

const setup = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { invalidate, wrapper };
};

const invalidatedKeys = (invalidate: ReturnType<typeof setup>["invalidate"]) =>
  invalidate.mock.calls.map(([filters]) => filters?.queryKey);

describe("juror assignment invalidations", () => {
  test("assigning a juror refreshes the lists with jurors (Asignaciones and Monitoreo)", async () => {
    server.use(
      http.post("*/api/projects/assign-jurors", () =>
        HttpResponse.json({ success: true }),
      ),
    );
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useAssignJurors(), { wrapper });

    result.current.mutate({ userId: 3, projectIds: [7] });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidatedKeys(invalidate)).toEqual(
      expect.arrayContaining([
        ["projects"],
        ["projects-with-jurors"],
        ["event-juries"],
      ]),
    );
  });

  test("removing a juror refreshes the same lists", async () => {
    server.use(
      http.delete("*/api/projects/7/jurors/3", () =>
        HttpResponse.json({ success: true }),
      ),
    );
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useDeleteJuror(), { wrapper });

    result.current.mutate({ projectId: "7", memberUserId: "3" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidatedKeys(invalidate)).toEqual(
      expect.arrayContaining([["projects-with-jurors"], ["event-juries"]]),
    );
  });
});
