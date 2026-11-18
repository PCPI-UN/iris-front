import { ApiError } from "@/lib/api-client";

import { getConfirmErrorState } from "../confirm-account";

describe("getConfirmErrorState", () => {
  test.each([
    [404, "El token no existe, expiró o ya fue usado"],
    [400, "El token no es válido para confirmar la cuenta"],
  ])("shows the invalid link state on %i, whatever the message", (status, message) => {
    expect(getConfirmErrorState(new ApiError(message, status))).toBe("invalid");
  });

  test.each([500, 503, 429])("shows the generic error state on %i", (status) => {
    expect(getConfirmErrorState(new ApiError("Error", status))).toBe("error");
  });

  test("shows the generic error state on a network failure", () => {
    expect(getConfirmErrorState(new TypeError("Failed to fetch"))).toBe("error");
  });
});
