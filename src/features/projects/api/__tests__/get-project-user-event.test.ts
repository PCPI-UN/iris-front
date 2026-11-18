import { afterEach, vi } from "vitest";

import { api, ApiError } from "@/lib/api-client";

import { getProject } from "../get-project-user-event";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getProject", () => {
  test("returns null when the backend answers 404, whatever the message", async () => {
    vi.spyOn(api, "get").mockRejectedValue(
      new ApiError("No se encontró un proyecto para este usuario en el evento", 404),
    );

    await expect(getProject({ eventId: "1" })).resolves.toBeNull();
  });

  test("rethrows any other error", async () => {
    const error = new ApiError("Error interno", 500);
    vi.spyOn(api, "get").mockRejectedValue(error);

    await expect(getProject({ eventId: "1" })).rejects.toBe(error);
  });

  test("returns the project and event when the backend sends them", async () => {
    const payload = { project: { id: 1 }, event: { id: 1 } };
    vi.spyOn(api, "get").mockResolvedValue(payload);

    await expect(getProject({ eventId: "1" })).resolves.toEqual(payload);
  });
});
